"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import BottomNav from "../../components/bottom-nav";

const mealTypes = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
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
    <main className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">食事を記録</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 写真選択 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-52 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-orange-400 transition-colors"
        >
          {preview ? (
            <img
              src={preview}
              alt="プレビュー"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-400">写真を選択</p>
            </>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            食事タイプ
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMealType(t.value)}
                className={`py-2 text-sm rounded-lg border transition-colors ${
                  mealType === t.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日時 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日時
          </label>
          <input
            type="datetime-local"
            value={eatenAt}
            onChange={(e) => setEatenAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !photo}
          className="w-full py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "記録中..." : "記録する"}
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
