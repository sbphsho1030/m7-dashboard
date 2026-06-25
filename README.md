# M7 Daily Dashboard

這個 repository 用來發布 **Magnificent 7（M7）每日投資決策觀察報告** 的 GitHub Pages Dashboard。

網站：

- 最新 Dashboard：<https://sbphsho1030.github.io/m7-dashboard/>
- 歷史 Archive：<https://sbphsho1030.github.io/m7-dashboard/archive.html>
- GitHub Repo：<https://github.com/sbphsho1030/m7-dashboard>

> 注意：本專案內容僅作研究觀察與決策輔助，不是個人化投資建議。

---

## v1 完成定義

M7 Dashboard v1 到 GHP-17 收斂，不再用無限 GHP 編號推進。v1 完成範圍是：

1. notes input 產生 latest draft。
2. draft 發布到 `data/latest.json` 與 `data/history.json`。
3. Dashboard 讀取 latest/history。
4. Archive 自動讀取 history。
5. Debug 連結移到 Debug 區，不放在 Dashboard 頂部。
6. 支援 Action Score：0–100 行動參考分數、分數帶、分數原因。
7. 支援週/月 ranking Delta。
8. 支援紅燈連續天數。
9. Validator 與 GitHub Actions 防止壞資料進入流程。

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
| GHP-14 | Done | `archive.html` 改為讀取 `data/history.json` 自動產生列表 |
| GHP-15 | Done | Dashboard 頂部移除 raw data 連結，整理成正式 UI |
| GHP-16 | Done | 支援週/月排名 Delta；資料不足時顯示 N/A |
| GHP-17 | Done | 支援紅燈連續天數與 v1 完成頁 |
| v1.1 | Done | 補回 Action Score，並納入 validator / schema / Dashboard |

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
│   ├── history.json
│   ├── schema.json
│   └── README.md
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
2. `update-latest.js` 驗證 draft，覆蓋 `data/latest.json`，並 upsert 到 `data/history.json`。
3. `update-latest.js` 會套用週/月 Delta 與紅燈連續天數計算。
4. `validate-data.js` 檢查 latest/history 的結構與一致性，包括每檔 Action Score。
5. GitHub Actions 在 push / PR 時再次跑 `npm run validate`。

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
- `history.json` 是否包含 latest 對應紀錄。
- history 是否有重複 date + reportId。

---

## Dashboard 行為原則

### Score + Delta

正式版不只看今天分數，也看變化：

```text
GOOGL：Score 88，排名第 1
排名：GOOGL 第 1，較上週 +2
紅燈：NVDA 紅燈連續 4 天
```

若 history 還沒有足夠基準資料，Dashboard 會顯示 N/A，不會假裝已有週/月 Delta。

### Kill Switch / 不動作理由

Dashboard 應主動回答：

```text
今日是否需要交易？
今天為什麼不需要恐慌賣出？
今天為什麼不應該追價？
```

### 同向性判斷

```text
分化：輪動，不是全面撤退
半同向：降低新資金速度
全同向：可能是系統性撤資，停止加碼
```

---

## 後續維護原則

v1 後不再追新 GHP 編號。只有出現真實使用問題才修，例如：

- 每日 notes 欄位不夠。
- Score 權重需要調整。
- Delta 計算邏輯需要改成價格 / PE / score。
- Archive 顯示不清楚。
- Dashboard UI 誤導一般使用者。
- GitHub Actions 驗證結果失敗。
