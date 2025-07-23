import express from "express";
// import job from "./config/cron.js";
import { clerkMiddleware } from "@clerk/express";
import userRoutes from "./routes/user.route.js";
import classRoutes from "./routes/class.route.js";
import sessionsRoutes from "./routes/sessions.route.js";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

// if (process.env.NODE_ENV === "production") job.start();

// middleware
app.use(clerkMiddleware());
app.use(express.json());

app.use("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sessions", sessionsRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
