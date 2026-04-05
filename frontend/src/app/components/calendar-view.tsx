"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Meal {
  id: string;
  meal_type: string;
  eaten_at: string;
}

const mealDotColors: Record<string, string> = {
  breakfast: "bg-yellow-400",
  lunch: "bg-orange-400",
  dinner: "bg-blue-400",
  snack: "bg-green-400",
};

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

interface CalendarViewProps {
  currentMonth: Date;
  meals: Meal[];
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
}

export default function CalendarView({
  currentMonth,
  meals,
  selectedDate,
  onMonthChange,
  onDateSelect,
}: CalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getMealsForDay = (day: Date) =>
    meals.filter((m) => isSameDay(new Date(m.eaten_at), day));

  const getMealTypesForDay = (day: Date) => {
    const dayMeals = getMealsForDay(day);
    const types = new Set(dayMeals.map((m) => m.meal_type));
    return ["breakfast", "lunch", "dinner", "snack"].filter((t) => types.has(t));
  };

  return (
    <div className="animate-fade-in">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-gray-800">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-2 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-0.5 bg-gray-100/50 rounded-2xl overflow-hidden border border-gray-100">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const mealTypes = getMealTypesForDay(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`flex flex-col items-center py-2.5 min-h-[3.25rem] transition-all ${
                inMonth ? "bg-white" : "bg-gray-50/50"
              } ${selected ? "bg-orange-50 ring-2 ring-inset ring-orange-400" : "hover:bg-gray-50"}`}
            >
              <span
                className={`text-xs leading-none font-medium ${
                  !inMonth
                    ? "text-gray-300"
                    : today
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold shadow-sm shadow-orange-200"
                      : selected
                        ? "text-orange-600 font-bold"
                        : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </span>
              {mealTypes.length > 0 && (
                <div className="flex gap-0.5 mt-1.5">
                  {mealTypes.map((t) => (
                    <span
                      key={t}
                      className={`w-1.5 h-1.5 rounded-full ${mealDotColors[t]}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
