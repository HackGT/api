import express from "express";
import { createHash } from "crypto";
import { asyncHandler, BadRequestError, ConfigError, getAllSmallest } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdmin, isAdminOrIsJudging } from "../utils/utils";
import { AssignmentStatus, Assignment } from "@api/prisma-expo/generated";

// ── Types for in-memory computation ─────────────────────────────────────────

type ProjectWithAssignments = {
  id: number;
  tableGroupId: number | null;
  categories: { id: number }[];
  assignment: { categoryIds: number[]; status: string; userId: number }[];
};

// ── Helper functions (pure, in-memory) ──────────────────────────────────────

/** Projects in a room that match the judge's categories */
function avail(
  roomId: number,
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[]
): ProjectWithAssignments[] {
  return projects.filter(
    p =>
      p.tableGroupId === roomId &&
      p.categories.some(c => judgeCategoryIds.includes(c.id))
  );
}

/** Count of completed + queued assignments for a project, scoped to relevant categories */
function judgedCount(p: ProjectWithAssignments, judgeCategoryIds: number[]): number {
  return p.assignment.filter(
    a =>
      (a.status === "COMPLETED" || a.status === "QUEUED") &&
      a.categoryIds.some(id => judgeCategoryIds.includes(id))
  ).length;
}

/** Lowest judged count among projects the judge is eligible for in a room */
function minCount(
  judgeId: number,
  roomId: number,
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[]
): number {
  const candidates = eligible(judgeId, roomId, projects, judgeCategoryIds);
  if (candidates.length === 0) return Infinity;
  return Math.min(...candidates.map(p => judgedCount(p, judgeCategoryIds)));
}

/** Eligible projects at min count minus active judges in the room */
function need(
  judgeId: number,
  roomId: number,
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[],
  queuedCounts: Map<number, number>
): number {
  const candidates = eligible(judgeId, roomId, projects, judgeCategoryIds);
  const mc = minCount(judgeId, roomId, projects, judgeCategoryIds);
  const atMin = candidates.filter(p => judgedCount(p, judgeCategoryIds) === mc).length;
  return atMin - (queuedCounts.get(roomId) ?? 0);
}

/** Pick best room: lowest minCount, tiebreak by highest need */
function pickRoom(
  judgeId: number,
  roomIds: number[],
  bannedRoomIds: number[],
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[],
  queuedCounts: Map<number, number>
): { roomId: number; mc: number } | null {
  const candidates = roomIds.filter(id => !bannedRoomIds.includes(id));
  if (candidates.length === 0) return null;

  let bestRoom = candidates[0];
  let bestMc = minCount(judgeId, bestRoom, projects, judgeCategoryIds);
  let bestNeed = need(judgeId, bestRoom, projects, judgeCategoryIds, queuedCounts);

  for (let i = 1; i < candidates.length; i++) {
    const rid = candidates[i];
    const mc = minCount(judgeId, rid, projects, judgeCategoryIds);
    const n = need(judgeId, rid, projects, judgeCategoryIds, queuedCounts);
    if (mc < bestMc || (mc === bestMc && n > bestNeed)) {
      bestRoom = rid;
      bestMc = mc;
      bestNeed = n;
    }
  }

  return { roomId: bestRoom, mc: bestMc };
}

/** Projects the judge can actually judge right now in a room */
function eligible(
  judgeId: number,
  roomId: number,
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[]
): ProjectWithAssignments[] {
  return avail(roomId, projects, judgeCategoryIds).filter(p => {
    return !p.assignment.some(a => a.userId === judgeId);
  });
}

/** Main project selection with room routing */
function pickProject(
  judgeId: number,
  session: { currentTableGroupId: number | null; minCountOnArrival: number; bannedTableGroupIds: number[] },
  roomIds: number[],
  projects: ProjectWithAssignments[],
  judgeCategoryIds: number[],
  queuedCounts: Map<number, number>
): { project: ProjectWithAssignments; roomId: number; minCountOnArrival: number; roomSwitched: boolean; bannedRoomIds: number[] } | null {
  let { currentTableGroupId, minCountOnArrival, bannedTableGroupIds } = session;
  const banned = [...bannedTableGroupIds];
  let roomSwitched = false;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 1. Get a room — either current or pick a new one
    if (currentTableGroupId == null) {
      const result = pickRoom(judgeId, roomIds, banned, projects, judgeCategoryIds, queuedCounts);
      if (!result) return null;
      currentTableGroupId = result.roomId;
      minCountOnArrival = result.mc;
      roomSwitched = true;
    }

    // 2. Should we leave? If room's min_count has risen since we arrived,
    //    there might be a better room now
    if (minCount(judgeId, currentTableGroupId, projects, judgeCategoryIds) > minCountOnArrival) {
      const result = pickRoom(judgeId, roomIds, banned, projects, judgeCategoryIds, queuedCounts);
      if (!result) return null;
      currentTableGroupId = result.roomId;
      minCountOnArrival = result.mc;
      roomSwitched = true;
    }

    // 3. Find projects we can actually judge right now
    const candidates = eligible(judgeId, currentTableGroupId, projects, judgeCategoryIds);

    if (candidates.length > 0) {
      // 4. Pick the least-judged project, random tiebreak
      const finalists = getAllSmallest(candidates, p => judgedCount(p, judgeCategoryIds));
      const selected = finalists[Math.floor(Math.random() * finalists.length)];
      return { project: selected, roomId: currentTableGroupId, minCountOnArrival, roomSwitched, bannedRoomIds: banned };
    }

    // 5. Judge has done every project in this room — permanently ban it
    banned.push(currentTableGroupId);
    currentTableGroupId = null;
  }
}

