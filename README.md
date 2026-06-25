# M7 Daily Dashboard

這個 repository 用來發布 **Magnificent 7（M7）每日投資決策觀察報告** 的 HTML Dashboard。

網站透過 GitHub Pages 發布：

- 最新 Dashboard：<https://sbphsho1030.github.io/m7-dashboard/>
- 歷史 Archive：<https://sbphsho1030.github.io/m7-dashboard/archive.html>
- GitHub Repo：<https://github.com/sbphsho1030/m7-dashboard>

> 注意：本專案內容僅作研究觀察與決策輔助，不是個人化投資建議。

---

## 目前用途

這個 repo 目前用來驗證並承載以下流程：

1. 產生 M7 HTML Dashboard。
2. 覆蓋 `index.html`，讓首頁永遠顯示最新報告。
3. 建立每日歷史頁，保存於 `reports/YYYY/MM/DD.html`。
4. 更新 `archive.html`，方便回查歷史報告。
5. Gmail 寄出每日 10 行摘要與固定連結。

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
2. 產生今日 HTML Dashboard
3. 覆蓋 index.html
4. 新增 reports/YYYY/MM/DD.html
5. 更新 archive.html
6. Gmail 寄出摘要與連結
```

這樣可以同時保留：

- 一個固定的最新報告網址
- 每日歷史報告
- 可回查的 Archive
- Gmail 短摘要通知

---

## 目前測試紀錄

| 測試 | 說明 | 結果 |
|---|---|---|
| M7-Test-GHP-01 | 建立第一版 HTML Dashboard | 成功 |
| M7-Test-GHP-04 | 建立 `archive.html` 與 `reports/2026/06/25.html` | 成功 |
| M7-Test-GHP-05 | 美化 Archive 頁 | 成功 |
| M7-Test-GHP-06 | 驗證首頁更新、歷史頁、Archive、Gmail 流程 | 成功 |
| Full Report 2026/06/25 | 建立完整版 M7 分析頁 | 成功 |

---

## 資料與投資聲明

本 repo 的 M7 報告內容可能包含：

- Magnificent 7 個股觀察
- AI Capex / FCF / Cloud growth 檢查
- M7 排名與風險燈號
- 新聞與催化劑摘要
- 情境式風險報酬
- 研究型反身性提問

限制：

- 資料來源以公開資訊為主。
- 未能以可靠來源確認的欄位應標示 `N/A`，不自行推估。
- 報告不是個人化買賣建議。
- 若內容包含個人持倉、金額或內部策略，不應放在公開 GitHub Pages。

---

## 後續可改進項目

- 將版面拆成共用 CSS，避免每個 HTML 重複樣式。
- 建立 `data/latest.json`，方便未來做互動式圖表。
- 產生 `reports/YYYY/MM/DD.html` 時同步更新 `archive.html`。
- 若需要更專業部署，可將同一個 repo 接到 Netlify 或 Cloudflare Pages。
