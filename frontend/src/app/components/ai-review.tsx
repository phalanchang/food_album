"use client";

import { useState } from "react";
import { MessageCircle, Loader2, Bot } from "lucide-react";

interface Props {
  period: string;
  date: string;
}

export default function AiReview({ period, date }: Props) {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const fetchReview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ period, date }),
      });
      if (!res.ok) {
        setError("総評の取得に失敗しました");
        return;
      }
      const json = await res.json();
      setReview(json.data.review);
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
          onClick={fetchReview}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-purple-200 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AIが分析中...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              AIに総評を聞く
            </>
          )}
        </button>
        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl shadow-sm border border-purple-100 p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-purple-500" />
        </div>
        <h3 className="text-sm font-bold text-purple-800">AIの総評</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {review}
      </p>
    </div>
  );
}
