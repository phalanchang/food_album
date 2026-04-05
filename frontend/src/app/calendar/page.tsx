"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startOfMonth, endOfMonth, isSameDay, format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Flame } from "lucide-react";
import CalendarView from "../components/calendar-view";
import MealCard from "../components/meal-card";
import NutritionBar from "../components/nutrition-bar";
import AiReview from "../components/ai-review";
import BottomNav from "../components/bottom-nav";
import AppHeader from "../components/app-header";

interface Meal {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
}

interface DailySummary {
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
    foods: string[];
    calories: number;
  }>;
}

const DAILY_TARGETS = { calories: 2000, protein: 50, fat: 65, carbs: 250 };

const mealTypeLabels: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchMeals = async (month: Date) => {
    setLoading(true);
    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();
    try {
      const res = await fetch(
        `/api/meals?from=${from}&to=${to}&limit=100`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setMeals(json.data.meals);
    } catch {
      // ネットワークエラー
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals(currentMonth);
  }, [currentMonth]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    setSelectedDate(null);
    setDailySummary(null);
  };

  const fetchDailySummary = async (d: Date) => {
    setSummaryLoading(true);
    setDailySummary(null);
    try {
      const res = await fetch(
        `/api/summaries?period=daily&date=${d.toISOString()}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const json = await res.json();
        setDailySummary(json.data);
      }
    } catch {
      // ネットワークエラー
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      fetchDailySummary(date);
    } else {
      setDailySummary(null);
    }
  };

  const selectedMeals = selectedDate
    ? meals.filter((m) => isSameDay(new Date(m.eaten_at), selectedDate))
    : [];

  return (
    <main className="max-w-md mx-auto p-4 pb-safe">
      <AppHeader
        title="カレンダー"
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200"><Calendar className="w-4 h-4 text-white" /></div>}
      />

      {loading ? (
        <div className="space-y-2">
          <div className="h-6 skeleton rounded-lg w-1/3 mx-auto mb-4" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <CalendarView
          currentMonth={currentMonth}
          meals={meals}
          selectedDate={selectedDate}
          onMonthChange={handleMonthChange}
          onDateSelect={handleDateSelect}
        />
      )}

      {selectedDate && (
        <div className="mt-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 bg-orange-400 rounded-full" />
            {format(selectedDate, "M月d日（E）", { locale: ja })}の食事
          </h3>

          {/* デイリーサマリー */}
          {summaryLoading ? (
            <div className="space-y-3 mb-4">
              <div className="h-24 skeleton rounded-2xl" />
              <div className="h-28 skeleton rounded-2xl" />
            </div>
          ) : dailySummary && dailySummary.totals.mealCount > 0 ? (
            <div className="space-y-3 mb-4">
              {/* カロリー */}
              {(() => {
                const calPercent = Math.min(100, Math.round((dailySummary.totals.calories / DAILY_TARGETS.calories) * 100));
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">
                        {dailySummary.totals.calories}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {DAILY_TARGETS.calories} kcal
                      </span>
                      <span className="ml-auto text-sm font-bold text-orange-500">
                        {calPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${calPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 栄養バランス */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <NutritionBar label="タンパク質" current={dailySummary.totals.protein} target={DAILY_TARGETS.protein} unit="g" color="bg-orange-400" />
                <NutritionBar label="脂質" current={dailySummary.totals.fat} target={DAILY_TARGETS.fat} unit="g" color="bg-yellow-400" />
                <NutritionBar label="炭水化物" current={dailySummary.totals.carbs} target={DAILY_TARGETS.carbs} unit="g" color="bg-amber-400" />
              </div>

              {/* 食事内訳 */}
              {dailySummary.meals.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">食事内訳</h4>
                  <div className="space-y-1.5">
                    {dailySummary.meals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {mealTypeLabels[meal.meal_type] || meal.meal_type}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {meal.foods.slice(0, 2).join("、")}
                          </span>
                        </div>
                        <span className="text-gray-700 font-semibold text-xs whitespace-nowrap ml-2">
                          {meal.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* AI総評 */}
          {dailySummary && dailySummary.totals.mealCount > 0 && (
            <div className="mb-4">
              <AiReview
                key={`review-${selectedDate.toISOString().split("T")[0]}`}
                period="daily"
                date={selectedDate.toISOString().split("T")[0]}
              />
            </div>
          )}

          {/* 食事カード一覧 */}
          {selectedMeals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-2xl border border-gray-100">
              この日の記録はありません
            </p>
          ) : (
            <div className="space-y-3">
              {selectedMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
