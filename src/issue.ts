import {
  CrashesApiClient,
  CrashesApiRow,
  QueryFilterGroup,
} from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function getIssue(
  database: string,
  id: number
): Promise<CrashesApiRow> {
  const bugsplat = await createBugSplatClient();
  const crashesClient = new CrashesApiClient(bugsplat);
  const response = await crashesClient.getCrashes({
    database,
    filterGroups: [QueryFilterGroup.fromColumnValues([id.toString()], "id")],
    pageSize: 1,
  });

  if (response.rows.length === 0) {
    throw new Error(`Issue ${id} not found in database ${database}`);
  }

  return response.rows[0];
}

export function formatIssueOutput(
  row: CrashesApiRow,
  database: string
): string {
  let text = `Crash #${row.id} in database ${database} on ${row.crashTime}\n`;
  if (row.appName) {
    text += `Application: ${row.appName}\n`;
  }
  if (row.appVersion) {
    text += `Version: ${row.appVersion}\n`;
  }
  if (row.userDescription) {
    text += `Description: ${row.userDescription}\n`;
  }
  if (row.user) {
    text += `User: ${row.user}\n`;
  }
  if (row.email) {
    text += `Email: ${row.email}\n`;
  }
  if (row.exceptionCode) {
    text += `Exception Code: ${row.exceptionCode}\n`;
  }
  if (row.exceptionMessage) {
    text += `Exception Message: ${row.exceptionMessage}\n`;
  }
  if (row.ipAddress) {
    text += `IP Address: ${row.ipAddress}\n`;
  }
  if (row.stackKey) {
    text += `Stack Key: ${row.stackKey}\n`;
  }
  if (row.stackKeyId) {
    text += `Stack Key ID: ${row.stackKeyId}\n`;
  }

  return text;
}