// ── autoAssign ──────────────────────────────────────────────────────────────

const autoAssign = async (judgeId: number): Promise<Assignment | null> => {
  const config = await getConfig();
  if (!config.currentHexathon) {
    throw new ConfigError("Current hexathon is not setup yet.");
  }

  // Get judge with category group for current hexathon
  const judge = await prisma.user.findUnique({
    where: {
      id: judgeId,
      categoryGroups: {
        some: { hexathon: config.currentHexathon },
      },
    },
    include: {
      categoryGroups: { include: { categories: true } },
    },
  });
  if (!judge) {
    throw new BadRequestError("Judge not found with assigned category group for current hexathon");
  }

  const judgeCategories = judge.categoryGroups.find(
    cg => cg.hexathon === config.currentHexathon
  )?.categories;
  if (!judgeCategories) {
    throw new BadRequestError("Invalid category group for this judge");
  }

  const judgeCategoryIds = judgeCategories.map(c => c.id);

  return await prisma.$transaction(async tx => {
    const lockKey = createHash("sha256")
      .update(`${config.currentHexathon}:${config.currentExpo}:${config.currentRound}`)
      .digest()
      .readBigInt64BE(0);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    // Single upfront query: all projects in this hexathon/expo/round with assignments
    const projects = await tx.project.findMany({
      where: {
        hexathon: config.currentHexathon!,
        expo: config.currentExpo,
        round: config.currentRound,
        tableGroupId: { not: null },
        categories: {
          some: { id: { in: judgeCategoryIds } },
        },
      },
      select: {
        id: true,
        tableGroupId: true,
        categories: { select: { id: true } },
        assignment: {
          select: { categoryIds: true, status: true, userId: true },
        },
      },
    });

    // Collect all distinct room IDs
    const roomIds = Array.from(new Set(projects.map(p => p.tableGroupId!)));
    if (roomIds.length === 0) return null;

    // Build queued counts per room
    const queuedCounts = new Map<number, number>();
    for (const p of projects) {
      const queued = p.assignment.filter(a => a.status === "QUEUED").length;
      if (p.tableGroupId != null && queued > 0) {
        queuedCounts.set(p.tableGroupId, (queuedCounts.get(p.tableGroupId) ?? 0) + queued);
      }
    }

    // Get or create judging session
    let session = await tx.judgingSession.findUnique({
      where: {
        userId_hexathon: { userId: judge.id, hexathon: config.currentHexathon! },
      },
    });
    if (!session) {
      session = await tx.judgingSession.create({
        data: {
          userId: judge.id,
          hexathon: config.currentHexathon!,
        },
      });
    }

    // Run room-based project selection
    const result = pickProject(
      judge.id,
      session,
      roomIds,
      projects,
      judgeCategoryIds,
      queuedCounts
    );
    if (!result) return null;

    // Update session state
    const newSwitchCount = result.roomSwitched && session.currentTableGroupId != null
      ? session.roomSwitchCount + 1
      : session.roomSwitchCount;

    await tx.judgingSession.update({
      where: { id: session.id },
      data: {
        currentTableGroupId: result.roomId,
        minCountOnArrival: result.minCountOnArrival,
        bannedTableGroupIds: result.bannedRoomIds,
        roomSwitchCount: newSwitchCount,
      },
    });

    // Determine categories to judge (intersection of judge's and project's categories)
    const categoriesToJudge = result.project.categories
      .filter(c => judgeCategoryIds.includes(c.id))
      .map(c => c.id);

    return await tx.assignment.create({
      data: {
        userId: judge.id,
        projectId: result.project.id,
        status: AssignmentStatus.QUEUED,
        categoryIds: categoriesToJudge,
      },
    });
  });
};

// ── Routes ──────────────────────────────────────────────────────────────────

