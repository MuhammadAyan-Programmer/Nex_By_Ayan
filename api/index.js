// Vercel Serverless Function entrypoint (ESM compatible)
import server from '../dist/server.cjs';

const app = server.default?.default || server.default || server;

export default app;
