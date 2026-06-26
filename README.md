# M7 Dashboard

每日 Magnificent 7（M7）投資決策儀表板，提供 **Dashboard 首頁、完整分析報告、歷史 Archive 與每日資料更新流程**。

此專案的目標不是自動下單，也不是取代投資判斷，而是把每日 M7 觀察重點整理成可快速閱讀、可回查、可維護的 GitHub Pages Dashboard。

GitHub Pages：

```text
https://sbphsho1030.github.io/m7-dashboard/
```

---

## 專案內容

| 項目          | 說明                        |
| ----------- | ------------------------- |
| Dashboard   | 快速查看今日 M7 投資觀察重點          |
| Full Report | 閱讀每日完整研究型分析報告             |
| Archive     | 回顧歷史每日紀錄                  |
| Data Files  | 儲存最新資料、近期資料與歷史資料          |
| Validation  | 驗證 Dashboard、資料檔與完整報告是否一致 |

---

## 使用方式

每日優先閱讀順序：

```text
Dashboard
↓
確認今日動作 / Score / Kill Switch / 紅燈狀態
↓
若有降級、紅燈連續、Score 明顯變化或事件風險
↓
進入 Full Report 閱讀完整分析
↓
需要回查過去紀錄時進 Archive
```

Dashboard 用來快速判斷「今天是否需要動作」。
Full Report 用來理解「為什麼今天是這個結論」。
Archive 用來回顧「過去每天的判斷與變化」。

---

## Dashboard 主要資訊

Dashboard 首頁會呈現：

* 今日核心結論
* 建議動作
* Kill Switch 是否觸發
* M7 排名
* Action Score
* 新資金狀態
* 風險燈號
* 週 / 月排名變化
* 紅燈連續天數
* 完整分析報告連結

---

## Action Score 定義

Action Score 是每日行動參考分數，不是自動買賣指令。

|  Score | 解讀            |
| -----: | ------------- |
| 85–100 | 高優先觀察，可分批但不追價 |
|  70–84 | 可觀察，等條件       |
|  55–69 | 中性，不急動        |
|  40–54 | 暫停新資金         |
|   0–39 | 高風險，避免追價      |

Score 會綜合考慮：

* 基本面品質
* 估值位置
* 技術與動能
* AI Capex / FCF 壓力
* 事件風險
* 相對排序
* 新資金可行性

---

## Full Report 規格

Full Report 是完整研究型每日報告，不應只是 Dashboard 摘要頁。

每份正式日報至少包含：

1. 今日總結
2. M7 主決策表
3. 現金流與 AI Capex 檢查
4. 市場與新聞摘要
5. 七檔個股分析
6. 前瞻性壓力測試
7. 研究型投資者的反身性提問
8. 今日總排序
9. 最終結論
10. 資料來源與限制

Full Report 必須和 Dashboard 保持一致：

* 日期一致
* reportId 一致
* 今日動作一致
* topTicker / topScore 一致
* 風險燈號一致
* 不可殘留 pre-run 字樣
* 不可縮水成簡短摘要頁

---

## 目前版本狀態

目前已完成：

* Dashboard 首頁
* Full Report 每日完整報告
* Archive 歷史回顧
* Action Score
* v1.2 資料分層
* full report 與 Dashboard 一致性檢查
* validation-trigger 驗證流程

後續將依照實際使用需求，持續優化內容品質、更新穩定性與閱讀體驗。

---

## 版本更新紀錄

### v1.1

* 補回 Action Score
* Dashboard 顯示行動參考分數
* 補強 validator / schema / Dashboard 顯示一致性
* 每檔 M7 必須包含 score、scoreBand、scoreReason
* 讓每日更新資料更適合 Dashboard 使用

### v1.2

* 重整資料結構，避免歷史資料無限制累積
* 將最新資料、近期資料、歷史索引與月資料分層保存
* 改善 Archive 讀取方式
* 改善 Dashboard 只讀必要資料的效率
* 保留 legacy history.json 作為相容檔
* 補強 full report 與 Dashboard 的一致性檢查
* 補強正式報告不得殘留 pre-run 的驗證
* 補強 full report 不可縮水的章節檢查

---

## 資料結構

```text
data/latest.json
data/recent.json
data/history-index.json
data/history/YYYY-MM.json
data/history.json
reports/YYYY/MM/DD-full.html
inputs/YYYY-MM-DD-notes.json
```

