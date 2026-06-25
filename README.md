# M7 Daily Dashboard

這個 repository 用來發布 **Magnificent 7（M7）每日投資決策觀察報告** 的 HTML Dashboard。

網站透過 GitHub Pages 發布：

- 最新 Dashboard：<https://sbphsho1030.github.io/m7-dashboard/>
- 歷史 Archive：<https://sbphsho1030.github.io/m7-dashboard/archive.html>
- GitHub Repo：<https://github.com/sbphsho1030/m7-dashboard>

> 注意：本專案內容僅作研究觀察與決策輔助，不是個人化投資建議。

---

## 目前定位

這個專案已從「每日投資報告」升級為 **投資行為控制儀表板**。

日更的目的不是讓使用者每天交易，而是每天確認：

1. 今天是否需要做事？
2. 是否觸發降級 / 停止加碼 / 恐慌賣出禁止條件？
3. 市場對新資訊的邊際定價是否改變？
4. 量變是否正在累積成質變？

---

## 目前用途

這個 repo 目前用來驗證並承載以下流程：

1. 產生 M7 HTML Dashboard。
2. 覆蓋 `index.html`，讓首頁永遠顯示最新報告。
3. 建立每日歷史頁，保存於 `reports/YYYY/MM/DD.html`。
4. 更新 `archive.html`，方便回查歷史報告。
5. Gmail 寄出每日 10 行摘要與固定連結。

---

## GHP-08 新增核心功能方向

### 1. Delta 變化率

正式版不只看今天的數值，而是看變化：

```text
Forward PE：20.2x，較上週 -1.5x，較上月 -3.8x
排名：GOOGL 第 1，較上週 +2
紅燈：NVDA 紅燈連續 4 天
```

### 2. Kill Switch / 不動作理由

Dashboard 應主動回答：

```text
今日是否需要交易？
今天為什麼不需要恐慌賣出？
今天為什麼不應該追價？
```

### 3. 同向性判斷

用 M7 的同步程度區分：

```text
分化：輪動，不是全面撤退
半同向：降低新資金速度
全同向：可能是系統性撤資，停止加碼
```

### 4. 事件型規則

例如 GOOGL 納入 Dow 後若 sell the news 回檔：

```text
若只是事件消化且 Cloud / backlog thesis 未變，可條件式分批。
若同時 Nasdaq / M7 系統性走弱，轉黃燈觀察。
若基本面負面新聞且跌幅大於同業，暫停加碼。
```

---

## 網站結構

```text
m7-dashboard/
├── index.html
├── archive.html
├── README.md
└── reports/
    └── 2026/
        └── 06/
            ├── 25.html
            ├── 25-ghp06.html
            └── 25-full.html
```

### `index.html`

最新 Dashboard 首頁。正式每日流程會覆蓋這個檔案，所以固定網址永遠指向最新報告：

```text
https://sbphsho1030.github.io/m7-dashboard/
```

### `archive.html`

歷史報告索引頁。用來列出每日報告連結。

```text
https://sbphsho1030.github.io/m7-dashboard/archive.html
```

### `reports/YYYY/MM/DD.html`

每日完整報告。正式版建議每日產生一份日期頁，例如：

```text
reports/2026/06/25-full.html
```

---

## 正式每日流程設計

每日 automation 預計執行以下步驟：

```text
1. 抓取 M7 最新市場資料與新聞
2. 計算價格、估值、排名、風險燈號的週/月 Delta
3. 判斷 M7 同向性與紅燈連續天數
4. 套用 Kill Switch / 停止加碼 / 條件式分批規則
5. 產生今日 HTML Dashboard
6. 覆蓋 index.html
7. 新增 reports/YYYY/MM/DD.html
8. 更新 archive.html
9. Gmail 寄出摘要與連結
```

這樣可以同時保留：

- 一個固定的最新報告網址
- 每日歷史報告
- 可回查的 Archive
- Gmail 短摘要通知
- 對「不動作」的行為控制

---

## 目前測試紀錄

| 測試 | 說明 | 結果 |
|---|---|---|
| M7-Test-GHP-01 | 建立第一版 HTML Dashboard | 成功 |
| M7-Test-GHP-04 | 建立 `archive.html` 與 `reports/2026/06/25.html` | 成功 |
| M7-Test-GHP-05 | 美化 Archive 頁 | 成功 |
| M7-Test-GHP-06 | 驗證首頁更新、歷史頁、Archive、Gmail 流程 | 成功 |
| M7-Test-GHP-07 | 研究型投資者版 Dashboard：分層排序、Heatmap、今日動作 | 成功 |
| M7-Test-GHP-08 | 行為控制版 Dashboard：Delta、Kill Switch、同向性、觸發條件 | 成功 |
| Full Report 2026/06/25 | 建立完整版 M7 分析頁 | 成功 |

---

## 資料與投資聲明

本 repo 的 M7 報告內容可能包含：

- Magnificent 7 個股觀察
- AI Capex / FCF / Cloud growth 檢查
- M7 排名與風險燈號
- Delta 變化率
- 同向性判斷
- 新聞與催化劑摘要
- 情境式風險報酬
- 研究型反身性提問
- Kill Switch / 行為控制規則

限制：

- 資料來源以公開資訊為主。
- 未能以可靠來源確認的欄位應標示 `N/A`，不自行推估。
- 報告不是個人化買賣建議。
- 若內容包含個人持倉、金額或內部策略，不應放在公開 GitHub Pages。

---

## 後續可改進項目

- 將版面拆成共用 CSS，避免每個 HTML 重複樣式。
- 建立 `data/latest.json` 與 `data/history.json`，支援 Delta 計算。
- 接入穩定市場資料源，補足 Forward PE、FCF Yield、200MA、52 週位置。
- 自動計算 M7 同向性、紅燈連續天數與排名變化。
- 產生 `reports/YYYY/MM/DD.html` 時同步更新 `archive.html`。
- 若需要更專業部署，可將同一個 repo 接到 Netlify 或 Cloudflare Pages。