export const assignmentRoutes = express.Router();

assignmentRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon, expo, round, categoryGroup } = req.query;
    const filter: any = {};
    if (hexathon || expo || round) {
      filter.project = {};
    }

    if (hexathon !== undefined) {
      filter.project.hexathon = hexathon;
    }

    if (expo !== undefined) {
      const expoNumber: number = parseInt(expo as string);
      filter.project.expo = expoNumber;
    }

    if (round !== undefined) {
      const roundNumber: number = parseInt(round as string);
      filter.project.round = roundNumber;
    }

    if (categoryGroup !== undefined) {
      const categoryGroupId: number = parseInt(categoryGroup as string);
      filter.user = {
        categoryGroupId,
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: filter,
    });
    res.status(200).json(assignments);
  })
);

assignmentRoutes.route("/current-project").get(
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new Error("Current hexathon is not setup yet.");
    }

    const user = await prisma.user.findUnique({
      where: {
        userId: req.user?.uid ?? "",
        categoryGroups: {
          some: {
            hexathon: config.currentHexathon,
          },
        },
      },
      include: {
        categoryGroups: {
          include: {
            categories: {
              include: {
                criterias: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestError("Invalid user");
    }

    const currentAssignments = await prisma.assignment.findMany({
      where: {
        userId: user.id,
        status: AssignmentStatus.QUEUED,
        project: {
          hexathon: config.currentHexathon,
        },
      },
      orderBy: [
        {
          createdAt: "asc",
        },
        {
          priority: "desc",
        },
      ],
    });

    let assignment;
    if (config.isJudgingOn && currentAssignments.length === 0) {
      // Call auto assign if judging is on and there are no assignments
      assignment = await autoAssign(user.id);
    } else if (currentAssignments.length > 0) {
      assignment = currentAssignments[0]; // eslint-disable-line prefer-destructuring
    }

    // auto assign returns null if there are no projects to assign to the judge
    if (!assignment) {
      res.status(200).json();
      return;
    }

    const project = await prisma.project.findUnique({
      where: {
        id: assignment.projectId,
      },
      include: {
        categories: { include: { criterias: true } },
      },
    });

    // filter categories to only include categories that the judge is assigned to
    const filteredCategories = user.categoryGroups
      .find(categoryGroup => categoryGroup.hexathon === config.currentHexathon)
      ?.categories.filter(
        category => project?.categories.some(c => c.id === category.id)
      );

    const assignedProject = {
      ...project,
      categories: filteredCategories,
      assignment,
    };
    res.status(200).json(assignedProject);
  })
);

assignmentRoutes.route("/").post(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new Error("Current hexathon is not setup yet.");
    }

    const [judge, project] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: req.body.user,
          categoryGroups: {
            some: {
              hexathon: config.currentHexathon,
            },
          },
        },
        include: {
          categoryGroups: {
            include: {
              categories: true,
            },
          },
        },
      }),
      prisma.project.findUnique({
        where: {
          id: req.body.project,
          hexathon: config.currentHexathon,
        },
        include: {
          categories: true,
        },
      }),
    ]);
    if (!judge) {
      throw new BadRequestError(
        "Judge not found with assigned category group for current hexathon"
      );
    }
    if (!project) {
      throw new BadRequestError("Invalid project provided");
    }

    const existingAssignmentForProject = await prisma.assignment.findFirst({
      where: {
        userId: req.body.user,
        projectId: req.body.project,
      },
    });

    if (existingAssignmentForProject?.status === AssignmentStatus.QUEUED) {
      throw new BadRequestError("Judge already has this project queued");
    } else if (existingAssignmentForProject?.status === AssignmentStatus.COMPLETED) {
      throw new BadRequestError("Judge has already judged this project.");
    }

    const judgeCategoryIds = judge.categoryGroups
      .find(cg => cg.hexathon === config.currentHexathon)
      ?.categories.map(c => c.id) ?? [];

    const categoriesToJudge = project.categories
      .filter(c => judgeCategoryIds.includes(c.id))
      .map(c => c.id);

    const upsertAssignment = await prisma.assignment.upsert({
      where: {
        id: existingAssignmentForProject?.id ?? -1,
      },
      update: {
        status: AssignmentStatus.QUEUED,
        categoryIds: {
          set: categoriesToJudge,
        },
      },
      create: {
        userId: req.body.user,
        projectId: req.body.project,
        status: AssignmentStatus.QUEUED,
        categoryIds: categoriesToJudge,
      },
    });
    res.status(200).json(upsertAssignment);
  })
);

assignmentRoutes.route("/:id").patch(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body.data,
    });

    res.status(200).json(updatedAssignment);
  })
);

