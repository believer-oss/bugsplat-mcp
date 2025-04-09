import { config } from 'dotenv';
import { spawn } from 'child_process';

config();

const envVars = [
  `BUGSPLAT_DATABASE=${process.env.BUGSPLAT_DATABASE || 'fred'}`,
  `BUGSPLAT_CLIENT_ID=${process.env.BUGSPLAT_CLIENT_ID || '2473b6261ce35ee0a150e758908c49d5'}`,
  `BUGSPLAT_CLIENT_SECRET=${process.env.BUGSPLAT_CLIENT_SECRET || '+g8Y2cDOOvm3VdiRjdKf86ydV2fU4bcq'}`
];

const args = [
  '@modelcontextprotocol/inspector',
  ...envVars.reduce((acc, env) => [...acc, '-e', env], []),
  'node',
  'build/index.js'
];

const inspector = spawn('npx', args, {
  stdio: 'inherit',
  shell: true
});

inspector.on('error', (error) => {
  console.error('Failed to start inspector:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  inspector.kill('SIGINT');
});

process.on('SIGTERM', () => {
  inspector.kill('SIGTERM');
}); 