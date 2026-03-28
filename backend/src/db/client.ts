import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@db:5432/food_album",
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
