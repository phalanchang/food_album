"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, addMonths, subMonths, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Flame, BarChart3 } from "lucide-react";
import NutritionBar from "../components/nutrition-bar";
import BottomNav from "../components/bottom-nav";
import AppHeader from "../components/app-header";
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
    <main className="max-w-md mx-auto p-4 pb-safe">
      <AppHeader
        title="振り返り"
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200"><BarChart3 className="w-4 h-4 text-white" /></div>}
      />

      <header className="mb-5">
        {/* 期間タブ */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                period === p
                  ? "bg-white text-orange-500 font-semibold shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {formatPeriodLabel(period, date)}
          </span>
          <button
            onClick={() => setDate(navigateDate(period, date, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          <div className="h-28 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
        </div>
      ) : summary ? (
        <div className="animate-fade-in space-y-4">
          {/* カロリー合計 */}
          {(() => {
            const calPercent = Math.min(100, Math.round((summary.totals.calories / targets.calories) * 100));
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-baseline gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">
                    {summary.totals.calories}
                  </span>
                  <span className="text-sm text-gray-400">
                    / {targets.calories} kcal
                  </span>
                  <span className="ml-auto text-sm font-bold text-orange-500">
                    {calPercent}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${calPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {summary.totals.mealCount}食 記録済み
                  {summary.totals.mealCount > 0 && (
                    <span className="ml-1">（1食あたり約 {Math.round(summary.totals.calories / summary.totals.mealCount)} kcal）</span>
                  )}
                </p>
              </div>
            );
          })()}

          {/* 栄養素バー */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <span className="w-1 h-4 bg-orange-400 rounded-full" />
                食事内訳
              </h3>
              <div className="space-y-2.5">
                {summary.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                        {mealTypeLabels[meal.meal_type] || meal.meal_type}
                      </span>
                      <span className="text-gray-600">
                        {meal.foods.slice(0, 2).join("、")}
                      </span>
                    </div>
                    <span className="text-gray-700 font-semibold whitespace-nowrap ml-2">
                      {meal.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.totals.mealCount === 0 && (
            <div className="flex flex-col items-center py-12">
              <p className="text-gray-400 text-sm">
                この期間の栄養評価データはありません
              </p>
            </div>
          )}

          {/* 献立レコメンド */}
          {summary.totals.mealCount > 0 && (
            <Recommendations period={period} date={dateStr} />
          )}
        </div>
      ) : null}

      <BottomNav />
    </main>
  );
}
