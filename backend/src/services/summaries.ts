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

// JST (UTC+9) ベースで日付境界を計算
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJSTDate(dateStr: string): Date {
  // UTC の Date から JST の日付部分を取得するためにオフセット加算
  return new Date(new Date(dateStr).getTime() + JST_OFFSET_MS);
}

function jstMidnightToUTC(year: number, month: number, day: number): Date {
  // JST 00:00 = UTC 前日 15:00
  return new Date(Date.UTC(year, month, day) - JST_OFFSET_MS);
}

export function getPeriodDates(
  period: string,
  dateStr: string
): { startDate: Date; endDate: Date } {
  const jst = toJSTDate(dateStr);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();

  if (period === "daily") {
    const start = jstMidnightToUTC(y, m, d);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { startDate: start, endDate: end };
  }

  if (period === "weekly") {
    const dayOfWeek = jst.getUTCDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const start = jstMidnightToUTC(y, m, d - mondayOffset);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    return { startDate: start, endDate: end };
  }

  // monthly
  const start = jstMidnightToUTC(y, m, 1);
  const nextMonth = jstMidnightToUTC(y, m + 1, 1);
  const end = new Date(nextMonth.getTime() - 1);
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
