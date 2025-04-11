import { OAuthClientCredentialsClient } from "@bugsplat/js-api-client";

export async function createBugSplatClient() {
  if (!process.env.BUGSPLAT_CLIENT_ID || !process.env.BUGSPLAT_CLIENT_SECRET) {
    throw new Error(
      "Missing required environment variables: BUGSPLAT_CLIENT_ID, BUGSPLAT_CLIENT_SECRET"
    );
  }
  return OAuthClientCredentialsClient.createAuthenticatedClient(
    process.env.BUGSPLAT_CLIENT_ID,
    process.env.BUGSPLAT_CLIENT_SECRET
  );
}

export function checkCredentials() {
  const missingEnvVars = [
    "BUGSPLAT_DATABASE",
    "BUGSPLAT_CLIENT_ID",
    "BUGSPLAT_CLIENT_SECRET",
  ].filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
  }
}
