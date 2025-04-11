import {
  QueryFilterGroup,
  SummaryApiClient,
  SummaryApiRow,
} from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function getSummary(
  database: string,
  options: {
    application?: string;
    version?: string;
    startDate?: string;
    endDate?: string;
    pageSize?: number;
  }
): Promise<SummaryApiRow[]> {
  const bugsplat = await createBugSplatClient();
  const summaryClient = new SummaryApiClient(bugsplat);
  let filterGroups: QueryFilterGroup[] = [];

  if (options.application) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues([options.application], "application")
    );
  }

  if (options.version) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues([options.version], "version")
    );
  }

  if (options.startDate) {
    // TODO BG GREATER_THAN
    // filterGroups.push(
    //   QueryFilterGroup.fromColumnValues([new Date(options.startDate).toISOString()], "firstReport")
    // );
  }

  if (options.endDate) {
    // TODO BG LESS_THAN
    // filterGroups.push(
    //   QueryFilterGroup.fromColumnValues([new Date(options.endDate).toISOString()], "firstReport")
    // );
  }

  const response = await summaryClient.getSummary({
    database,
    filterGroups,
    pageSize: options.pageSize
  });

  return response.rows;
}

export function formatSummaryOutput(rows: SummaryApiRow[]): string {
  return rows
    .map((row) => {
      return `Summary for ${row.stackKey} from ${row.firstReport} to ${row.lastReport} ${row.crashSum} crashes`;
    })
    .join("\n");
}
