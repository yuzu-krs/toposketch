# ArchSketch

技術アーキテクチャ図を作成・編集・保存できる Web アプリケーション。システム構成図の設計・共有を高速化するためのローカル開発環境で完結するツールです。

| レイヤー | 技術スタック |
| --- | --- |
| フロントエンド | Angular 20 / TypeScript / Tailwind CSS |
| バックエンド | ASP.NET Core Web API (.NET 10) / C# |
| データベース | SQL Server 2022 / ストアドプロシージャ |

## 主な機能

- **ドラッグ＆ドロップ編集** — 左パレットからキャンバスへコンポーネントをドロップ、クリックでも追加
- **技術コンポーネント** — Angular / ASP.NET Core / SQL Server / Azure / AWS / Docker / Kubernetes など 40+ のアイコン
- **任意コンポーネント** — 表示名とアクセント色を指定したカスタムノードを作成可能
- **接続とラベル** — ノード端のポートからドラッグして接続。ラベル・実線/点線・矢印方向を編集
- **グループ化・自動レイアウト** — 複数ノードのグループ化、階層型（Sugiyama 方式の簡略版）自動整列
- **ズーム・パン・Undo / Redo** — ホイールズーム、Space+ドラッグ／中ボタンでパン、100 ステップの履歴
- **保存・読み込み・削除** — REST API 経由で SQL Server に永続化（開発用 InMemory モードも搭載）
- **エクスポート** — JSON / SVG / PNG（2倍解像度）。JSON は再インポート可能
- **ダークモード / ライトモード** — 設定はブラウザに保存。エクスポート画像にも反映

## 画面構成

```
+--------------------------------------------------------------------------+
| ツールバー: 新規/開く/保存 | Undo/Redo/削除 | グループ/自動レイアウト | ズーム | エクスポート | テーマ |
+---------------+-------------------------------------------+----------------+
| コンポーネント |                編集キャンバス                 |  プロパティ     |
| パレット       |   (ドラッグ＆ドロップ / 接続 / マーキー選択)      |  パネル        |
| (検索・カテゴリ) |                                           |  (選択要素に  |
| カスタム作成   |                                           |   追従)        |
+---------------+-------------------------------------------+----------------+
```

## セットアップ

### 前提

- Node.js 20.19+ / 22.12+ / 24（動作確認: v24.19）
- .NET SDK 10（動作確認: 10.0.400）
- SQL Server を使う場合: ローカルインスタンス（既定インスタンス、Windows 認証）。なくても InMemory モードで動作

### 1) バックエンドを起動

```powershell
cd backend/src/ArchSketch.Api
dotnet run
# http://localhost:5080 で待ち受け
```

既定の `Storage:Provider` は `InMemory`（セットアップ不要。再起動でデータは消える）。

### 2) フロントエンドを起動

```powershell
cd frontend
npm install   # 初回のみ
npm start     # http://localhost:4200（/api を 5080 へプロキシ）
```

ブラウザで http://localhost:4200 を開きます。初回は空のキャンバスに「サンプル図を読み込む」ボタンがあります。

## SQL Server モード（ストアドプロシージャ使用）

`backend/src/ArchSketch.Api/appsettings.json` を変更:

