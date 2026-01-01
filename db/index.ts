import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "./schema.js";
export { schema };


// Warn instead of crashing completely
if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

// Create the database connection safely
export const db = process.env.DATABASE_URL
  ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
  : (new Proxy({}, {
    get: () => { throw new Error("DATABASE_URL is not set. Cannot access database."); }
  }) as any);
