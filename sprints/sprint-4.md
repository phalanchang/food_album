# Sprint 4: 食事記録 API

**ゴール**: 食事写真のアップロード・取得・削除ができるCRUD APIが動作する状態

**期間**: 2026-03-28 〜

## タスク
- [x] docker-compose.yml に uploads ボリューム追加
- [x] 食事記録サービス (backend/src/services/meals.ts)
- [x] 食事記録ルート (backend/src/routes/meals.ts)
- [x] index.ts にルート登録 + 静的ファイル配信
- [x] 全エンドポイントの動作確認

## 完了条件
- POST /api/meals で写真付き食事記録が作成できる
- GET /api/meals で一覧取得（ページネーション対応）
- GET /api/meals/:id で詳細取得
- DELETE /api/meals/:id で削除（写真ファイルも削除）
- 認証なしアクセスで 401
- 他ユーザーのデータにアクセスで 404

## メモ
- Sprint 3 (Google OAuth) はスキップ（Client ID 未取得のため後回し）
- 写真は /app/uploads/ に UUID ファイル名で保存
- ファイルサイズ上限: 5MB
- ページネーション: limit/offset 方式、total count を返却
