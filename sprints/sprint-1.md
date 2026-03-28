# Sprint 1: プロジェクト基盤構築

**ゴール**: `docker compose up` で3コンテナが起動し、フロントエンド・バックエンド・DBが正常に動作する状態

**期間**: 2026-03-28 〜

## タスク
- [x] docker-compose.yml 作成（3コンテナ構成）
- [x] Backend: Hono + TypeScript セットアップ（ヘルスチェックAPI）
- [x] Frontend: Next.js + Tailwind CSS セットアップ
- [x] Database: PostgreSQL 初期化スクリプト + マイグレーション基盤
- [x] CLAUDE.md 作成（セッション継続性確保）
- [x] .gitignore, .env.example 作成
- [x] スプリント管理ディレクトリ作成
- [ ] 要件定義ドキュメントをリポジトリに移動
- [ ] main ブランチに初期コミット
- [ ] docker compose up --build で動作確認

## 完了条件
- `docker compose up --build` が成功する
- http://localhost:3004 で Next.js ページが表示される
- http://localhost:3005/api/health が JSON を返す
- PostgreSQL が接続可能

## メモ
- ポート番号: フロントエンド 3004、バックエンド 3005（自宅環境の都合）
- WSL2 環境のため WATCHPACK_POLLING=true を設定済み