```json
{
  "Storage": { "Provider": "SqlServer", "InitializeDatabase": true },
  "ConnectionStrings": {
    "ArchSketch": "Server=localhost;Database=ArchSketch;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

- `InitializeDatabase: true` の場合、起動時に `db/*.sql`（アセンブリ埋め込み）が**冪等に**実行され、データベース・テーブル・ストアドプロシージャが自動作成されます
- SQL 認証を使う場合は接続文字列を `Server=localhost;Database=ArchSketch;User Id=sa;Password=***;TrustServerCertificate=True` のように変更してください
- 手動でスキーマを用意したい場合は `db/01_create_database.sql` → `02_create_tables.sql` → `03_create_procedures.sql` の順に実行し、`InitializeDatabase` を `false` にしてください

データアクセスはすべてストアドプロシージャ経由です（`SqlServerDiagramRepository`）:

| プロシージャ | 用途 |
| --- | --- |
| `dbo.usp_Diagrams_List` | 一覧（更新日降順） |
| `dbo.usp_Diagrams_GetById` | 1 件取得 |
| `dbo.usp_Diagrams_Insert` | 新規作成 |
| `dbo.usp_Diagrams_Update` | 更新（更新日時を SQL 側で設定） |
| `dbo.usp_Diagrams_Delete` | 削除 |

環境変数で一時的に切り替えることもできます:

```powershell
$env:Storage__Provider = 'SqlServer'; dotnet run
```

## REST API

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/health` | ストレージの状態（200 / 503） |
| GET | `/api/diagrams` | 構成図の一覧（本文なし） |
| GET | `/api/diagrams/{id}` | 1 件取得 |
| POST | `/api/diagrams` | 作成（`{ name, contentJson }`） |
| PUT | `/api/diagrams/{id}` | 更新 |
| DELETE | `/api/diagrams/{id}` | 削除 |

開発時は `http://localhost:5080/openapi/v1.json` に OpenAPI スキーマを公開します。

## 操作方法

| 操作 | 方法 |
| --- | --- |
| コンポーネント追加 | パレットからドラッグ＆ドロップ / クリックで中央に追加 |
| ノード移動 | ノードをドラッグ（複数選択はまとめて移動、8px グリッドにスナップ） |
| 接続を作る | ノードをホバー → 端の ● から目的ノードへドラッグ |
| ラベル編集 | ノード / エッジ / グループをダブルクリック、または右パネル |
| 複数選択 | 空白からドラッグ（マーキー）/ Shift+クリック / Ctrl+A |
| パン | Space を押しながらドラッグ、または中ボタンドラッグ |
| ズーム | ホイール（カーソル位置基準）/ `+` `-` / `0`=全体表示 / `1`=100% |
| グループ化 / 解除 | Ctrl+G / Ctrl+Shift+G |
| 複製 | Ctrl+D |
| Undo / Redo | Ctrl+Z / Ctrl+Y（Ctrl+Shift+Z） |
| 保存 | Ctrl+S（初回は新規作成、以降は更新） |
| 削除 | Delete / Backspace |

## 図データの JSON スキーマ（`schema: 1`）

```jsonc
{
  "schema": 1,
  "name": "システム構成図",
  "nodes": [
    {
      "id": "uuid", "type": "angular", "label": "SPA フロントエンド",
      "x": 280, "y": 120, "width": 148, "height": 64,
      "color": "#dd0031", "groupId": null, "metadata": { "言語": "TypeScript" }
    }
  ],
  "edges": [
    { "id": "uuid", "source": "...", "target": "...", "label": "REST",
      "style": "solid", "direction": "forward" }
  ],
  "groups": [ { "id": "uuid", "label": "Azure", "color": "#0078d4" } ],
  "background": { "grid": true }
}
```

バックエンドは本文を「有効な JSON であること」のみ検証し、スキーマ解釈はフロントエンド（`normalizeDocument`）が担います。フィールドの追加・変更がバックエンドに波及しない保守性重視の設計です。

## テストとビルド

```powershell
# バックエンド: ビルド + 単体/統合テスト（InMemory で HTTP まで検証）
dotnet build backend/ArchSketch.slnx
dotnet test backend/ArchSketch.slnx

# フロントエンド: 本番ビルド
cd frontend && npm run build

# フロントエンド: 単体テスト（Chrome ヘッドレス / Jasmine + Karma）
npx ng test --watch=false --browsers=ChromeHeadless
```

テスト内容:

- バックエンド 24 件 — Service 単体（検証・正規化・DTO変換）/ リポジトリ CRUD / HTTP API 統合（往返し・検証・404・400）
- フロントエンド 30 件 — 状態ストア（履歴・ジェスチャ・グループ・複製）/ 自動レイアウト / JSON 正規化 / アイコンレジストリ / エクスポート SVG 組み立て

## バックエンドのアーキテクチャ（3層レイヤード）

処理の流れ: **Controller → Service → Repository → Stored Procedure → SQL Server**

| レイヤー |場所 | 責務 |
| --- | --- | --- |
| Presentation | `Controllers/` | HTTP 入出力（ルーティング・ステータスコード・ProblemDetails）のみ。業務ロジックを持たない |
| Business Logic | `Services/` | リクエスト検証・正規化（名前trim等）・Entity⇔DTO変換。`IDiagramService` / `IHealthService` |
| Data Access | `Repositories/` | ストアドプロシージャ呼び出しのみ（`SqlServerDiagramRepository`）、開発用 `InMemoryDiagramRepository`、起動時のDB初期化 |

依存関係は DI で管理し、非同期はすべて `async/await`。API 入出力は `Dtos/`、DB 上のデータ表現は `Entities/`、永続化の抽象は `Repositories/IDiagramRepository.cs` に分離しています。検証エラーは `DiagramValidationException` として Service から Controller へ伝播し、Controller が 400 に変換します。

## プロジェクト構成

```
toposketch/
├── backend/
│   ├── ArchSketch.slnx
│   ├── src/ArchSketch.Api/           # ASP.NET Core Web API（3層レイヤード）
│   │   ├── Controllers/              # Presentation Layer
│   │   ├── Services/                 # Business Logic Layer
│   │   ├── Repositories/             # Data Access Layer（SP呼び出し / InMemory / DB初期化）
│   │   ├── Entities/                 # DB データの表現（Diagram / DiagramSummary）
│   │   └── Dtos/                     # API 入出力コントラクト
│   └── tests/ArchSketch.Api.Tests/   # xUnit（Service 単体 + WebApplicationFactory 統合）
├── db/                               # SQL スクリプト（単一の真実の情報源。API に埋め込み）
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   └── 03_create_procedures.sql
└── frontend/
    └── src/app/
        ├── models/                   # ドキュメントモデル / ジオメトリ / アイコンレジストリ / サンプル
        ├── services/                 # 状態ストア / API / レイアウト / エクスポート / テーマ / トースト
        └── components/               # toolbar / palette / canvas / properties / dialogs
```

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| 「バックエンドに接続できません」 | API (`dotnet run`) が 5080 で起動しているか確認。`npm start` を実行したディレクトリが `frontend/` か確認（プロキシ設定 `proxy.conf.json`） |
| 起動時に DB 初期化エラー | SQL Server (MSSQLSERVER) サービスが実行中か確認。Windows 認証で CREATE DATABASE 権限が必要。回避するには `Storage:Provider` を `InMemory` に |
| 保存しても再起動後に消える | InMemory モードで動作しています。SQL Server モードに切り替えてください |
| ポート競合 | `Properties/launchSettings.json`（5080）と `proxy.conf.json` / `ng serve --port`（4200）を変更 |
| node_modules の同期が遅い | OneDrive 配下のため、`frontend/node_modules` を OneDrive の同期対象から除外することを推奨 |

## 拡張ポイント

- **アイコン / パレット追加**: `frontend/src/app/models/icon-registry.ts` の `ICONS` と `PALETTE` に 1 エントリずつ追加するだけ
- **新しいストレージ**: `IDiagramRepository` を実装して `StorageSetup.AddDiagramStorage` に分岐を追加
- **エクスポート形式**: `ExportService` にメソッド追加（SVG は属性描画なので自己完結）
- **自動レイアウト改良**: `LayoutService` の order/barycenter 部分のみ差し替え可能
