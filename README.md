# M7 Daily Dashboard

這個 repository 用來發布 **Magnificent 7（M7）每日投資決策觀察報告** 的 GitHub Pages Dashboard。

網站：

- 最新 Dashboard：<https://sbphsho1030.github.io/m7-dashboard/>
- 歷史 Archive：<https://sbphsho1030.github.io/m7-dashboard/archive.html>
- GitHub Repo：<https://github.com/sbphsho1030/m7-dashboard>

> 注意：本專案內容僅作研究觀察與決策輔助，不是個人化投資建議。

---

## v1.2 完成定義

M7 Dashboard v1 到 GHP-17 收斂，不再用無限 GHP 編號推進。v1.2 補上長期資料分層，避免 `history.json` 無限制變大。

v1.2 資料分層：

1. `data/latest.json`：只放最新快照，會每日覆蓋。
2. `data/recent.json`：只保留最近約 90 天，用於 Dashboard Delta 與紅燈連續天數。
3. `data/history-index.json`：Archive 用的輕量索引，只放日期、headline、link、topScore 等摘要。
4. `data/history/YYYY-MM.json`：月份完整 daily record。
5. `data/history.json`：legacy compatibility file，不再作為主要歷史資料庫，也不再無限制累積。

後續只針對真實使用痛點維護，不追 GHP999。

---

## Score 定義

Score 是「行動參考分數」，不是自動買賣指令。

```text
85–100：高優先觀察，可分批但不追價
70–84：可觀察，等條件
55–69：中性，不急動
40–54：暫停新資金
0–39：高風險，避免追價
```

每檔 ranking 必須包含：

```json
{
  "score": 88,
  "scoreBand": "高優先觀察",
  "scoreReason": "Cloud / backlog thesis 較完整。"
}
```

---

## GHP 進度

| 版本 | 狀態 | 重點 |
|---|---:|---|
| GHP-08 | Done | 行為控制 Dashboard：Delta、Kill Switch、不動作理由、同向性、事件規則 |
| GHP-09 | Done | 新增 `data/latest.json`、`data/history.json`、`data/README.md` |
| GHP-10 | Done | `index.html` 改為讀取 `data/latest.json` 的資料驅動首頁 |
| GHP-11 | Done | 新增 `scripts/update-latest.js`、`scripts/validate-data.js`、共用資料檢查函式 |
| GHP-12 | Done | 新增 `data/schema.json`、GitHub Actions data validation workflow |
| GHP-13 | Done | 新增 `scripts/generate-draft.js` 與 notes input 範例 |
| GHP-14 | Done | `archive.html` 改為讀取歷史資料自動產生列表 |
| GHP-15 | Done | Dashboard 頂部移除 raw data 連結，整理成正式 UI |
| GHP-16 | Done | 支援週/月排名 Delta；資料不足時顯示 N/A |
| GHP-17 | Done | 支援紅燈連續天數與 v1 完成頁 |
| v1.1 | Done | 補回 Action Score，並納入 validator / schema / Dashboard |
| v1.2 | Done | 拆分 history：latest / recent / index / monthly，避免 history.json 無限長大 |

---

## 網站結構

```text
m7-dashboard/
├── index.html
├── archive.html
├── README.md
├── package.json
├── data/
│   ├── latest.json
│   ├── recent.json
│   ├── history-index.json
│   ├── history.json
│   ├── schema.json
│   ├── README.md
│   └── history/
│       └── 2026-06.json
├── inputs/
│   └── 2026-06-26-notes.example.json
├── scripts/
│   ├── generate-draft.js
│   ├── validate-data.js
│   ├── update-latest.js
│   └── lib/
│       ├── m7-analytics.js
│       └── m7-data.js
├── .github/
│   └── workflows/
│       └── validate-data.yml
└── reports/
    └── 2026/
        └── 06/
            ├── 25.html
            ├── 25-ghp06.html
            ├── 25-ghp10.html
            ├── 25-ghp11-12.html
            ├── 25-ghp17.html
            └── 25-full.html
```

---

## 正式每日流程

```bash
node scripts/generate-draft.js inputs/YYYY-MM-DD-notes.json
node scripts/update-latest.js drafts/YYYY-MM-DD-latest.json
npm run validate
```

範例：

```bash
node scripts/generate-draft.js inputs/2026-06-26-notes.example.json
node scripts/update-latest.js drafts/2026-06-26-latest.json --dry-run
npm run validate
```

流程說明：

1. `generate-draft.js` 將每日 notes 轉成 `drafts/YYYY-MM-DD-latest.json`。
2. `update-latest.js` 驗證 draft，覆蓋 `data/latest.json`。
3. `update-latest.js` 更新 `data/recent.json`、`data/history-index.json`、`data/history/YYYY-MM.json`。
4. `update-latest.js` 會套用週/月 Delta 與紅燈連續天數計算。
5. `validate-data.js` 檢查 latest/recent/index/monthly/legacy history 的結構與一致性。
6. GitHub Actions 在 push / PR 時再次跑 `npm run validate`。

---

## 驗證流程

```bash
npm run validate
```

檢查項目包含：

- `latest.json` 是否有 7 檔 M7 排名。
- Rank 是否唯一且為 1–7。
- Ticker 是否為 AAPL / MSFT / GOOGL / AMZN / NVDA / META / TSLA。
- 每檔是否有 `score`、`scoreBand`、`scoreReason`。
- Kill Switch、Data Quality、Trigger Rules 是否存在。
- `recent.json` 是否包含 latest 對應紀錄。
- `history-index.json` 是否包含 latest 對應索引。
- `data/history/YYYY-MM.json` 是否包含 latest 對應月份紀錄。
- history 是否有重複 date + reportId。

---

## Dashboard 行為原則

Dashboard 只讀：

```text
latest.json + recent.json
```

Archive 只讀：

```text
history-index.json
```

月份完整紀錄在需要時才讀：

```text
data/history/YYYY-MM.json
```

這樣一年後不需要每次載入整包歷史資料，也避免單一 `history.json` 變成大型檔案。

---

## 後續維護原則

v1.2 後不再追新 GHP 編號。只有出現真實使用問題才修，例如：

- 每日 notes 欄位不夠。
- Score 權重需要調整。
- Delta 計算邏輯需要改成價格 / PE / score。
- Archive 顯示不清楚。
- Dashboard UI 誤導一般使用者。
- GitHub Actions 驗證結果失敗。