| 檔案                             | 用途                                   |
| ------------------------------ | ------------------------------------ |
| `data/latest.json`             | 最新每日快照                               |
| `data/recent.json`             | 近期資料快取，用於 Dashboard Delta 與紅燈連續天數    |
| `data/history-index.json`      | Archive 用輕量索引                        |
| `data/history/YYYY-MM.json`    | 每月完整 daily record                    |
| `data/history.json`            | legacy compatibility file，不作為主要歷史資料庫 |
| `reports/YYYY/MM/DD-full.html` | 每日完整分析報告                             |
| `inputs/YYYY-MM-DD-notes.json` | 每日 notes input                       |

---

## Dashboard 使用原則

* Dashboard 首頁用來快速查看今日重點結論。
* Full Report 用來閱讀完整每日研究內容。
* Archive 用來回顧歷史每日紀錄。
* 每日更新以最新正式版資料為準。
* 若資料仍在整理或驗證中，正式版內容應覆蓋前一版內容。
* Dashboard 與 Full Report 必須一致，但不能互相取代。
* Full Report 是 Dashboard 的研究底稿，不是 Dashboard 的複製品。

---

## 更新流程

每日正式更新流程：

```bash
node scripts/generate-draft.js inputs/YYYY-MM-DD-notes.json
node scripts/update-latest.js drafts/YYYY-MM-DD-latest.json
npm run validate
```

v1.2 更新時應維持以下順序：

```text
1. 更新 full report HTML
2. 更新 data/latest.json
3. 更新 data/recent.json
4. 更新 data/history-index.json
5. 更新 data/history/YYYY-MM.json
6. 更新 compact legacy data/history.json
7. 最後更新 data/validation-trigger.json
8. 回讀 Dashboard / Full Report / Archive 自我檢查
```

---

## 驗證項目

`npm run validate` 會檢查：

* `data/latest.json`
* `data/recent.json`
* `data/history-index.json`
* `data/history/YYYY-MM.json`
* `data/history.json`
* `latest.sourceReports.fullReport`

Full Report 反身性檢查包含：

* full report 檔案必須存在
* full report 必須包含 latestDate
* full report 必須包含 latestReportId
* full report 必須包含 recommendedAction
* full report 必須包含 topTicker / topScore
* 正式版不得包含 `pre-run`
* 正式版不得包含 `等待正式版`
* 正式版不得包含 `會覆蓋`
* full report 必須包含十個研究報告章節
* full report 必須包含七檔 M7 ticker
* full report 必須包含 AI Capex、FCF、Micron 等核心概念
* full report 不得短到像 Dashboard 摘要頁

---

## 反身性檢查清單

每次日更完成後必須自問：

```text
Dashboard 顯示的是哪一天？
latest.json 的 reportId 是什麼？
Dashboard 的 fullReport link 指到哪個 HTML？
該 HTML 是否為正式版？
HTML 是否還有 pre-run / 等待正式版 / 會覆蓋？
Full Report 是否包含完整十個章節？
Full Report 是否包含七檔個股分析？
Full Report 是否包含 AI Capex / FCF / 壓力測試 / 反身性問答？
Archive 是否有同一筆日期與 reportId？
recent / monthly / latest 是否一致？
validation-trigger 是否最後才更新？
GitHub Actions 是否通過或仍未回傳？
```

---

## 維護方向

後續維護將聚焦於：

* 每日更新內容的穩定性
* Dashboard 與 Full Report 的一致性
* Full Report 的研究深度
* 歷史資料的可讀性與可維護性
* GitHub Pages 的顯示品質
* 驗證流程與錯誤排查能力
* 使用者實際閱讀流程的改善

---

## GitHub About 建議

GitHub repo 右側 About 區塊需手動設定。

建議 Description：

```text
Daily Magnificent 7 investment dashboard with dashboard view, full research brief, and historical archive.
```

建議 Website：

```text
https://sbphsho1030.github.io/m7-dashboard/
```

建議 Topics：

```text
m7
magnificent-7
stocks
investing
dashboard
market-analysis
github-pages
finance
research-brief
```

---

## Disclaimer

This project is for research notes and personal dashboard tracking only.
It is not personalized investment advice, financial advice, or an automated trading system.
