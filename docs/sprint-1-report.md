---
marp: false
theme: default
paginate: true
header: "Food Album - Sprint 1 Report"
footer: "2026-03-28"
style: |
  section {
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  h1 {
    color: #e67e22;
  }
  h2 {
    color: #2c3e50;
  }
  table {
    font-size: 0.85em;
  }
---

# Sprint 1: プロジェクト基盤構築
## 完了報告

**Food Album - 食事アルバム**

---

# プロジェクト概要

毎日の食事写真を記録し、AIによる栄養評価・献立レコメンドを提供するWebサービス

- **コンセプト**: SNS風デザインで食事記録を楽しく続けられるUX
- **ターゲット**: 自分 + 家族・友達（スマートフォン中心）
- **AI活用**: Claude APIで写真から栄養評価・レシピ提案

---

# Sprint 1 のゴール

> `docker compose up` で3コンテナが起動し、
> フロントエンド・バックエンド・DBが正常に動作する状態

---

# 技術スタック

| レイヤー | 技術選定 |
|----------|----------|
| フロントエンド | Next.js 15 (App Router) + Tailwind CSS v4 |
| バックエンド | Hono (Node.js) + TypeScript |
| データベース | PostgreSQL 16 |
| コンテナ | Docker Compose (3コンテナ構成) |
| 認証 | JWT + Google OAuth (予定) |
| AI | Claude API (予定) |

---

# システム構成図

```
┌─────────────────────────────────────────────┐
│  Docker Compose                             │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Frontend │  │ Backend  │  │    DB    │  │
│  │ Next.js  │→│  Hono    │→│PostgreSQL│  │
│  │ :3004    │  │  :3005   │  │  :5432   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 完了タスク一覧

- docker-compose.yml 作成（3コンテナ構成）
- Backend: Hono + TypeScript セットアップ（ヘルスチェックAPI）
- Frontend: Next.js + Tailwind CSS セットアップ
- Database: PostgreSQL 初期化スクリプト + マイグレーション基盤
- CLAUDE.md 作成（セッション継続性確保）
- .gitignore, .env.example 作成
- スプリント管理ディレクトリ作成
- 要件定義ドキュメントをリポジトリに移動
- main ブランチに初期コミット + 動作確認

---

# 完了条件の達成状況

| 条件 | 結果 |
|------|------|
| `docker compose up --build` が成功する | OK |
| http://localhost:3004 でページが表示される | OK |
| http://localhost:3005/api/health がJSONを返す | OK |
| PostgreSQL が接続可能 | OK |

---

# プロジェクト構成

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

---

# MVP ロードマップ

| フェーズ | 内容 |
|----------|------|
| **Sprint 1** (今回) | プロジェクト基盤構築 |
| MVP | ログイン、写真アップロード、一覧表示、カレンダービュー |
| フェーズ2 | AI栄養評価、デイリーサマリー |
| フェーズ3 | 振り返りグラフ、献立レコメンド、ユーザー登録機能 |

---

# 次のステップ

- Sprint 2 の計画策定
- ログイン機能（メール+パスワード / Google OAuth）の実装
- 食事写真アップロード・登録機能の実装

---

<!-- _class: lead -->

# Thank you!

**Food Album** - 毎日の食事を写真で記録しよう
