import { config } from "dotenv";
import { getIssues, formatIssuesOutput } from "../src/issues.js";
import { postAndWaitForCrashToProcess } from "./crash.js";

// Load environment variables from .env file
config();

const database = process.env.BUGSPLAT_DATABASE!;
const application = "test";
const version = "1.0.0";
const description = "Test crash";

describe("issues integration", () => {
  let crashId: number;
  beforeAll(async () => {
    crashId = await postAndWaitForCrashToProcess(
      database,
      application,
      version,
      {
        description,
      }
    );
    await postAndWaitForCrashToProcess(database, application, version, {
      description,
    });
  });

  describe("getIssues", () => {
    it("should fetch issues from BugSplat", async () => {
      const result = await getIssues(database, {
        pageSize: 5,
        application,
        version,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const testCrash = result.find((issue) => issue.id === crashId);
      expect(testCrash).toBeDefined();
      expect(testCrash?.appName).toBe(application);
      expect(testCrash?.appVersion).toBe(version);
      expect(testCrash?.userDescription).toBe(description);
    });

    it("should apply filters correctly", async () => {
      const result = await getIssues(database, {
        application,
        version,
        pageSize: 5,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const testCrash = result.find((issue) => issue.id === crashId);
      expect(testCrash).toBeDefined();
      expect(testCrash?.appName).toBe(application);
      expect(testCrash?.appVersion).toBe(version);
    });
  });

  describe("formatIssuesOutput", () => {
    it("should format multiple issues from BugSplat", async () => {
      const crashes = await getIssues(database, {
        application,
        version,
        pageSize: 2,
      });

      const output = formatIssuesOutput(crashes, database);

      expect(output).toContain(`Crash #${crashId} in database ${database}`);
      expect(output).toContain(`Application: ${application}`);
      expect(output).toContain(`Version: ${version}`);
      expect(output).toContain(`Description: ${description}`);
    });
  });
});
