// 9yxrKlUz10M6p5ln7Np4IgE690B2

/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const findHexathonUsers = async () => {
  await client.connect();
  const hexathonUsersCollection = client.db("hexathons").collection<any>("hexathonusers");

  /*
  hexathonUsers object:
  {
  _id: new ObjectId("68b7366dc2521379c6117f47"),
  userId: 'a78aYzNvsPZQfn0rnxOpwfsaL3P2',
  email: 'gxu82@gatech.edu',
  name: 'Ganning Xu',
  hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
  points: {
    numCollected: 50,
    numSpent: 0,
    numAdditional: 0,
    lastUpdated: 2025-09-02T18:24:40.855Z
  },
  profile: {
    matched: false,
    school: 'Abraham Baldwin Agricultural College',
    year: '4th Year',
    major: 'Applied Language and Intercultural Studies',
    skills: [ 'C#' ],
    isJudging: false,
    commitmentLevel: 'Medium',
    description: 'test description'
  },
  purchasedSwagItems: [],
  __v: 0
} */

  const res = await hexathonUsersCollection.findOne({
    hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
    userId: "9yxrKlUz10M6p5ln7Np4IgE690B2",
  });

  console.log(res);
};

(async () => {
  await findHexathonUsers();

  console.info("\nDone.");
})();
