"use client";

import { useState } from "react";
import { Lightbulb, ChefHat, Loader2, Sparkles } from "lucide-react";

interface Recommendation {
  ingredient: string;
  reason: string;
  recipe: string;
}

interface Props {
  period: string;
  date: string;
}

export default function Recommendations({ period, date }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const fetchRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ period, date }),
      });
      if (!res.ok) {
        setError("レコメンドの取得に失敗しました");
        return;
      }
      const json = await res.json();
      setRecommendations(json.data.recommendations);
      setLoaded(true);
    } catch {
      setError("サーバーに接続できません");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-200 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              提案を生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              献立提案を見る
            </>
          )}
        </button>
        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm text-gray-400 text-center">
        提案を生成できませんでした
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
        <ChefHat className="w-4 h-4 text-green-500" />
        おすすめ献立
      </h3>
      {recommendations.map((rec, i) => (
        <div key={i} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2 animate-fade-in delay-${Math.min(i + 1, 5)}`}>
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            {rec.ingredient}
          </p>
          <p className="text-xs text-gray-500 pl-8">{rec.reason}</p>
          <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-3 ml-8 border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">{rec.recipe}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
