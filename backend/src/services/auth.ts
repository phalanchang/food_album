import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/client.js";
import type { JwtPayload } from "../types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ id: string; email: string; display_name: string }> {
  const passwordHash = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (id, email, password_hash, display_name)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING id, email, display_name`,
    [email, passwordHash, displayName]
  );
  return result.rows[0];
}

export async function findUserByEmail(
  email: string
): Promise<{
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
} | null> {
  const result = await query(
    `SELECT id, email, password_hash, display_name FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}
