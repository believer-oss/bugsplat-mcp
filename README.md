# BugSplat MCP Server Prototype

This is a prototype implementation of a Model Context Protocol (MCP) server for BugSplat integration.

## Getting Started 👨‍🏫

1. Add a local MCP server to [Claude Desktop](https://claude.ai/download) via `Settings > Developer > Edit Config`. Add the path to `npx` under `command` and `-y`, `bugsplat-mcp@latest` under `args`. Finally add env values for `BUGSPLAT_DATABASE`, `BUGSPLAT_CLIENT_ID`, and `BUGSPLAT_CLIENT_SECRET`.
```json
{
  "mcpServers": {
    ...
    "bugsplat-mcp": {
      "command": "npx",
      "args": ["-y", "bugsplat-mcp@latest"],
      "env": {
        "BUGSPLAT_DATABASE": "fred",
        "BUGSPLAT_CLIENT_ID": "***",
        "BUGSPLAT_CLIENT_SECRET": "***"
      }
    }
  }
}
```

2. Open Claude and ask about BugSplat.

## Available Tools 🧰

The server provides the following tools for interacting with BugSplat:

### list-issues
List BugSplat issues with optional filtering. The issues tool lists all crashes in the BugSplat database and is useful for determining the most recent crashes.
- `application`: Application name to filter by
- `version`: Version to filter by
- `stackGroup`: Stack group to filter by
- `startDate`: Start date for filtering (ISO format)
- `endDate`: End date for filtering (ISO format)
- `pageSize`: Number of results per page (1-100, defaults to 10)

### get-issue
Get details of a specific BugSplat issue. The issue tool lists the details of a specific crash and is useful for determining the cause of and fixing a specific crash.
- `id`: Issue ID to retrieve

### get-key-crashes
Get all crashes for a specific Stack Key ID (crash group). This tool lists all individual crashes that belong to the same crash group, which is useful for analyzing patterns within a specific type of crash.
- `stackKeyId`: The Stack Key ID to get crashes for
- `pageSize`: Number of results per page (1-100, defaults to 10)

### get-summary
Get summary of BugSplat issues with optional filtering. The summary tool lists information about groups of crashes and is useful for determining what issues are most prevalent.
- `applications`: Array of application names to filter by
- `versions`: Array of versions to filter by
- `startDate`: Start date for filtering (ISO format)
- `endDate`: End date for filtering (ISO format)
- `pageSize`: Number of results per page (1-20, defaults to 10)

### list-attachments
Get list of attachments for a specific BugSplat issue. The attachments tool lists the attachments (log files, screenshots, etc.) for a specific crash and is useful for determining the cause of and fixing a specific crash.
- `id`: Issue ID to retrieve

### get-attachment
Get a specific attachment for a BugSplat issue. Returns the file content as a base64 blob. Supports pagination for large files to avoid exceeding token limits.
- `crashId`: The ID of the crash report
- `file`: The name of the attachment file to retrieve
- `offset`: Starting byte position (optional, defaults to 0)
- `limit`: Maximum number of bytes to read (optional, 1-1048576, defaults to 262144 bytes)

**Pagination Support**: Large attachment files are automatically chunked to prevent token limit errors. The response includes pagination metadata showing current position, total file size, and the next offset to use for subsequent requests.

### create-defect
Create a new defect in a connected defect tracking system.
- `stackKeyId`: The Stack Key ID you'd like to log as a defect
- `notes`: Notes about the defect you'd like to log

### add-defect-link
Add a link between a BugSplat issue and an existing defect in a connected defect tracking system.
- `stackKeyId`: The Stack Key ID you'd like to log as a defect
- `notes`: Notes about the defect you'd like to log
- `linkDefectId`: The ID of the defect you'd like to link to

### remove-defect-link
Remove the link between a BugSplat issue and a connected defect tracking system. The defect in the defect tracking system will not be deleted, but the link will be removed.
- `stackKeyId`: The Stack Key ID you'd like to remove the defect from

Each tool will automatically use the credentials provided in your `.env` file or the environment variables configured for the MCP server.

## Pagination 📄

Some tools support pagination to handle large datasets efficiently:

### File Content Pagination (get-attachment)
For large attachment files that might exceed token limits, the `get-attachment` tool automatically supports pagination:

```
Example usage:
1. First request: get-attachment with crashId=123, file="large-log.txt"
   - Returns first 262KB of file with pagination metadata
2. Subsequent requests: get-attachment with crashId=123, file="large-log.txt", offset=262144
   - Returns next chunk starting from byte 262144
```

The response includes helpful metadata:
- Current byte range (e.g., "0-262144/1048576 bytes")
- Whether more content is available
- Next offset to use for subsequent requests

### List Pagination (list-issues, get-key-crashes, get-summary)
These tools support standard page-based pagination with `pageSize` parameters to limit the number of results returned in a single request. 

## Developing 👨‍💻

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your BugSplat credentials:
```
BUGSPLAT_DATABASE=your_database
BUGSPLAT_CLIENT_ID=your_client_id
BUGSPLAT_CLIENT_SECRET=your_client_secret
```

3. Start the server:
```bash
npm run debug
```

4. Open your browser to [http://127.0.0.1:6274](http://127.0.0.1:6274) to access the MCP Inspector interface.

## Testing 🧪

The project uses Jasmine for testing. Due to ESM compatibility issues with ts-node, tests are run from built JavaScript files rather than directly from TypeScript.

### Running Tests

```bash
npm test
```

This will:
1. Build the TypeScript files into JavaScript
2. Run the Jasmine test suite

### Debugging Tests

You can debug tests using VS Code in two ways:

1. Using the Test Explorer:
   - Open the Testing sidebar in VS Code
   - Click the debug icon next to any test to start debugging
   - Note: You must rebuild (`npm run build:test`) if you make changes to test files

2. Using Launch Configurations:
   - Open the Run and Debug sidebar in VS Code
   - Select "Debug Tests" from the dropdown
   - Press F5 to start debugging
   - The configuration will automatically build before running

### Important Notes

- If you modify any test or source files, you need to rebuild before running tests again
- The build step is necessary because ts-node doesn't play well with ESM imports
- Tests have a 30-second timeout to accommodate API calls
- Environment variables from your `.env` file are automatically loaded
