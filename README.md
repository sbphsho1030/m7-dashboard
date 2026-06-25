# M7 Daily Dashboard

這個 repository 用來發布 **Magnificent 7（M7）每日投資決策觀察報告** 的 GitHub Pages Dashboard。

網站：

- 最新 Dashboard：<https://sbphsho1030.github.io/m7-dashboard/>
- 歷史 Archive：<https://sbphsho1030.github.io/m7-dashboard/archive.html>
- GitHub Repo：<https://github.com/sbphsho1030/m7-dashboard>

> 注意：本專案內容僅作研究觀察與決策輔助，不是個人化投資建議。

---

## 目前定位

這個專案已從「每日投資報告」升級為 **投資行為控制儀表板 + JSON 資料管線**。

日更目的不是每天交易，而是每天確認：

1. 今天是否需要做事？
2. 是否觸發降級 / 停止加碼 / 恐慌賣出禁止條件？
3. 市場對新資訊的邊際定價是否改變？
4. 量變是否正在累積成質變？

---

## GHP 進度

| 版本 | 狀態 | 重點 |
|---|---:|---|
| GHP-08 | Done | 行為控制 Dashboard：Delta、Kill Switch、不動作理由、同向性、事件規則 |
| GHP-09 | Done | 新增 `data/latest.json`、`data/history.json`、`data/README.md` |
| GHP-10 | Done | `index.html` 改為讀取 `data/latest.json` 的資料驅動首頁 |
| GHP-11 | Done | 新增 `scripts/update-latest.js`、`scripts/validate-data.js`、共用資料檢查函式 |
| GHP-12 | Done | 新增 `data/schema.json`、GitHub Actions data validation workflow |

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
├── scripts/
│   ├── validate-data.js
│   ├── update-latest.js
│   └── lib/
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
            └── 25-full.html
```

---

## 每日更新流程

GHP-10 之後，首頁不再需要每天重寫大量 HTML。每日只要更新 JSON：

```bash
node scripts/update-latest.js drafts/2026-06-26-latest.json
npm run validate
```

更新器會：

1. 讀取新的 latest snapshot。
2. 驗證 `latest.json` 必要欄位。
3. 覆蓋 `data/latest.json`。
4. 自動轉成 history record。
5. upsert 到 `data/history.json`，同一天同 reportId 會取代舊資料。
6. 再驗證 latest/history 一致性。

Dry run：

```bash
node scripts/update-latest.js drafts/2026-06-26-latest.json --dry-run
```

只更新 latest、不追加 history：

```bash
node scripts/update-latest.js drafts/2026-06-26-latest.json --no-history
```

---

## 驗證流程

本地驗證：

```bash
npm run validate
```

檢查項目包含：

- `latest.json` 是否有 7 檔 M7 排名。
- Rank 是否唯一且為 1–7。
- Ticker 是否為 AAPL / MSFT / GOOGL / AMZN / NVDA / META / TSLA。
- Kill Switch、Data Quality、Trigger Rules 是否存在。
- `history.json` 是否包含 latest 對應紀錄。
- history 是否有重複 date + reportId。

GitHub Actions：

- push / PR 修改 `data/**`、`scripts/**`、`package.json` 或 workflow 時會自動跑 `npm run validate`。
- 也可以手動從 Actions 頁面執行 `Validate M7 data`。

---

## 資料檔案

### `data/latest.json`

最新一日快照，首頁會直接讀取這個檔案。

### `data/history.json`

歷史紀錄集合，每日追加或 upsert 一筆 `records[]`。

### `data/schema.json`

JSON schema 文件。正式驗證目前使用 `scripts/lib/m7-data.js` 的無相依 custom validator，避免引入外部套件。

---

## Dashboard 行為原則

### Delta 變化率

正式版不只看今天數值，而是看變化：

```text
Forward PE：20.2x，較上週 -1.5x，較上月 -3.8x
排名：GOOGL 第 1，較上週 +2
紅燈：NVDA 紅燈連續 4 天
```

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

### 事件型規則

例如 GOOGL 納入 Dow 後若 sell the news 回檔：

```text
若只是事件消化且 Cloud / backlog thesis 未變，可條件式分批。
若同時 Nasdaq / M7 系統性走弱，轉黃燈觀察。
若基本面負面新聞且跌幅大於同業，暫停加碼。
```

---

## 下一步

GHP-13 可補「每日資料產生器」，把人工整理的市場資料、新聞摘要與估值資料轉成 `drafts/YYYY-MM-DD-latest.json`，再交給 `update-latest.js` 發布。
