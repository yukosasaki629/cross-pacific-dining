# CEOダッシュボード

社長がスマホ・PCどちらからでも、重要プロジェクト・進捗・リスク・判断待ち事項を**1分で把握**できる、モバイルファーストの日本語ダッシュボード。

優子の詳細メモと、社長向けの共有ビューを1つのDBから2つのURLで出し分けます。

## 特徴

- **モバイルファースト** — ボトムナビ、カード型UI、片手で読める
- **完全ローカル** — SQLiteファイル1つで完結、外部AI API不要
- **2つのビュー**
  - `/` 優子用(全機能・非公開メモ含む)
  - `/share` 社長共有ビュー(`isSharedWithCEO=true` のみ、非公開メモは表示しない)
- **スプレッドシート移行容易** — 各テーブルは Smartsheet / Microsoft Lists / Google Sheets の1シートに対応するフラット構造
- **共有用レポート生成** — 登録データから日本語のサマリーを生成、コピー/ダウンロード可

## 起動方法

```bash
cd ceo-dashboard
cp .env.example .env
npm run setup       # install + DB作成 + サンプルデータ投入
npm run dev         # http://localhost:3000
```

PCで `http://localhost:3000` を開けば優子ビュー、社長に送る場合は `http://localhost:3000/share` をブラウザに登録します。

スマホからアクセスするには、同じ Wi-Fi 上で PC の IP アドレス(例:`http://192.168.1.10:3000`)を使うか、開発サーバーを `npm run dev -- -H 0.0.0.0` で起動してください。

## 画面構成

| URL                          | 内容                                              | 公開 |
| ---------------------------- | ------------------------------------------------ | --- |
| `/`                          | ホームダッシュボード(重要Pj・判断・リスク・フォローアップ・期限超過) | 優子 |
| `/projects`                  | プロジェクト一覧(ステータスでフィルタ)                | 優子 |
| `/projects/[id]`             | プロジェクト詳細(概要 / タスク / 判断 / リスク / 更新 / 非公開メモ) | 優子 |
| `/decisions`                 | 判断が必要な事項                                    | 優子 |
| `/risks`                     | リスクあり案件(高・中)                              | 優子 |
| `/followups`                 | 今週のフォローアップ                                | 優子 |
| `/report`                    | 共有用レポート生成(Markdown・コピー・ダウンロード)      | 優子 |
| `/share`                     | 社長共有ビュー(重要Pj・判断・リスク のサマリー)         | 社長 |
| `/share/projects/[id]`       | 社長共有用プロジェクト詳細(非公開メモは含まない)        | 社長 |

## データモデル(Smartsheet等への移行)

各モデルは1シートに対応します:

| モデル      | スプレッドシートでの列(例)                                                                |
| ---------- | ------------------------------------------------------------------------------- |
| Project    | id, name, objective, owner, department, status, riskLevel, priority, nextAction, dueDate, currentSummary, successMetric, isSharedWithCEO, privateMemo, createdAt, updatedAt |
| Task       | id, projectId, title, owner, status, dueDate, priority, memo, createdAt, updatedAt |
| Decision   | id, projectId, topic, background, options, recommendation, deadline, impactIfDelayed, importance, status |
| Risk       | id, projectId, description, severity, mitigation, owner, status                  |
| Update     | id, projectId, date, content, nextAction                                          |
| FollowUp   | id, projectId, title, who, dueDate, status, memo                                  |

`owner` / `department` 等は外部キーではなくテキスト列のため、CSV/エクスポートしてそのままスプレッドシートに貼れます。

全件JSON取得は将来 `/api/export` を追加すれば対応できます(現状はDBファイル `prisma/dev.db` 自体をバックアップすれば十分)。

## 仮データ

`npm run db:seed` で以下のサンプルデータが入ります:

- プロジェクト5件(出店計画、AIパイロット、報酬刷新、日本本社アラインメント、店舗ガイドライン)
- タスク10件、判断事項4件、リスク5件、更新履歴6件、フォローアップ7件
- `isSharedWithCEO=false` のプロジェクト1件(共有ビューから除外される例)
- `privateMemo` ありのプロジェクト3件(社長共有ビューには出ない例)

## 技術スタック

- Next.js 15 + TypeScript + React 19
- Tailwind CSS 3
- Prisma ORM + SQLite
- React Server Components / Server Actions
- 外部依存ゼロ(AI API・外部サービス不要)
