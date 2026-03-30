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
    <div>
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const mealTypes = getMealTypesForDay(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`flex flex-col items-center py-2 min-h-[3rem] ${
                inMonth ? "bg-white" : "bg-gray-50"
              } ${selected ? "ring-2 ring-inset ring-orange-400" : ""}`}
            >
              <span
                className={`text-xs leading-none ${
                  !inMonth
                    ? "text-gray-300"
                    : today
                      ? "bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </span>
              {mealTypes.length > 0 && (
                <div className="flex gap-0.5 mt-1">
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
