import Anthropic from "@anthropic-ai/sdk";
import { getNutritionSummary } from "./summaries.js";

const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  fat: 65,
  carbs: 250,
};

export interface ReviewResult {
  review: string;
}

export async function generateReview(
  userId: string,
  period: string,
  dateStr: string
): Promise<ReviewResult> {
  const summary = await getNutritionSummary(userId, period, dateStr);

  if (summary.totals.mealCount === 0) {
    return { review: "この期間の食事記録がありません。" };
  }

  const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 1;
  const targets = {
    calories: DAILY_TARGETS.calories * days,
    protein: DAILY_TARGETS.protein * days,
    fat: DAILY_TARGETS.fat * days,
    carbs: DAILY_TARGETS.carbs * days,
  };

  const periodLabel =
    period === "daily" ? "1日" : period === "weekly" ? "1週間" : "1ヶ月";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { review: "APIキーが設定されていないため、総評を生成できません。" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: `あなたはフレンドリーな栄養士です。ユーザーの${periodLabel}の食事を振り返り、総評を3〜5文で簡潔にコメントしてください。
良い点と改善点をバランスよく伝えてください。
カジュアルで親しみやすい口調でお願いします。絵文字は使わないでください。
プレーンテキストで回答してください（マークダウンやHTMLは使わない）。`,
      messages: [
        {
          role: "user",
          content: `${periodLabel}の食事を振り返ってください。

摂取カロリー: ${summary.totals.calories} kcal（目標: ${targets.calories} kcal）
タンパク質: ${summary.totals.protein}g（目標: ${targets.protein}g）
脂質: ${summary.totals.fat}g（目標: ${targets.fat}g）
炭水化物: ${summary.totals.carbs}g（目標: ${targets.carbs}g）
食事回数: ${summary.totals.mealCount}回

食事内容: ${summary.meals.map((m) => `${m.meal_type}: ${m.foods.join("、")}`).join(" / ") || "詳細なし"}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { review: "総評の生成に失敗しました。" };
    }

    return { review: textBlock.text };
  } catch (err) {
    console.error("Review generation failed:", err);
    return { review: "総評の生成中にエラーが発生しました。" };
  }
}
