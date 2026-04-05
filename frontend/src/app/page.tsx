"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, Camera } from "lucide-react";
import MealCard from "./components/meal-card";
import BottomNav from "./components/bottom-nav";
import AppHeader from "./components/app-header";

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
      <main className="max-w-md mx-auto p-4 pb-safe">
        <AppHeader
          title="Food Album"
          icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200"><UtensilsCrossed className="w-4 h-4 text-white" /></div>}
        />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="w-full h-48 skeleton" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 skeleton rounded-lg w-1/3" />
                <div className="h-3 skeleton rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-safe">
      <AppHeader
        title="Food Album"
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200"><UtensilsCrossed className="w-4 h-4 text-white" /></div>}
      />

      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
            <Camera className="w-10 h-10 text-orange-300" />
          </div>
          <p className="text-gray-500 mb-1 font-medium">まだ食事記録がありません</p>
          <p className="text-sm text-gray-400 mb-6">最初の一枚を撮影してみましょう</p>
          <Link
            href="/meals/new"
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-200 active:scale-[0.98]"
          >
            食事を記録する
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {meals.map((meal, i) => (
              <div key={meal.id} className={`animate-fade-in delay-${Math.min(i + 1, 5)}`}>
                <MealCard meal={meal} />
              </div>
            ))}
          </div>
          {meals.length < total && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 text-sm font-semibold text-orange-500 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 disabled:opacity-50 transition-all active:scale-[0.98]"
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
