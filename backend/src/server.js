import express from "express";
// import job from "./config/cron.js";
import { clerkMiddleware } from "@clerk/express";
import { db } from "../src/config/db.js";
import { users } from "../src/db/schema.js";
import userRoutes from "./routes/user.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

// if (process.env.NODE_ENV === "production") job.start();

// middleware
app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/users", userRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});
