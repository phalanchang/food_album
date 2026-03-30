"use client";

import { useState } from "react";
import { Lightbulb, ChefHat, Loader2 } from "lucide-react";

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
      <div className="mt-4">
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              提案を生成中...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
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
      <div className="mt-4 bg-white rounded-lg shadow-sm p-4 text-sm text-gray-400 text-center">
        提案を生成できませんでした
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1">
        <ChefHat className="w-4 h-4" />
        おすすめ献立
      </h3>
      {recommendations.map((rec, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 space-y-1">
          <p className="font-medium text-gray-800">{rec.ingredient}</p>
          <p className="text-xs text-gray-500">{rec.reason}</p>
          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
            {rec.recipe}
          </p>
        </div>
      ))}
    </div>
  );
}
