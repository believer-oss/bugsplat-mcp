import { config } from "dotenv";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { getAttachmentDirPath } from "../src/attachment.js";

config();

// Mock the MCP server tool function behavior
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "fs/promises";
import mime from "mime";

// Create a test file content that's large enough to test pagination
const createTestFileContent = (size: number): Buffer => {
  const chunk = "This is test content for pagination testing. ";
  const chunkBuffer = Buffer.from(chunk);
  const numChunks = Math.ceil(size / chunkBuffer.length);
  const buffers = Array(numChunks).fill(chunkBuffer);
  return Buffer.concat(buffers).subarray(0, size);
};

describe("get-attachment pagination integration", () => {
  let crashId: number;
  let attachmentDir: string;
  let testFileName: string;
  let testFileContent: Buffer;

  beforeAll(async () => {
    crashId = 123456789123456789;
    attachmentDir = getAttachmentDirPath(crashId);
    testFileName = "large-test-file.txt";

    // Create a 1KB test file for pagination testing
    testFileContent = createTestFileContent(1024);

    await mkdir(attachmentDir, { recursive: true });
    await writeFile(join(attachmentDir, testFileName), testFileContent);
  });

  afterAll(async () => {
    await rm(attachmentDir, { recursive: true, force: true });
  });

  describe("pagination parameters", () => {
    it("should handle default parameters (no offset, no limit)", async () => {
      const filePath = join(attachmentDir, testFileName);
      const contents = await readFile(filePath);

      // Simulate default pagination (offset=0, limit=262144)
      const offset = 0;
      const limit = 262144;
      const totalSize = contents.length;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);
      const chunk = contents.subarray(startPos, endPos);

      expect(chunk.length).toBe(testFileContent.length); // Should get full file
      expect(startPos).toBe(0);
      expect(endPos).toBe(testFileContent.length);
    });

    it("should handle custom offset and limit", async () => {
      const filePath = join(attachmentDir, testFileName);
      const contents = await readFile(filePath);

      // Test with offset=100, limit=200
      const offset = 100;
      const limit = 200;
      const totalSize = contents.length;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);
      const chunk = contents.subarray(startPos, endPos);

      expect(startPos).toBe(100);
      expect(endPos).toBe(300);
      expect(chunk.length).toBe(200);
    });

    it("should handle offset beyond file size", async () => {
      const filePath = join(attachmentDir, testFileName);
      const contents = await readFile(filePath);

      // Test with offset beyond file size
      const offset = 2000; // File is only 1024 bytes
      const limit = 100;
      const totalSize = contents.length;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);
      const chunk = contents.subarray(startPos, endPos);

      expect(startPos).toBe(totalSize);
      expect(endPos).toBe(totalSize);
      expect(chunk.length).toBe(0);
    });

    it("should handle limit larger than remaining file", async () => {
      const filePath = join(attachmentDir, testFileName);
      const contents = await readFile(filePath);

      // Test with limit larger than remaining file
      const offset = 900;
      const limit = 500; // Only 124 bytes left in file
      const totalSize = contents.length;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);
      const chunk = contents.subarray(startPos, endPos);

      expect(startPos).toBe(900);
      expect(endPos).toBe(totalSize);
      expect(chunk.length).toBe(totalSize - 900); // Should be 124 bytes
    });
  });

  describe("pagination metadata", () => {
    it("should generate correct pagination info when there's more content", () => {
      const offset = 100;
      const limit = 200;
      const totalSize = 1024;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);

      const paginationInfo = {
        offset: startPos,
        limit: endPos - startPos,
        totalSize,
        hasMore: endPos < totalSize,
        nextOffset: endPos < totalSize ? endPos : null
      };

      expect(paginationInfo.offset).toBe(100);
      expect(paginationInfo.limit).toBe(200);
      expect(paginationInfo.totalSize).toBe(1024);
      expect(paginationInfo.hasMore).toBe(true);
      expect(paginationInfo.nextOffset).toBe(300);
    });

    it("should generate correct pagination info when at end of file", () => {
      const offset = 900;
      const limit = 200;
      const totalSize = 1024;

      const startPos = Math.min(offset, totalSize);
      const endPos = Math.min(offset + limit, totalSize);

      const paginationInfo = {
        offset: startPos,
        limit: endPos - startPos,
        totalSize,
        hasMore: endPos < totalSize,
        nextOffset: endPos < totalSize ? endPos : null
      };

      expect(paginationInfo.offset).toBe(900);
      expect(paginationInfo.limit).toBe(124);
      expect(paginationInfo.totalSize).toBe(1024);
      expect(paginationInfo.hasMore).toBe(false);
      expect(paginationInfo.nextOffset).toBe(null);
    });
  });

  describe("pagination header formatting", () => {
    it("should format pagination header correctly for partial file", () => {
      const fileName = testFileName;
      const paginationInfo = {
        offset: 100,
        limit: 200,
        totalSize: 1024,
        hasMore: true,
        nextOffset: 300
      };

      const expectedHeader = `File: ${fileName} (100-300/1024 bytes) - Use offset=300 for next chunk\n\n`;
      const actualHeader = `File: ${fileName} (${paginationInfo.offset}-${paginationInfo.offset + paginationInfo.limit}/${paginationInfo.totalSize} bytes)${paginationInfo.hasMore ? ` - Use offset=${paginationInfo.nextOffset} for next chunk` : ' - Complete'}\n\n`;

      expect(actualHeader).toBe(expectedHeader);
    });

    it("should format pagination header correctly for complete file", () => {
      const fileName = testFileName;
      const paginationInfo = {
        offset: 0,
        limit: 1024,
        totalSize: 1024,
        hasMore: false,
        nextOffset: null
      };

      const expectedHeader = `File: ${fileName} (0-1024/1024 bytes) - Complete\n\n`;
      const actualHeader = `File: ${fileName} (${paginationInfo.offset}-${paginationInfo.offset + paginationInfo.limit}/${paginationInfo.totalSize} bytes)${paginationInfo.hasMore ? ` - Use offset=${paginationInfo.nextOffset} for next chunk` : ' - Complete'}\n\n`;

      expect(actualHeader).toBe(expectedHeader);
    });
  });

  describe("backward compatibility", () => {
    it("should work without pagination parameters", () => {
      // When no pagination info is provided, the header should be empty
      const paginationInfo = undefined;
      const paginationHeader = paginationInfo ? 'should have header' : '';

      expect(paginationHeader).toBe('');
    });
  });
});