import axios, { AxiosResponse } from "axios";

const REGISTRATION_GRAPHQL_URL =
  process.env.REGISTRATION_GRAPHQL_URL || "https://registration.hack.gt/graphql";

export async function queryRegistration(email: string): Promise<AxiosResponse<any>> {
  const query = `
    query($search: String!) {
      search_user(search: $search, offset: 0, n: 1) {
        users {
          id
          name
          email
          confirmationBranch
          confirmed
          application {
            type
          }
        }
      }
    }`;

  const variables = {
    search: email,
  };

  try {
    const response = await axios.post(
      REGISTRATION_GRAPHQL_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(
            process.env.REGISTRATION_GRAPHQL_AUTH || "",
            "utf8"
          ).toString("base64")}`,
        },
      }
    );

    return response;
  } catch (error: any) {
    throw new Error(JSON.stringify(error.response.data));
  }
}
