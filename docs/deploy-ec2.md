# AWS EC2 デプロイ手順

Docker Compose構成をそのままEC2上で動かす手順です。

---

## 前提

- AWSアカウントを持っている
- ドメインは未取得でもOK（IPアドレスでアクセス可能）
- GitHubリポジトリにコードがpush済み

---

## Step 1: EC2インスタンスの作成

### AWSコンソールでの操作

1. **EC2ダッシュボード** → **インスタンスを起動**
2. 以下の設定で作成:

| 項目 | 推奨値 |
|------|--------|
| 名前 | `food-album` |
| AMI | **Ubuntu Server 24.04 LTS** |
| インスタンスタイプ | **t3.small**（メモリ2GB。3コンテナ動かすので t3.micro だと厳しい） |
| キーペア | 新規作成 → `.pem` ファイルをダウンロード（SSH接続に必要） |
| ストレージ | **20GB**（写真を保存するため余裕を持たせる） |

### セキュリティグループの設定

「ネットワーク設定」→「編集」で以下のインバウンドルールを追加:

| ポート | プロトコル | ソース | 用途 |
|--------|-----------|--------|------|
| 22 | TCP | マイIP | SSH接続 |
| 80 | TCP | 0.0.0.0/0 | HTTP（Webアクセス） |
| 443 | TCP | 0.0.0.0/0 | HTTPS（将来用） |

> **注意**: 3004, 3005 ポートは直接開放しない。後でNginxをリバースプロキシとして使う。

3. **インスタンスを起動** をクリック

---

## Step 2: EC2にSSH接続

```bash
# キーペアの権限を変更（初回のみ）
chmod 400 ~/Downloads/food-album.pem

# SSH接続（パブリックIPはEC2コンソールで確認）
ssh -i ~/Downloads/food-album.pem ubuntu@<パブリックIP>
```

---

## Step 3: EC2にDockerをインストール

```bash
# パッケージ更新
sudo apt update && sudo apt upgrade -y

# Dockerインストール（公式リポジトリから）
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# ubuntuユーザーをdockerグループに追加
sudo usermod -aG docker ubuntu

# Gitインストール（Ubuntuにはデフォルトで入っていることが多い）
sudo apt install -y git

# グループ変更を反映（一度ログアウトして再接続）
exit
```

再度SSH接続:
```bash
ssh -i ~/Downloads/food-album.pem ubuntu@<パブリックIP>

# 動作確認
docker --version
docker compose version
```

---

## Step 4: コードをクローン＆環境変数の設定

```bash
# コードを取得
git clone https://github.com/phalanchang/food_album.git
cd food_album

# 本番用の環境変数ファイルを作成
cat > .env << 'EOF'
# --- 本番用設定 ---
POSTGRES_PASSWORD=<強いパスワードに変更>
JWT_SECRET=<ランダムな長い文字列に変更>
ANTHROPIC_API_KEY=<あなたのAPIキー>
EOF
```

パスワードとシークレットの生成:
```bash
# ランダム文字列の生成（コピーして.envに貼り付け）
openssl rand -base64 32   # POSTGRES_PASSWORD用
openssl rand -base64 48   # JWT_SECRET用
```

---

## Step 5: 本番用 docker-compose を作成

開発用と分けて、本番用の構成ファイルを作成します。

```bash
cat > docker-compose.prod.yml << 'YAML'
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: food_album
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/food_album
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: "3005"
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://<パブリックIP>:3005
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
  uploads:
YAML
```

> **`<パブリックIP>`** はEC2のパブリックIPに置き換えてください。

---

## Step 6: Nginx設定ファイルを作成

```bash
cat > nginx.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    # フロントエンド（Next.js）
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # バックエンドAPI
    location /api/ {
        proxy_pass http://backend:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # アップロードされた画像
    location /uploads/ {
        proxy_pass http://backend:3005;
    }
}
NGINX
```

---

## Step 7: 起動

```bash
# ビルド＆起動
docker compose -f docker-compose.prod.yml up --build -d

# マイグレーション実行
docker compose -f docker-compose.prod.yml exec backend npx tsx src/db/migrate.ts

# ログ確認
docker compose -f docker-compose.prod.yml logs -f
```

ブラウザで `http://<パブリックIP>` にアクセスして動作確認！

---

## Step 8: フロントエンドのAPI URL修正

EC2上ではフロントエンドからAPIを呼ぶ際、`localhost` ではなくパブリックIPまたはNginx経由のパスを使う必要があります。

フロントエンドの `NEXT_PUBLIC_API_URL` を以下のどちらかに設定:

```
# 方法A: Nginx経由（推奨 — ブラウザからは同一オリジンになる）
NEXT_PUBLIC_API_URL=

# この場合、フロントエンドの fetch は /api/... への相対パスで動く
# もしフロントエンドが絶対URLを使っている場合は空文字列にするか、
# http://<パブリックIP> にする

# 方法B: 直接バックエンドを指定
NEXT_PUBLIC_API_URL=http://<パブリックIP>
```

> フロントエンドのコードで `NEXT_PUBLIC_API_URL` をどう使っているかによって選択してください。Nginx経由なら同一オリジンなのでCORS問題も回避できます。

---

## 運用コマンド集

```bash
# 停止
docker compose -f docker-compose.prod.yml down

# コード更新時
git pull
docker compose -f docker-compose.prod.yml up --build -d

# ログ確認
docker compose -f docker-compose.prod.yml logs -f backend

# DBバックアップ
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U postgres food_album > backup_$(date +%Y%m%d).sql

# DBリストア
cat backup_YYYYMMDD.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres food_album
```

---

## 将来の改善（オプション）

### HTTPS対応（独自ドメイン取得後）
1. Route 53 または外部DNSでドメインを設定
2. Certbot（Let's Encrypt）でSSL証明書を取得
3. Nginx設定に443ポートを追加

### Elastic IP の割り当て
EC2を停止/起動するとパブリックIPが変わるため、固定IPが必要な場合:
- EC2ダッシュボード → Elastic IP → 割り当て → インスタンスに関連付け
- **無料**（インスタンスに関連付けている間）

### コスト目安
| リソース | 月額目安 |
|----------|----------|
| EC2 t3.small | 約 $15/月 |
| EBS 20GB | 約 $2/月 |
| Elastic IP | 無料（関連付け中） |
| **合計** | **約 $17/月** |

※ 無料利用枠（初年度）がある場合は t3.micro を使えば EC2 は無料。ただし3コンテナはメモリが厳しいので注意。
