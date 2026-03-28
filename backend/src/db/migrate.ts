import fs from "fs";
import path from "path";
import { pool, query } from "./client.js";

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(import.meta.dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const { rows } = await query("SELECT 1 FROM migrations WHERE name = $1", [
      file,
    ]);
    if (rows.length > 0) {
      console.log(`Skipping ${file} (already executed)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await query(sql);
    await query("INSERT INTO migrations (name) VALUES ($1)", [file]);
    console.log(`Completed: ${file}`);
  }

  console.log("All migrations complete");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
