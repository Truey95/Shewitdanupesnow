import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema.js";

// Warn instead of crashing completely
if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

// Configure Neon for server environment
if (typeof globalThis !== 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Create the database connection safely
export const db = process.env.DATABASE_URL
  ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
  : (new Proxy({}, {
    get: () => { throw new Error("DATABASE_URL is not set. Cannot access database."); }
  }) as any);
