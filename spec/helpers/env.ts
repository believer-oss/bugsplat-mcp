import { config } from "dotenv";

// Load environment variables before any tests run
beforeAll(() => {
  config();
  
  // Verify required environment variables
  const requiredEnvVars = [
    'BUGSPLAT_DATABASE',
    'BUGSPLAT_CLIENT_ID',
    'BUGSPLAT_CLIENT_SECRET'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}); 