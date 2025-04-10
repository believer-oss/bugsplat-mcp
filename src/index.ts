import {
  CrashApiClient,
  CrashDetails,
  CrashesApiClient,
  CrashesApiRow,
  OAuthClientCredentialsClient,
  QueryFilterGroup,
  SummaryApiClient,
  SummaryApiRow,
} from "@bugsplat/js-api-client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "bugsplat-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function to check credentials before executing any tool
function checkCredentials() {
  const missingEnvVars = [
    "BUGSPLAT_DATABASE",
    "BUGSPLAT_CLIENT_ID",
    "BUGSPLAT_CLIENT_SECRET",
  ].filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: Missing required environment variables: ${missingEnvVars.join(
            ", "
          )}`,
        },
      ],
      isError: true,
    };
  }
  return null;
}

async function createBugSplatClient() {
  return OAuthClientCredentialsClient.createAuthenticatedClient(
    process.env.BUGSPLAT_CLIENT_ID!,
    process.env.BUGSPLAT_CLIENT_SECRET!
  );
}

// Register BugSplat tools
server.tool(
  "get-issues",
  "Get BugSplat issues with optional filtering. The issues tool lists the all crashes in the BugSplat database and is useful for determining the most recent crashes.",
  {
    application: z
      .string()
      .optional()
      .describe("Application name to filter by"),
    version: z.string().optional().describe("Version to filter by"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for filtering (ISO format)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for filtering (ISO format)"),
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .describe("Number of results per page (1-100, defaults to 10)"),
  },
  async ({ application, version, startDate, endDate, pageSize }) => {
    const credentialsError = checkCredentials();
    if (credentialsError) return credentialsError;

    const bugsplat = await createBugSplatClient();
    const crashesClient = new CrashesApiClient(bugsplat);
    let filterGroups: QueryFilterGroup[] = [];

    if (application) {
      filterGroups.push(
        QueryFilterGroup.fromColumnValues([application], "application")
      );
    }

    if (version) {
      filterGroups.push(
        QueryFilterGroup.fromColumnValues([version], "version")
      );
    }

    if (startDate || endDate) {
      filterGroups.push(
        QueryFilterGroup.fromTimeFrame(
          "date",
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        )
      );
    }

    const crashes = await crashesClient.getCrashes({
      database: process.env.BUGSPLAT_DATABASE!,
      filterGroups,
      pageSize,
    });

    const output = formatIssuesOutput(crashes.rows);

    return {
      content: [
        {
          type: "text" as const,
          text: output,
        },
      ],
    };
  }
);

server.tool(
  "get-issue",
  "Get details of a specific BugSplat issue. The issue tool lists the details of a specific crash and is useful for determining the cause of and fixing a specific crash.",
  {
    id: z.number().describe("Issue ID to retrieve"),
  },
  async ({ id }) => {
    const credentialsError = checkCredentials();
    if (credentialsError) return credentialsError;

    const bugsplat = await createBugSplatClient();
    const crashClient = new CrashApiClient(bugsplat);
    const crash = await crashClient.getCrashById(
      process.env.BUGSPLAT_DATABASE!,
      id
    );

    const output = formatIssueOutput(crash);

    return {
      content: [
        {
          type: "text" as const,
          text: output,
        },
      ],
    };
  }
);

server.tool(
  "get-summary",
  "Get summary of BugSplat issues with optional filtering. The summary tool lists information about groups of crashes and is useful for determining what issues are most prevalent.",
  {
    application: z
      .string()
      .optional()
      .describe("Application name to filter by"),
    version: z.string().optional().describe("Version to filter by"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for filtering (ISO format)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for filtering (ISO format)"),
    pageSize: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(10)
      .describe("Number of results per page (1-20, defaults to 10)"),
  },
  async ({ application, version, startDate, endDate, pageSize }) => {
    const credentialsError = checkCredentials();
    if (credentialsError) return credentialsError;

    const bugsplat = await createBugSplatClient();
    const summaryClient = new SummaryApiClient(bugsplat);
    let filterGroups: QueryFilterGroup[] = [];

    if (application) {
      filterGroups.push(
        QueryFilterGroup.fromColumnValues([application], "application")
      );
    }

    if (version) {
      filterGroups.push(
        QueryFilterGroup.fromColumnValues([version], "version")
      );
    }

    if (startDate) {
      // filterGroups
      //   .push
      // TODO BG GREATER_THAN
      // QueryFilterGroup.fromColumnValues([new Date(startDate).toISOString()], "firstReport")
      // ();
    }

    if (endDate) {
      // filterGroups
      //   .push
      // TODO BG LESS_THAN
      // QueryFilterGroup.fromColumnValues([new Date(endDate).toISOString()], "firstReport")
      // ();
    }

    const response = await summaryClient.getSummary({
      database: process.env.BUGSPLAT_DATABASE!,
      filterGroups,
      pageSize,
    });

    const output = formatSummaryOutput(response.rows);

    return {
      content: [
        {
          type: "text" as const,
          text: output,
        },
      ],
    };
  }
);

function formatIssueOutput(crash: CrashDetails) {
  let text = `Crash #${crash.id} in database ${process.env.BUGSPLAT_DATABASE} on ${crash.crashTime}\n`;
  if (crash.appName) {
    text += `Application: ${crash.appName}\n`;
  }
  if (crash.appVersion) {
    text += `Version: ${crash.appVersion}\n`;
  }
  if (crash.appKey) {
    text += `Key: ${crash.appKey}\n`;
  }
  if (crash.user) {
    text += `User: ${crash.user}\n`;
  }
  if (crash.email) {
    text += `Email: ${crash.email}\n`;
  }
  if (crash.exceptionCode) {
    text += `Exception Code: ${crash.exceptionCode}\n`;
  }
  if (crash.exceptionMessage) {
    text += `Exception Message: ${crash.exceptionMessage}\n`;
  }
  if (crash.ipAddress) {
    text += `IP Address: ${crash.ipAddress}\n`;
  }
  if (crash.description) {
    text += `User Description: ${crash.description}\n`;
  }
  if (crash.comments) {
    text += `Comments: ${crash.comments}\n`;
  }
  if (crash.stackKeyComment) {
    text += `Stack Group Comment: ${crash.stackKeyComment}\n`;
  }
  if (crash.thread) {
    text += `Stack Trace:\n${crash.thread.stackFrames
      .map((frame) => {
        let stackFrame = frame.functionName;
        if (frame.lineNumber) {
          stackFrame += `:${frame.lineNumber}`;
        }
        if (frame.fileName) {
          stackFrame += ` (${frame.fileName})`;
        }
        return `${stackFrame}`;
      })
      .join("\n")}`;
  }
  return text;
}

function formatIssuesOutput(rows: CrashesApiRow[]) {
  return rows
    .map((row, i) => {
      let text = `Crash #${row.id} in database ${process.env.BUGSPLAT_DATABASE} on ${row.crashTime}\n`;
      if (row.appName) {
        text += `Application: ${row.appName}\n`;
      }
      if (row.appVersion) {
        text += `Version: ${row.appVersion}\n`;
      }
      if (row.appDescription) {
        text += `Key: ${row.appDescription}\n`;
      }
      if (row.user) {
        text += `User: ${row.user}\n`;
      }
      if (row.email) {
        text += `Email: ${row.email}\n`;
      }
      if (row.stackKey) {
        text += `\n${row.stackKey}`;
      }
      if (i < rows.length - 1) {
        text += "\n\n--------------------------------\n\n";
      }
      return text;
    })
    .join("");
}

function formatSummaryOutput(rows: SummaryApiRow[]) {
  return rows
    .map((row, i) => {
      return `Summary for ${row.stackKey} from ${row.firstReport} to ${row.lastReport} ${row.crashSum} crashes`;
    })
    .join("\n");
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BugSplat MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
