"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Trash2, Coffee, Sun, Moon, Cookie, Flame, Beef, Droplets, Wheat, Loader2, Pencil, Check, X, Plus, Sparkles, ChevronDown } from "lucide-react";
import BottomNav from "../../components/bottom-nav";
import AppHeader from "../../components/app-header";

interface NutrientDetail {
  name: string;
  value: number;
  unit: string;
}

interface NutritionResult {
  foods: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  comment: string;
  details?: NutrientDetail[];
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
  { label: string; icon: typeof Coffee; bg: string; text: string; border: string }
> = {
  breakfast: { label: "朝食", icon: Coffee, bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  lunch: { label: "昼食", icon: Sun, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  dinner: { label: "夕食", icon: Moon, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  snack: { label: "間食", icon: Cookie, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFoods, setEditFoods] = useState<string[]>([]);
  const [editNutrition, setEditNutrition] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [saving, setSaving] = useState(false);
  const [reevaluating, setReevaluating] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchMeal = async () => {
    try {
      const res = await fetch(`/api/meals/${params.id}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      if (res.status === 404) {
        setError("記録が見つかりません");
        setLoading(false);
        return null;
      }
      const json = await res.json();
      setMeal(json.data);
      return json.data as Meal;
    } catch {
      setError("データの取得に失敗しました");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    fetchMeal().then((data) => {
      if (data && data.nutrition_status === "pending") {
        timer = setInterval(async () => {
          const updated = await fetchMeal();
          if (updated && updated.nutrition_status !== "pending") {
            if (timer) clearInterval(timer);
          }
        }, 3000);
      }
    });

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [params.id]);

  const startEditing = () => {
    if (!meal?.nutrition_result) return;
    setEditFoods([...meal.nutrition_result.foods]);
    setEditNutrition({
      calories: meal.nutrition_result.calories,
      protein: meal.nutrition_result.protein,
      fat: meal.nutrition_result.fat,
      carbs: meal.nutrition_result.carbs,
    });
    setEditing(true);
  };

  const handleFoodChange = (index: number, value: string) => {
    setEditFoods((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const handleFoodRemove = (index: number) => {
    setEditFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFoodAdd = () => {
    setEditFoods((prev) => [...prev, ""]);
  };

  const getValidFoods = () => editFoods.map((f) => f.trim()).filter(Boolean);

  const handleSaveNutrition = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/meals/${params.id}/nutrition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          foods: getValidFoods(),
          calories: Number(editNutrition.calories),
          protein: Number(editNutrition.protein),
          fat: Number(editNutrition.fat),
          carbs: Number(editNutrition.carbs),
          comment: meal?.nutrition_result?.comment || "",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setMeal(json.data);
        setEditing(false);
      }
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleReevaluate = async () => {
    const foods = getValidFoods();
    if (foods.length === 0) return;
    setReevaluating(true);
    setError("");
    try {
      const res = await fetch(`/api/meals/${params.id}/nutrition/reevaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ foods }),
      });
      const json = await res.json();
      if (res.ok) {
        setMeal(json.data);
        setEditing(false);
      } else {
        setError(json.error || "再評価に失敗しました");
      }
    } catch {
      setError("サーバーに接続できません");
    } finally {
      setReevaluating(false);
    }
  };

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
      <main className="max-w-md mx-auto p-4 pb-safe">
        <div className="pt-2">
          <div className="h-5 w-20 skeleton rounded-lg mb-5" />
          <div className="w-full h-64 skeleton rounded-2xl mb-4" />
          <div className="h-4 skeleton rounded-lg w-1/3 mb-2" />
          <div className="h-4 skeleton rounded-lg w-2/3" />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error && !meal) {
    return (
      <main className="max-w-md mx-auto p-4 pb-safe">
        <header className="flex items-center gap-3 mb-5 pt-2">
          <Link href="/" className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">食事詳細</h1>
        </header>
        <div className="flex flex-col items-center py-16">
          <p className="text-gray-400">{error || "記録が見つかりません"}</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!meal) return null;

  const config = mealTypeConfig[meal.meal_type] || mealTypeConfig.lunch;
  const Icon = config.icon;

  return (
    <main className="max-w-md mx-auto p-4 pb-safe">
      <AppHeader title="食事詳細" backHref="/" />

      <div className="animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden shadow-lg mb-4">
          <img
            src={meal.photo_url}
            alt="食事写真"
            className="w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
            <span className="text-sm text-gray-400 font-medium">
              {format(new Date(meal.eaten_at), "yyyy年M月d日 HH:mm", {
                locale: ja,
              })}
            </span>
          </div>
          {meal.memo && <p className="text-sm text-gray-700 leading-relaxed">{meal.memo}</p>}
        </div>

        {/* 栄養評価 */}
        {meal.nutrition_status === "pending" && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">栄養評価を分析中</p>
              <p className="text-xs text-gray-400">AIが写真を分析しています...</p>
            </div>
          </div>
        )}

        {meal.nutrition_status === "completed" && meal.nutrition_result && !editing && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-1 h-4 bg-orange-400 rounded-full" />
                AI 栄養評価
              </h3>
              <button onClick={startEditing} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            {meal.nutrition_result.foods.length > 0 && (
              <div className="space-y-1">
                {meal.nutrition_result.foods.map((food, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                    {food}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gradient-to-b from-red-50 to-red-50/30 rounded-xl p-2.5 border border-red-100">
                <Flame className="w-4 h-4 mx-auto text-red-400 mb-1" />
                <p className="text-[10px] text-gray-500 font-medium">カロリー</p>
                <p className="text-sm font-bold text-gray-800">
                  {meal.nutrition_result.calories}
                </p>
                <p className="text-[10px] text-gray-400">kcal</p>
              </div>
              <div className="bg-gradient-to-b from-orange-50 to-orange-50/30 rounded-xl p-2.5 border border-orange-100">
                <Beef className="w-4 h-4 mx-auto text-orange-400 mb-1" />
                <p className="text-[10px] text-gray-500 font-medium">タンパク質</p>
                <p className="text-sm font-bold text-gray-800">
                  {meal.nutrition_result.protein}
                </p>
                <p className="text-[10px] text-gray-400">g</p>
              </div>
              <div className="bg-gradient-to-b from-yellow-50 to-yellow-50/30 rounded-xl p-2.5 border border-yellow-100">
                <Droplets className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                <p className="text-[10px] text-gray-500 font-medium">脂質</p>
                <p className="text-sm font-bold text-gray-800">
                  {meal.nutrition_result.fat}
                </p>
                <p className="text-[10px] text-gray-400">g</p>
              </div>
              <div className="bg-gradient-to-b from-amber-50 to-amber-50/30 rounded-xl p-2.5 border border-amber-100">
                <Wheat className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-[10px] text-gray-500 font-medium">炭水化物</p>
                <p className="text-sm font-bold text-gray-800">
                  {meal.nutrition_result.carbs}
                </p>
                <p className="text-[10px] text-gray-400">g</p>
              </div>
            </div>
            {meal.nutrition_result.comment && (
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {meal.nutrition_result.comment}
                </p>
              </div>
            )}
            {/* 詳細栄養素アコーディオン */}
            {meal.nutrition_result.details && meal.nutrition_result.details.length > 0 && (
              <div>
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="w-full flex items-center justify-between py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="font-medium">詳細栄養素を見る</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
                </button>
                {detailsOpen && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                    {meal.nutrition_result.details.map((d) => (
                      <div key={d.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <span className="text-xs text-gray-500">{d.name}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {d.value} <span className="text-gray-400 font-normal">{d.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">栄養評価を編集</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 献立リスト */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">献立</label>
              <div className="space-y-2">
                {editFoods.map((food, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center shrink-0">{i + 1}</span>
                    <input
                      type="text"
                      value={food}
                      onChange={(e) => handleFoodChange(i, e.target.value)}
                      placeholder="料理名を入力"
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleFoodRemove(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleFoodAdd}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 px-2 py-1.5 hover:bg-orange-50 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                追加
              </button>
            </div>

            {/* 栄養素 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">栄養素</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">カロリー (kcal)</label>
                  <input type="number" value={editNutrition.calories} onChange={(e) => setEditNutrition({ ...editNutrition, calories: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">タンパク質 (g)</label>
                  <input type="number" step="0.1" value={editNutrition.protein} onChange={(e) => setEditNutrition({ ...editNutrition, protein: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">脂質 (g)</label>
                  <input type="number" step="0.1" value={editNutrition.fat} onChange={(e) => setEditNutrition({ ...editNutrition, fat: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">炭水化物 (g)</label>
                  <input type="number" step="0.1" value={editNutrition.carbs} onChange={(e) => setEditNutrition({ ...editNutrition, carbs: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleReevaluate}
                disabled={reevaluating || saving || getValidFoods().length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
              >
                {reevaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    再評価中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AIで再評価
                  </>
                )}
              </button>
              <button
                onClick={handleSaveNutrition}
                disabled={saving || reevaluating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    手動で保存
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-fade-in">
                {error}
              </div>
            )}
          </div>
        )}

        {meal.nutrition_status === "failed" && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm text-gray-400 text-center">
            栄養評価を取得できませんでした
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 text-red-400 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 hover:text-red-500 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "削除中..." : "この記録を削除"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
