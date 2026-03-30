# Sprint 7: AI 栄養評価

**ゴール**: 食事写真アップロード時にClaude APIで自動栄養評価、結果を詳細ページに表示

**期間**: 2026-03-30 〜

## タスク
- [x] @anthropic-ai/sdk インストール
- [x] DB マイグレーション (002_add_nutrition.sql)
- [x] 栄養評価サービス (services/nutrition.ts)
- [x] meals サービス/ルートに栄養評価フィールド・非同期トリガー追加
- [x] docker-compose.yml に ANTHROPIC_API_KEY 環境変数追加
- [x] 詳細ページに栄養評価UI追加 (meals/[id]/page.tsx)
- [x] 動作確認（APIキー未設定時 skipped 確認済み）

## 完了条件
- 食事記録作成時に非同期で栄養評価が実行される
- APIキー未設定時: nutrition_status='skipped' で正常動作
- APIキー設定時: 写真からカロリー・栄養素・コメントを自動評価
- 詳細ページに評価結果（カロリー・P/F/C・コメント）が表示される
- 評価中は「分析中」、失敗時は「取得できませんでした」と表示

## APIキー設定方法
```bash
# .env ファイルを作成するか、環境変数で設定
export ANTHROPIC_API_KEY=sk-ant-xxxxx
docker compose up --build
```

## メモ
- nutrition_result は JSONB: { foods, calories, protein, fat, carbs, comment }
- 非同期評価: POSTレスポンスはブロックしない
- モデル: claude-sonnet-4-20250514 (Vision対応)
- 写真はbase64エンコードで送信
