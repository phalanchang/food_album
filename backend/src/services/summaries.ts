import { query } from "../db/client.js";

export interface NutritionTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealCount: number;
}

export interface SummaryResult {
  period: string;
  startDate: string;
  endDate: string;
  totals: NutritionTotals;
  meals: Array<{
    id: string;
    meal_type: string;
    eaten_at: string;
    foods: string[];
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>;
}

export function getPeriodDates(
  period: string,
  dateStr: string
): { startDate: Date; endDate: Date } {
  const date = new Date(dateStr);

  if (period === "daily") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (period === "weekly") {
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - ((day + 6) % 7)); // Monday
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Sunday
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // monthly
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

export async function getNutritionSummary(
  userId: string,
  period: string,
  dateStr: string
): Promise<SummaryResult> {
  const { startDate, endDate } = getPeriodDates(period, dateStr);

  const result = await query(
    `SELECT id, meal_type, eaten_at, nutrition_result
     FROM meals
     WHERE user_id = $1
       AND eaten_at >= $2
       AND eaten_at <= $3
       AND nutrition_status = 'completed'
     ORDER BY eaten_at ASC`,
    [userId, startDate.toISOString(), endDate.toISOString()]
  );

  const meals = result.rows.map((row: { id: string; meal_type: string; eaten_at: string; nutrition_result: { foods?: string[]; calories?: number; protein?: number; fat?: number; carbs?: number } }) => {
    const nr = row.nutrition_result || {};
    return {
      id: row.id,
      meal_type: row.meal_type,
      eaten_at: row.eaten_at,
      foods: nr.foods || [],
      calories: nr.calories || 0,
      protein: nr.protein || 0,
      fat: nr.fat || 0,
      carbs: nr.carbs || 0,
    };
  });

  const totals: NutritionTotals = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    mealCount: meals.length,
  };

  for (const m of meals) {
    totals.calories += m.calories;
    totals.protein += m.protein;
    totals.fat += m.fat;
    totals.carbs += m.carbs;
  }

  // 小数点1桁に丸める
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totals,
    meals,
  };
}
