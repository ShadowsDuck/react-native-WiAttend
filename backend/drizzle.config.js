import "dotenv/config";

export default {
  schema: "./src/db/schema.js",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
};

// npx drizzle-kit generate, npx drizzle-kit migrate หลังเขียน schema
