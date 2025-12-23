import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure Neon for server environment
if (typeof globalThis !== 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Create the database connection
export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), {
  schema,
});
