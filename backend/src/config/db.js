import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import * as schema from "../db/schema.js";

// Creates a SQL connection using our DB URL
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
