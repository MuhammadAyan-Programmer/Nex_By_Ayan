// Vercel Serverless Function entrypoint
// @ts-ignore
import server from '../dist/server.cjs';

const app = (server as any).default?.default || (server as any).default || server;

export default app;
