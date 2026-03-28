import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoute } from "./routes/health.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3004"],
    credentials: true,
  })
);

app.route("/api", healthRoute);

const port = Number(process.env.PORT) || 3005;

console.log(`Backend server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
