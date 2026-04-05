"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startOfMonth, endOfMonth, isSameDay, format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "lucide-react";
import CalendarView from "../components/calendar-view";
import MealCard from "../components/meal-card";
import BottomNav from "../components/bottom-nav";
import AppHeader from "../components/app-header";

interface Meal {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

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
          onDateSelect={setSelectedDate}
        />
      )}

      {selectedDate && (
        <div className="mt-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
            <span className="w-1 h-4 bg-orange-400 rounded-full" />
            {format(selectedDate, "M月d日（E）", { locale: ja })}の食事
          </h3>
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
