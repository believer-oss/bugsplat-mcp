# BugSplat MCP Server Prototype

This is a prototype implementation of a Model Context Protocol (MCP) server for BugSplat integration.

## Getting Started

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
npm start
```

4. Open your browser to [http://127.0.0.1:6274](http://127.0.0.1:6274) to access the MCP Inspector interface.

## Available Tools

The server provides the following tools for interacting with BugSplat:

### get-issues
Get a list of BugSplat issues with optional filtering:
- `application`: Filter by application name
- `version`: Filter by version
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `pageSize`: Number of results per page (1-99, defaults to 5)

### get-issue
Get detailed information about a specific issue:
- `id`: The issue ID to retrieve

### get-summary
Get a summary of BugSplat issues with optional filtering:
- `application`: Filter by application name
- `version`: Filter by version
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `pageSize`: Number of results per page (1-99, defaults to 5)

Each tool will automatically use the credentials provided in your `.env` file. 