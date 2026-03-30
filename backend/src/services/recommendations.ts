import Anthropic from "@anthropic-ai/sdk";
import { getNutritionSummary } from "./summaries.js";

const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  fat: 65,
  carbs: 250,
};

export interface NutritionGap {
  calories: { target: number; current: number; gap: number };
  protein: { target: number; current: number; gap: number };
  fat: { target: number; current: number; gap: number };
  carbs: { target: number; current: number; gap: number };
}

export interface Recommendation {
  ingredient: string;
  reason: string;
  recipe: string;
}

export interface RecommendationResult {
  gap: NutritionGap;
  recommendations: Recommendation[];
}

export async function getRecommendations(
  userId: string,
  period: string,
  dateStr: string
): Promise<RecommendationResult> {
  const summary = await getNutritionSummary(userId, period, dateStr);

  const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 1;
  const targets = {
    calories: DAILY_TARGETS.calories * days,
    protein: DAILY_TARGETS.protein * days,
    fat: DAILY_TARGETS.fat * days,
    carbs: DAILY_TARGETS.carbs * days,
  };

  const gap: NutritionGap = {
    calories: {
      target: targets.calories,
      current: summary.totals.calories,
      gap: Math.max(0, targets.calories - summary.totals.calories),
    },
    protein: {
      target: targets.protein,
      current: summary.totals.protein,
      gap: Math.max(0, targets.protein - summary.totals.protein),
    },
    fat: {
      target: targets.fat,
      current: summary.totals.fat,
      gap: Math.max(0, targets.fat - summary.totals.fat),
    },
    carbs: {
      target: targets.carbs,
      current: summary.totals.carbs,
      gap: Math.max(0, targets.carbs - summary.totals.carbs),
    },
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { gap, recommendations: [] };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `あなたは栄養士です。不足栄養素に基づいて食材とレシピを提案してください。
以下のJSON配列で回答してください。他の文字は一切含めないでください。3つ提案してください。

[
  {
    "ingredient": "食材名",
    "reason": "この食材を勧める理由（1文）",
    "recipe": "この食材を使った簡単なレシピ名と説明（1〜2文）"
  }
]`,
      messages: [
        {
          role: "user",
          content: `以下の栄養素が不足しています。不足を補える食材とレシピを提案してください。

不足カロリー: ${gap.calories.gap}kcal
不足タンパク質: ${gap.protein.gap}g
不足脂質: ${gap.fat.gap}g
不足炭水化物: ${gap.carbs.gap}g

これまでの食事: ${summary.meals.map((m) => m.foods.join("、")).join(" / ") || "記録なし"}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { gap, recommendations: [] };
    }

    const recommendations: Recommendation[] = JSON.parse(textBlock.text);
    return { gap, recommendations };
  } catch (err) {
    console.error("Recommendation generation failed:", err);
    return { gap, recommendations: [] };
  }
}
