"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Trash2, Coffee, Sun, Moon, Cookie, Flame, Beef, Droplets, Wheat, Loader2 } from "lucide-react";
import BottomNav from "../../components/bottom-nav";

interface NutritionResult {
  foods: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  comment: string;
}

interface Meal {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
  nutrition_status: string;
  nutrition_result: NutritionResult | null;
  created_at: string;
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

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const res = await fetch(`/api/meals/${params.id}`, {
          credentials: "include",
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          setError("記録が見つかりません");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setMeal(json.data);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchMeal();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!confirm("この食事記録を削除しますか？")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meals/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/");
      } else {
        const json = await res.json();
        setError(json.error || "削除に失敗しました");
      }
    } catch {
      setError("サーバーに接続できません");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-md mx-auto p-4 pb-20">
        <div className="animate-pulse">
          <div className="h-5 w-20 bg-gray-200 rounded mb-4" />
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !meal) {
    return (
      <main className="max-w-md mx-auto p-4 pb-20">
        <header className="flex items-center gap-3 mb-4">
          <Link href="/" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">食事詳細</h1>
        </header>
        <p className="text-center text-gray-500 py-10">{error || "記録が見つかりません"}</p>
        <BottomNav />
      </main>
    );
  }

  const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;
  const Icon = config.icon;

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">食事詳細</h1>
      </header>

      <img
        src={meal.photo_url}
        alt="食事写真"
        className="w-full rounded-lg mb-4"
      />

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          <span className="text-sm text-gray-500">
            {format(new Date(meal.eaten_at), "yyyy年M月d日 HH:mm", {
              locale: ja,
            })}
          </span>
        </div>
        {meal.memo && <p className="text-sm text-gray-700">{meal.memo}</p>}
      </div>

      {/* 栄養評価 */}
      {meal.nutrition_status === "pending" && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          栄養評価を分析中...
        </div>
      )}
      {meal.nutrition_status === "completed" && meal.nutrition_result && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">AI 栄養評価</h3>
          {meal.nutrition_result.foods.length > 0 && (
            <p className="text-sm text-gray-600">
              {meal.nutrition_result.foods.join("、")}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-red-50 rounded-lg p-2">
              <Flame className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <p className="text-xs text-gray-500">カロリー</p>
              <p className="text-sm font-bold text-gray-700">
                {meal.nutrition_result.calories}
              </p>
              <p className="text-xs text-gray-400">kcal</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <Beef className="w-4 h-4 mx-auto text-orange-400 mb-1" />
              <p className="text-xs text-gray-500">タンパク質</p>
              <p className="text-sm font-bold text-gray-700">
                {meal.nutrition_result.protein}
              </p>
              <p className="text-xs text-gray-400">g</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <Droplets className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
              <p className="text-xs text-gray-500">脂質</p>
              <p className="text-sm font-bold text-gray-700">
                {meal.nutrition_result.fat}
              </p>
              <p className="text-xs text-gray-400">g</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <Wheat className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <p className="text-xs text-gray-500">炭水化物</p>
              <p className="text-sm font-bold text-gray-700">
                {meal.nutrition_result.carbs}
              </p>
              <p className="text-xs text-gray-400">g</p>
            </div>
          </div>
          {meal.nutrition_result.comment && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {meal.nutrition_result.comment}
            </p>
          )}
        </div>
      )}
      {meal.nutrition_status === "failed" && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4 text-sm text-gray-400">
          栄養評価を取得できませんでした
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="mt-6 w-full flex items-center justify-center gap-2 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {deleting ? "削除中..." : "この記録を削除"}
      </button>

      <BottomNav />
    </main>
  );
}
