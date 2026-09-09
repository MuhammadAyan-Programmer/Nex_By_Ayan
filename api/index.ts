import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

// Serverless function entrypoint for Vercel deployment
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as any)(req, res);
}
