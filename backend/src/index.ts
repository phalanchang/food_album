import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoute } from "./routes/auth.js";
import { healthRoute } from "./routes/health.js";
import { mealsRoute } from "./routes/meals.js";
import { summariesRoute } from "./routes/summaries.js";
import { recommendationsRoute } from "./routes/recommendations.js";
import { reviewRoute } from "./routes/review.js";

fs.mkdirSync("/app/uploads", { recursive: true });

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3004"],
    credentials: true,
  })
);

app.use("/uploads/*", serveStatic({ root: "/app" }));

app.route("/api", healthRoute);
app.route("/api/auth", authRoute);
app.route("/api/meals", mealsRoute);
app.route("/api/summaries", summariesRoute);
app.route("/api/recommendations", recommendationsRoute);
app.route("/api/review", reviewRoute);

const port = Number(process.env.PORT) || 3005;

console.log(`Backend server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
