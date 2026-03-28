export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">🍽️ Food Album</h1>
      <p className="text-gray-600 text-center">
        毎日の食事を写真で記録しよう
      </p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">
          サーバー接続テスト中...
        </p>
      </div>
    </main>
  );
}
