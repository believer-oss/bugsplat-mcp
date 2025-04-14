import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkCredentials } from "./bugsplat.js";
import { formatIssueOutput, getIssue } from "./issue.js";
import { formatIssuesOutput, getIssues } from "./issues.js";
import { formatSummaryOutput, getSummary } from "./summary.js";

const server = new McpServer({
  name: "bugsplat-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "get-issues",
  "Get BugSplat issues with optional filtering. The issues tool lists the all crashes in the BugSplat database and is useful for determining the most recent crashes.",
  {
    application: z
      .string()
      .optional()
      .describe("Application name to filter by"),
    version: z.string().optional().describe("Version to filter by"),
    stackGroup: z.string().optional().describe("Stack group to filter by"),
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
      .default(10)
      .describe("Number of results per page (1-100, defaults to 10)"),
  },
  async ({ application, version, stackGroup, startDate, endDate, pageSize }) => {
    try {
      checkCredentials();
      const rows = await getIssues(process.env.BUGSPLAT_DATABASE!, {
        application,
        version,
        stackGroup,
        startDate,
        endDate,
        pageSize,
      });

      const output = formatIssuesOutput(rows, process.env.BUGSPLAT_DATABASE!);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-issue",
  "Get details of a specific BugSplat issue. The issue tool lists the details of a specific crash and is useful for determining the cause of and fixing a specific crash.",
  {
    id: z.number().describe("Issue ID to retrieve"),
  },
  async ({ id }) => {
    try {
      checkCredentials();
      const row = await getIssue(process.env.BUGSPLAT_DATABASE!, id);
      const output = formatIssueOutput(row, process.env.BUGSPLAT_DATABASE!);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-summary",
  "Get summary of BugSplat issues with optional filtering. The summary tool lists information about groups of crashes and is useful for determining what issues are most prevalent.",
  {
    applications: z
      .array(z.string())
      .optional()
      .describe("Application names to filter by"),
    versions: z
      .array(z.string())
      .optional()
      .describe("Versions to filter by"),
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
  async ({ applications, versions, startDate, endDate, pageSize }) => {
    try {
      checkCredentials();
      const rows = await getSummary(process.env.BUGSPLAT_DATABASE!, {
        applications,
        versions,
        startDate,
        endDate,
        pageSize,
      });

      const output = formatSummaryOutput(rows);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

interface McpResponse {
  [key: string]: unknown;
  content: {
    type: "text";
    text: string;
  }[];
  isError?: boolean;
}

function createSuccessResponse(text: string): McpResponse {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

function createErrorResponse(error: unknown): McpResponse {
  const message =
    error instanceof Error ? error.message : "An unknown error occurred";
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
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
