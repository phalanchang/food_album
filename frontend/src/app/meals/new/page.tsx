"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import Link from "next/link";
import BottomNav from "../../components/bottom-nav";
import AppHeader from "../../components/app-header";

const mealTypes = [
  { value: "breakfast", label: "朝食", emoji: "☀️" },
  { value: "lunch", label: "昼食", emoji: "🌤" },
  { value: "dinner", label: "夕食", emoji: "🌙" },
  { value: "snack", label: "間食", emoji: "🍪" },
] as const;

function getDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function NewMealPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [mealType, setMealType] = useState("lunch");
  const [eatenAt, setEatenAt] = useState(getDefaultDateTime);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) return;
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("mealType", mealType);
    formData.append("eatenAt", new Date(eatenAt).toISOString());
    if (memo) formData.append("memo", memo);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "エラーが発生しました");
        return;
      }

      router.push("/");
    } catch {
      setError("サーバーに接続できません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-safe">
      <AppHeader title="食事を記録" backHref="/" />

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
        {/* 写真選択 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all ${
            preview
              ? "h-56 shadow-lg"
              : "h-44 border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 bg-gray-50"
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity">
                  写真を変更
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-3">
                <ImagePlus className="w-7 h-7 text-orange-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">タップして写真を選択</p>
              <p className="text-xs text-gray-400 mt-1">カメラで撮影もできます</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* 食事タイプ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2.5">
            食事タイプ
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMealType(t.value)}
                className={`flex flex-col items-center gap-1 py-2.5 text-sm rounded-xl border-2 transition-all active:scale-[0.97] ${
                  mealType === t.value
                    ? "bg-orange-50 text-orange-600 border-orange-400 font-semibold shadow-sm shadow-orange-100"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 日時 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            日時
          </label>
          <input
            type="datetime-local"
            value={eatenAt}
            onChange={(e) => setEatenAt(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="今日のランチは美味しかった..."
            maxLength={500}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 animate-fade-in">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !photo}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 active:scale-[0.98]"
        >
          {loading ? "記録中..." : "記録する"}
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
