"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import exifr from "exifr";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

  function toLocalDateTimeString(date: Date) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function guesssMealType(date: Date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 10) return "breakfast";
    if (hour >= 10 && hour < 15) return "lunch";
    if (hour >= 15 && hour < 21) return "dinner";
    return "snack";
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));

    try {
      const exif = await exifr.parse(file, ["DateTimeOriginal"]);
      if (exif?.DateTimeOriginal) {
        const taken = new Date(exif.DateTimeOriginal);
        setEatenAt(toLocalDateTimeString(taken));
        setMealType(guesssMealType(taken));
      }
    } catch {
      // EXIFが読めない場合は現在の値をそのまま維持
    }
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
          className={`relative w-full rounded-2xl overflow-hidden transition-all ${
            preview
              ? "h-56 shadow-lg"
              : "h-44 border-2 border-dashed border-gray-200 bg-gray-50"
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm active:scale-95 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  撮り直す
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm active:scale-95 transition-all"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  写真から選ぶ
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 px-5 py-3 rounded-xl bg-orange-100 hover:bg-orange-200 active:scale-95 transition-all"
                >
                  <Camera className="w-7 h-7 text-orange-500" />
                  <span className="text-xs font-medium text-orange-600">カメラで撮影</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <ImagePlus className="w-7 h-7 text-blue-400" />
                  <span className="text-xs font-medium text-blue-500">写真から選ぶ</span>
                </button>
              </div>
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
