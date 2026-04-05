# スプリント計画

## Sprint 1: プロジェクト基盤 ✅
- Docker Compose 構成（frontend / backend / db）
- Next.js + Hono + PostgreSQL セットアップ
- 基本ディレクトリ構成

## Sprint 2: 認証基盤（メール+パスワード） ✅
- ユーザー登録 API (POST /api/auth/register)
- ログイン API (POST /api/auth/login)
- JWT ミドルウェア（httpOnly cookie）
- ログイン画面 UI

## Sprint 3: Google OAuth 認証 ⏭️ スキップ
- Google OAuth 2.0 連携（将来対応）

## Sprint 4: 食事記録 API ✅
- 写真アップロード API (POST /api/meals)
- 食事一覧取得 API (GET /api/meals)
- 食事詳細取得 API (GET /api/meals/:id)
- 食事削除 API (DELETE /api/meals/:id)

## Sprint 5: 食事記録 UI ✅
- 写真アップロード画面
- 食事一覧画面（タイムライン形式）
- 食事詳細画面

## Sprint 6: カレンダービュー ✅
- カレンダー表示コンポーネント
- 日付ごとの食事表示

## Sprint 7: AI 栄養評価 ✅
- Claude API 連携（写真から栄養評価）
- 評価結果の表示 UI
- 手動での栄養データ訂正機能

## Sprint 8: 振り返り・レコメンド ✅
- デイリー/ウィークリー/マンスリーサマリー
- 栄養バーグラフ（目標との比較）
- 献立レコメンド機能（Claude API）

## Sprint 9: 栄養再評価 & 編集UI改善 ✅
- 献立リスト編集UIを縦並びリスト（追加・削除可能）に改善
- 食品名ベースでのAI栄養再評価機能
- 手動保存 / AI再評価の選択式UI

## Sprint 10: ヘッダー固定 & ユーザー情報表示 ✅
- ヘッダーを全ページで固定表示（sticky）
- GET /api/auth/me エンドポイント追加
- 右上にログインユーザー名を表示

## Sprint 11: 詳細栄養素表示（アコーディオン） ✅
- AI評価プロンプトにビタミン/ミネラル等12種の詳細栄養素を追加
- 食事詳細画面に「詳細栄養素を見る」アコーディオンUI
- 既存データとの後方互換性を維持

---

## 今後の計画（未着手）

### フェーズ2: ソーシャル & UX強化
- Google OAuth 認証（Sprint 3 再開）
- ユーザープロフィール編集（アバター、表示名変更）
- 食事記録の共有機能（家族・友達間）
- プッシュ通知（食事記録リマインダー）

### フェーズ3: AI機能拡張
- 写真からの自動食事タイプ判定
- 栄養目標のカスタマイズ（ユーザーごとの目標設定）
- 週次/月次の栄養トレンド分析
- 食事パターンの可視化

### フェーズ4: デプロイ & 運用
- Vercel (FE) + Railway/Render (BE) + Supabase (DB) デプロイ
- クラウドストレージ（写真保存先の移行）
- エラー監視・ログ基盤
- パフォーマンス最適化
