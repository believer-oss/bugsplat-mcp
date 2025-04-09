import {
  CrashesApiClient,
  CrashesApiRow,
  OAuthClientCredentialsClient,
  QueryFilterGroup,
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
  "Get BugSplat issues with optional filtering",
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
  },
  async ({ application, version, startDate, endDate }) => {
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
      pageSize: 5,
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
  "Get details of a specific BugSplat issue",
  {
    id: z.string().describe("Issue ID to retrieve"),
  },
  async ({ id }) => {
    const credentialsError = checkCredentials();
    if (credentialsError) return credentialsError;

    // TODO: Implement BugSplat API integration
    return {
      content: [
        {
          type: "text" as const,
          text: "Get issue details functionality to be implemented",
        },
      ],
    };
  }
);

server.tool(
  "get-summary",
  "Get summary of BugSplat issues with optional filtering",
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
  },
  async ({ application, version, startDate, endDate }) => {
    const credentialsError = checkCredentials();
    if (credentialsError) return credentialsError;

    // TODO: Implement BugSplat API integration
    return {
      content: [
        {
          type: "text" as const,
          text: "Get summary functionality to be implemented",
        },
      ],
    };
  }
);

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BugSplat MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
