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
  { label: string; icon: typeof Coffee; bg: string; text: string; border: string }
> = {
  breakfast: { label: "朝食", icon: Coffee, bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  lunch: { label: "昼食", icon: Sun, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  dinner: { label: "夕食", icon: Moon, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  snack: { label: "間食", icon: Cookie, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

export default function MealCard({ meal }: { meal: Meal }) {
  const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;
  const Icon = config.icon;

  return (
    <Link href={`/meals/${meal.id}`} className="block card-hover">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative">
          <img
            src={meal.photo_url}
            alt="食事写真"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <span
            className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border} backdrop-blur-sm`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        <div className="p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-medium">
              {format(new Date(meal.eaten_at), "M月d日 HH:mm", { locale: ja })}
            </span>
          </div>
          {meal.memo && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{meal.memo}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
