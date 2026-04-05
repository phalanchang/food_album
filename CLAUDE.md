# Food Album - Claude Code Session Guide

## Project Overview
食事写真を記録し、AIで栄養評価・献立レコメンドを提供するWebサービス。
SNS風デザイン、モバイルファースト。UIは日本語。

## Tech Stack
- Frontend: Next.js (App Router, Tailwind CSS v4) on port 3004
- Backend: Hono (Node.js) on port 3005
- Database: PostgreSQL on port 5432
- Container: Docker Compose (3コンテナ構成)

## Quick Commands
```bash
# 全コンテナ起動
docker compose up

# 全コンテナ起動（リビルド）
docker compose up --build

# マイグレーション実行
docker compose exec backend npx tsx src/db/migrate.ts

# ログ確認
docker compose logs -f backend
docker compose logs -f frontend
```

## Project Structure
```
food_album/
├── frontend/          # Next.js (App Router, Tailwind CSS)
│   └── src/app/       # ページコンポーネント
├── backend/           # Hono API server
│   └── src/
│       ├── routes/    # APIルート
│       ├── db/        # DB接続・マイグレーション
│       ├── middleware/ # 認証ミドルウェア等
│       └── services/  # ビジネスロジック
├── db/                # PostgreSQL初期化スクリプト
├── docs/              # 要件定義等ドキュメント
└── sprints/           # スプリント計画・進捗管理
```

## Architecture Decisions
- Auth: JWT (httpOnly cookie)。bcryptjs でパスワードハッシュ。google-auth-library で Google OAuth
- Passport.js は不使用（シンプルさ優先）
- ファイルアップロード: MVPではローカル `/uploads`、将来はクラウドストレージ
- API: RESTful、全ルートは `/api/` 配下

## Database
- Connection: `postgresql://postgres:postgres@db:5432/food_album`
- Tables: `users`, `meals`（詳細は `backend/src/db/migrations/`）
- 全テーブル UUID 主キー

## Authentication Flow
- Email+Password: POST /api/auth/register → POST /api/auth/login → JWT返却
- Google OAuth: POST /api/auth/google → トークン検証 → JWT返却
- JWT は httpOnly cookie に保存
- 認証が必要なルートは auth middleware で検証

## API Response Format
- 成功: `{ data: T }`
- エラー: `{ error: string }`

## Conventions
- TypeScript strict mode
- Backend バリデーション: Zod
- Frontend: Server Components デフォルト、必要時のみ Client Components
- 日時: TIMESTAMPTZ (UTC) で保存
- ファイル命名: kebab-case、コンポーネント: PascalCase

## Development Workflow
- main ブランチ: 常にエラーなく動作する状態を維持
- 開発: feature/* ブランチで作業 → PR でマージ
- スプリント管理: `/sprints/` ディレクトリ参照

## Current Status
Sprint 11 完了。詳細は `/sprints/sprint-11.md` を参照。
