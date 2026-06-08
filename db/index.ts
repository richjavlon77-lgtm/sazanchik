import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Pooled connection for runtime queries
const client = postgres(connectionString, {
  prepare: false, // Required for Neon serverless pooled connections
  max: 1,
});

export const db = drizzle(client, { schema });
export { schema };
