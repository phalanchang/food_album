import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">🍽️ Food Album</h1>
      <p className="text-gray-600 text-center">
        毎日の食事を写真で記録しよう
      </p>
      <Link
        href="/login"
        className="mt-8 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        ログイン / 新規登録
      </Link>
    </main>
  );
}
