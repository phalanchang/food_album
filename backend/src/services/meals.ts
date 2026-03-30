import { query } from "../db/client.js";

export interface MealRow {
  id: string;
  user_id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
  nutrition_status: string;
  nutrition_result: unknown;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealFilters {
  from?: string;
  to?: string;
  mealType?: string;
  limit: number;
  offset: number;
}

export async function createMeal(
  userId: string,
  photoUrl: string,
  mealType: string,
  eatenAt: string,
  memo?: string
): Promise<MealRow> {
  const result = await query(
    `INSERT INTO meals (id, user_id, photo_url, meal_type, eaten_at, memo)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, photoUrl, mealType, eatenAt, memo || null]
  );
  return result.rows[0];
}

export async function findMealsByUser(
  userId: string,
  filters: MealFilters
): Promise<{ meals: MealRow[]; total: number }> {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (filters.from) {
    conditions.push(`eaten_at >= $${paramIndex}`);
    params.push(filters.from);
    paramIndex++;
  }
  if (filters.to) {
    conditions.push(`eaten_at <= $${paramIndex}`);
    params.push(filters.to);
    paramIndex++;
  }
  if (filters.mealType) {
    conditions.push(`meal_type = $${paramIndex}`);
    params.push(filters.mealType);
    paramIndex++;
  }

  const where = conditions.join(" AND ");

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM meals WHERE ${where}`,
    params
  );

  const mealsResult = await query(
    `SELECT * FROM meals WHERE ${where} ORDER BY eaten_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, filters.limit, filters.offset]
  );

  return {
    meals: mealsResult.rows,
    total: countResult.rows[0].total,
  };
}

export async function findMealById(id: string): Promise<MealRow | null> {
  const result = await query(`SELECT * FROM meals WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function updateNutritionResult(
  id: string,
  nutritionResult: unknown
): Promise<MealRow> {
  const result = await query(
    `UPDATE meals
     SET nutrition_result = $1,
         nutrition_status = 'completed',
         evaluated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(nutritionResult), id]
  );
  return result.rows[0];
}

export async function deleteMealById(
  id: string
): Promise<{ photo_url: string } | null> {
  const result = await query(
    `DELETE FROM meals WHERE id = $1 RETURNING photo_url`,
    [id]
  );
  return result.rows[0] || null;
}
