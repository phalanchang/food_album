import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Coffee, Sun, Moon, Cookie } from "lucide-react";

interface Meal {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
}

const mealTypeConfig: Record<
  string,
  { label: string; icon: typeof Coffee; bg: string; text: string }
> = {
  breakfast: { label: "朝食", icon: Coffee, bg: "bg-yellow-100", text: "text-yellow-700" },
  lunch: { label: "昼食", icon: Sun, bg: "bg-orange-100", text: "text-orange-700" },
  dinner: { label: "夕食", icon: Moon, bg: "bg-blue-100", text: "text-blue-700" },
  snack: { label: "間食", icon: Cookie, bg: "bg-green-100", text: "text-green-700" },
};

export default function MealCard({ meal }: { meal: Meal }) {
  const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;
  const Icon = config.icon;

  return (
    <Link href={`/meals/${meal.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <img
          src={meal.photo_url}
          alt="食事写真"
          className="w-full h-48 object-cover"
        />
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-gray-400">
              {format(new Date(meal.eaten_at), "M月d日 HH:mm", { locale: ja })}
            </span>
          </div>
          {meal.memo && (
            <p className="text-sm text-gray-600 line-clamp-2">{meal.memo}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
