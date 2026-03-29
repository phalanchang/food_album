# Sprint 2: 認証基盤（メール+パスワード）

**ゴール**: メール+パスワードでユーザー登録・ログインができる状態

**期間**: 2026-03-28 〜

## タスク
- [x] 型定義 (backend/src/types/auth.ts)
- [x] 認証サービス (backend/src/services/auth.ts)
- [x] JWT ミドルウェア (backend/src/middleware/auth.ts)
- [x] 認証ルート POST /api/auth/register, POST /api/auth/login
- [x] index.ts にルート登録
- [x] ログイン/新規登録 UI (frontend/src/app/login/page.tsx)
- [x] トップページにログインリンク追加
- [x] マイグレーション実行 + 動作確認

## 完了条件
- POST /api/auth/register でユーザー登録できる
- POST /api/auth/login でログインできる
- JWT が httpOnly cookie に保存される
- 重複メール登録で 409 エラー
- 誤パスワードで 401 エラー
- /login ページでフォームが表示される

## メモ
- migrate.ts の import.meta.dirname を fileURLToPath ベースに修正（tsx 互換性）
- バリデーションエラーは統一メッセージ「入力内容に誤りがあります」
- メール列挙攻撃防止のため、ログイン失敗は同一メッセージ
