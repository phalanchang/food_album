"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, addMonths, subMonths, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import NutritionBar from "../components/nutrition-bar";
import BottomNav from "../components/bottom-nav";
import Recommendations from "./recommendations";

type Period = "daily" | "weekly" | "monthly";

interface SummaryData {
  period: string;
  startDate: string;
  endDate: string;
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    mealCount: number;
  };
  meals: Array<{
    id: string;
    meal_type: string;
    eaten_at: string;
    foods: string[];
    calories: number;
  }>;
}

const DAILY_TARGETS = { calories: 2000, protein: 50, fat: 65, carbs: 250 };

function getTargets(period: Period) {
  const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 1;
  return {
    calories: DAILY_TARGETS.calories * days,
    protein: DAILY_TARGETS.protein * days,
    fat: DAILY_TARGETS.fat * days,
    carbs: DAILY_TARGETS.carbs * days,
  };
}

function formatPeriodLabel(period: Period, date: Date) {
  if (period === "daily") return format(date, "M月d日（E）", { locale: ja });
  if (period === "weekly") {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return `${format(weekStart, "M/d")} 〜 ${format(weekEnd, "M/d")}`;
  }
  return format(date, "yyyy年M月", { locale: ja });
}

function navigateDate(period: Period, date: Date, direction: number): Date {
  if (period === "daily") return direction > 0 ? addDays(date, 1) : subDays(date, 1);
  if (period === "weekly") return direction > 0 ? addDays(date, 7) : subDays(date, 7);
  return direction > 0 ? addMonths(date, 1) : subMonths(date, 1);
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function SummaryPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("daily");
  const [date, setDate] = useState(new Date());
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (p: Period, d: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/summaries?period=${p}&date=${d.toISOString()}`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setSummary(json.data);
    } catch {
      // ネットワークエラー
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period, date);
  }, [period, date]);

  const targets = getTargets(period);
  const dateStr = date.toISOString().split("T")[0];

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <header className="mb-4">
        <h1 className="text-lg font-bold mb-3">振り返り</h1>

        {/* 期間タブ */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                period === p
                  ? "bg-white text-orange-500 font-medium shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {p === "daily" ? "日" : p === "weekly" ? "週" : "月"}
            </button>
          ))}
        </div>

        {/* 日付ナビ */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setDate(navigateDate(period, date, -1))}
            className="p-1 text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {formatPeriodLabel(period, date)}
          </span>
          <button
            onClick={() => setDate(navigateDate(period, date, 1))}
            className="p-1 text-gray-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-16 bg-gray-200 rounded-lg" />
          <div className="h-16 bg-gray-200 rounded-lg" />
        </div>
      ) : summary ? (
        <>
          {/* カロリー合計 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 text-center">
            <Flame className="w-6 h-6 mx-auto text-red-400 mb-1" />
            <p className="text-3xl font-bold text-gray-800">
              {summary.totals.calories}
            </p>
            <p className="text-xs text-gray-400">
              / {targets.calories} kcal（{summary.totals.mealCount}食）
            </p>
          </div>

          {/* 栄養素バー */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3 mb-4">
            <NutritionBar
              label="タンパク質"
              current={summary.totals.protein}
              target={targets.protein}
              unit="g"
              color="bg-orange-400"
            />
            <NutritionBar
              label="脂質"
              current={summary.totals.fat}
              target={targets.fat}
              unit="g"
              color="bg-yellow-400"
            />
            <NutritionBar
              label="炭水化物"
              current={summary.totals.carbs}
              target={targets.carbs}
              unit="g"
              color="bg-amber-400"
            />
          </div>

          {/* 食事内訳 */}
          {summary.meals.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">食事内訳</h3>
              <div className="space-y-2">
                {summary.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="text-gray-500 mr-2">
                        {mealTypeLabels[meal.meal_type] || meal.meal_type}
                      </span>
                      <span className="text-gray-600">
                        {meal.foods.slice(0, 2).join("、")}
                      </span>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {meal.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.totals.mealCount === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              この期間の栄養評価データはありません
            </p>
          )}

          {/* 献立レコメンド */}
          {summary.totals.mealCount > 0 && (
            <Recommendations period={period} date={dateStr} />
          )}
        </>
      ) : null}

      <BottomNav />
    </main>
  );
}
