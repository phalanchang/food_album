"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import MealCard from "./components/meal-card";
import BottomNav from "./components/bottom-nav";

interface Meal {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  memo: string | null;
}

export default function Home() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  const fetchMeals = async (offset: number, append: boolean) => {
    try {
      const res = await fetch(`/api/meals?limit=${LIMIT}&offset=${offset}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (append) {
        setMeals((prev) => [...prev, ...json.data.meals]);
      } else {
        setMeals(json.data.meals);
      }
      setTotal(json.data.total);
    } catch {
      // ネットワークエラー
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMeals(0, false);
  }, []);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchMeals(meals.length, true);
  };

  if (loading) {
    return (
      <main className="max-w-md mx-auto p-4 pb-20">
        <header className="flex items-center gap-2 mb-4">
          <h1 className="text-lg font-bold">Food Album</h1>
        </header>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center gap-2 mb-4">
        <h1 className="text-lg font-bold">Food Album</h1>
      </header>

      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <UtensilsCrossed className="w-12 h-12 mb-3" />
          <p className="mb-4">まだ食事記録がありません</p>
          <Link
            href="/meals/new"
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            最初の食事を記録する
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
          {meals.length < total && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? "読み込み中..." : "もっと見る"}
              </button>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </main>
  );
}