assignmentRoutes.route("/autoAssign").post(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const createdAssignment = await autoAssign(req.body.judge);
    res.status(200).json(createdAssignment);
  })
);

// ── Initial judge distribution ──────────────────────────────────────────────

assignmentRoutes.route("/distribute-judges").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new ConfigError("Current hexathon is not setup yet.");
    }

    // Get all judges with category groups for this hexathon
    const judges = await prisma.user.findMany({
      where: {
        categoryGroups: {
          some: { hexathon: config.currentHexathon },
        },
      },
      include: {
        categoryGroups: { include: { categories: true } },
      },
    });

    // Get all table groups with project counts per category
    const tableGroups = await prisma.tableGroup.findMany({
      where: { hexathon: config.currentHexathon },
      include: {
        projects: {
          where: {
            expo: config.currentExpo,
            round: config.currentRound,
          },
          select: { categories: { select: { id: true } } },
        },
      },
    });

    // Group judges by their category group
    const judgesByCategoryGroup = new Map<number, typeof judges>();
    for (const judge of judges) {
      const cg = judge.categoryGroups.find(g => g.hexathon === config.currentHexathon);
      if (!cg) continue;
      const list = judgesByCategoryGroup.get(cg.id) ?? [];
      list.push(judge);
      judgesByCategoryGroup.set(cg.id, list);
    }

    const sessions: { userId: number; hexathon: string; currentTableGroupId: number; minCountOnArrival: number }[] = [];

    // For each category group, distribute its judges across rooms proportionally
    for (const [cgId, cgJudges] of judgesByCategoryGroup) {
      const categoryIds = cgJudges[0].categoryGroups
        .find(g => g.id === cgId)
        ?.categories.map(c => c.id) ?? [];

      // Count eligible projects per room for this category group
      const roomCounts = new Map<number, number>();
      for (const tg of tableGroups) {
        const count = tg.projects.filter(p =>
          p.categories.some(c => categoryIds.includes(c.id))
        ).length;
        if (count > 0) {
          roomCounts.set(tg.id, count);
        }
      }

      const total = [...roomCounts.values()].reduce((a, b) => a + b, 0);
      if (total === 0) continue;

      // Proportional allocation with largest remainder method
      const n = cgJudges.length;
      const exact = new Map<number, number>();
      for (const [rid, count] of roomCounts) {
        exact.set(rid, (n * count) / total);
      }

      const floors = new Map<number, number>();
      for (const [rid, v] of exact) {
        floors.set(rid, Math.floor(v));
      }

      const remainders = [...exact.entries()].sort(
        (a, b) => (b[1] - Math.floor(b[1])) - (a[1] - Math.floor(a[1]))
      );
      let extras = n - [...floors.values()].reduce((a, b) => a + b, 0);
      const alloc = new Map(floors);
      for (const [rid] of remainders) {
        if (extras <= 0) break;
        alloc.set(rid, (alloc.get(rid) ?? 0) + 1);
        extras--;
      }

      // Assign judges to rooms
      let judgeIdx = 0;
      for (const [rid, count] of alloc) {
        for (let i = 0; i < count && judgeIdx < cgJudges.length; i++) {
          sessions.push({
            userId: cgJudges[judgeIdx].id,
            hexathon: config.currentHexathon!,
            currentTableGroupId: rid,
            minCountOnArrival: 0,
          });
          judgeIdx++;
        }
      }
    }

    // Upsert all sessions
    const results = await Promise.all(
      sessions.map(s =>
        prisma.judgingSession.upsert({
          where: {
            userId_hexathon: { userId: s.userId, hexathon: s.hexathon },
          },
          update: {
            currentTableGroupId: s.currentTableGroupId,
            minCountOnArrival: 0,
            bannedTableGroupIds: [],
            roomSwitchCount: 0,
          },
          create: s,
        })
      )
    );

    res.status(200).json({
      distributed: results.length,
      sessions: results,
    });
  })
);

assignmentRoutes.route("/reset-judging").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const config = await getConfig();
    if (!config.currentHexathon) {
      throw new ConfigError("Current hexathon is not setup yet.");
    }

    const [deletedBallots, deletedAssignments, deletedSessions] = await prisma.$transaction([
      prisma.ballot.deleteMany({
        where: {
          project: { hexathon: config.currentHexathon },
        },
      }),
      prisma.assignment.deleteMany({
        where: {
          project: { hexathon: config.currentHexathon },
        },
      }),
      prisma.judgingSession.deleteMany({
        where: { hexathon: config.currentHexathon },
      }),
    ]);

    res.status(200).json({
      deletedBallots: deletedBallots.count,
      deletedAssignments: deletedAssignments.count,
      deletedSessions: deletedSessions.count,
    });
  })
);
