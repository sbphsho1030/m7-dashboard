# M7 Daily Update Prompt

Prompt Version: M7-DailyPrompt-v1.0
Last Updated: 2026-06-26
Project: m7-dashboard
Repo: sbphsho1030/m7-dashboard

---

## 0. Mission

M7 Dashboard 的每日更新目標不是產生一篇新聞摘要，而是產生一組可回查、可驗證、可比較的每日投資觀察資料。

固定產品定位：

- Dashboard 回答：今天要不要動？
- Full Report 回答：為什麼今天這樣判斷？
- Archive 回答：過去每天怎麼判斷？
- Market Data 回答：今天行情資料完整度到哪裡？
- Validator 回答：這次日更是否真的一致？

每日更新必須優先維持資料一致性、可追溯性與不假造資料。

---

## 1. Required Files

每日正式日更完成時，以下檔案必須同步到同一個 date / reportId / dataQuality.status：

```text
data/latest.json
data/recent.json
data/history-index.json
data/history/YYYY-MM.json
data/history.json
data/market/YYYY-MM-DD.json
reports/YYYY/MM/DD-full.html
data/validation-trigger.json
```

`data/validation-trigger.json` 必須是最後一步更新。

只要任一主要檔案未更新成功，不得宣告日更成功。

---

## 2. Required Read-before-write Inputs

開始日更前必須先讀取：

```text
prompts/m7-daily-update.prompt.md
prompts/m7-full-report-template.md
data/latest.json
data/recent.json
data/history-index.json
data/history/YYYY-MM.json
data/history.json
reports/previous-day-full.html, if available
data/market/previous-day.json, if available
```

目的：

- 取得前一日排名、Score、風險燈、紅燈連續天數。
- 取得前一日 Full Report 的未解觀察條件。
- 避免每天像重新開始。
- 確認本次日更是否與歷史資料一致。

---

## 3. Market-data Ingestion Rule

每日正式更新前必須先嘗試 market-data ingestion。

目標資料：

```text
M7: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA
Indices / ETFs: NASDAQ, SPX, DJIA, QQQ, SPY
Fields: open, high, low, close, volume, changePercent
```

資料品質分級：

| status | 意義 |
|---|---|
| formal_full_market_data | 完整行情 + 新聞 + Full Report |
| formal_partial_market_data | 部分行情 + 新聞 + Full Report |
| formal_web_refreshed_close_summary | 沒完整行情，但有收盤新聞摘要 |
| pre_run_web_refreshed_limited_quotes | 預跑版，不可視為正式結論 |
| manual_or_seed_data | 測試 / 人工資料，不適合作決策 |

硬規則：

```text
Market data ingestion failure or incompleteness degrades dataQuality; it must not abort the daily update and must not fabricate OHLCV.
```

中文：

```text
行情資料抓取失敗或不完整時，只能降級資料品質，不得中止每日更新，也不得假造 OHLCV。
```

缺失欄位必須保持 `null` 或 `N/A`，並在 `data/market/YYYY-MM-DD.json` 與 Full Report 內說明原因。

---

## 4. Market Data File Requirements

每日必須產生：

```text
data/market/YYYY-MM-DD.json
```

至少包含：

```json
{
  "schemaVersion": "M7-market-v1.0",
  "project": "m7-dashboard",
  "date": "YYYY-MM-DD",
  "marketSession": "YYYY-MM-DD US close",
  "generatedAt": "YYYY-MM-DDTHH:mm:ss+08:00",
  "status": "formal_partial_market_data",
  "ingestionResult": {
    "attempted": true,
    "completeOhlcv": false,
    "degraded": true,
    "reason": "..."
  },
  "indices": {},
  "symbols": {},
  "qualityRule": "Market data ingestion failure or incompleteness degrades dataQuality; it must not abort the daily update and must not fabricate OHLCV."
}
```

---

## 5. Data Synchronization Rules

### latest.json

必須包含：

- `updatedAt`
- `latestDate`
- `latestReportId`
- `sourceReports.marketData`
- `summary`
- `riskLights`
- `ranking`
- `dataQuality.status`
- `dataQuality.marketDataFile`

### recent.json

`records[0]` 必須和 `latest.json` 同步。

### history-index.json

0626 record 必須包含：

- `date`
- `reportId`
- `headline`
- `recommendedAction`
- `topTicker`
- `topScore`
- `maxRedStreak`
- `dataQualityStatus`
- `monthFile`
- `fullReport`

### data/history/YYYY-MM.json

monthly record 必須和 latest/recent 同步，尤其：

- 不可停留在舊時間戳。
- 不可停留在舊 headline。
- 必須包含 marketData reference。
- 必須包含 dataQuality.status。

### data/history.json

legacy compatibility file，只保留 compact record，但 `records[0]` 必須和 latest 同步。

---

## 6. Dashboard UX Rules

Dashboard 首頁只做今日決策，不做網站導覽。

必須：

- Hero 區只保留 `完整版分析` 入口。
- 不在 Dashboard hero 顯示 Archive。
- Full Report link 必須使用 cache-bust，例如 `?v=latestReportId-updatedAt`。
- Dashboard 顯示資料品質，但用白話說明。

Dashboard 不回答歷史查詢；歷史查詢入口放在 Full Report 與 README。

---

## 7. Full Report Rules

Full Report 必須依照 `prompts/m7-full-report-template.md` 的固定章節生成。

禁止：

- 不得刪除章節。
- 不得改章節名稱。
- 不得把七檔個股分析縮成個股分層。
- 不得把完整報告縮成 Dashboard summary。
- 不得把 task 成功標準放進正式投資報告主章節。

必須：

- 深色版風格。
- 頂部有回 Dashboard / 歷史報告 / 上一日報告。
- 底部有回 Dashboard / 歷史報告 / 回到頁首。
- 明確顯示 dataQuality.status。
- 明確說明 market-data ingestion 結果。
- 來源必須是可點連結。
- 包含十個固定章節。
- 包含七檔 M7 個股分析。
- 包含 AI Capex / FCF 檢查。
- 包含前瞻性壓力測試。
- 包含基於當天 M7 矛盾訊號建立的反身性檢查。

---

## 8. Reflexive Check Rule

反身性檢查必須由當天 M7 的矛盾訊號產生，不能寫通用空話。

生成順序：

```text
今日市場資料
↓
M7 主表
↓
新聞摘要
↓
Capex / FCF 分析
↓
個股分析
↓
找出今日最大矛盾
↓
產生反身性問答
```

例：若 Micron 強、Apple 跌、MSFT 被 AI spending 擔憂拖累，則反身性問題應該檢查：

```text
我是不是把 AI 供應鏈受益方、AI Capex 支出方、產品週期承壓方、事件敘事方，全部混成同一種 AI 股票？
```

---

## 9. Source Link Rule

Full Report 的資料來源必須是可點連結：

```html
<a href="SOURCE_URL" target="_blank" rel="noopener">Source Title</a>
```

禁止：

- 只寫 Reuters / AP / MarketWatch 文字但沒有連結。
- 放無來源的精確數字。
- 用猜測補完整 OHLCV。

---

## 10. validation-trigger Rule

`data/validation-trigger.json` 必須最後更新。

內容必須包含：

- `schemaVersion`
- `project`
- `updatedAt`
- `date`
- `reportId`
- `purpose`
- `filesExpected`
- `dataQualityExpected`
- `marketDataRulesExpected`
- `reflexiveChecksExpected`

若 validation-trigger 不是最後更新，不得宣告完整成功。

---

## 11. Success Criteria

只有以下條件全部成立，才可宣告日更成功：

- latest / recent / history-index / monthly / legacy / market / full report / validation-trigger 全部更新。
- 所有檔案 date / reportId 一致。
- 所有檔案 dataQuality.status 一致。
- monthly history 不停留在舊資料。
- Full Report 沒縮水。
- Full Report 有固定十章。
- Full Report 有七檔個股分析。
- Full Report 有資料來源連結。
- Dashboard hero 不顯示 Archive。
- validation-trigger 是最後一步。
- 若 CI / GitHub status 尚未回傳，不得說 CI pass。

---

## 12. Final Report Back to User

日更完成後，必須回報：

```text
Task 是否成功
若未成功，是哪個檔案不一致
market-data ingestion 結果
dataQuality.status
更新的檔案清單
Full Report 是否符合固定模板
validation / CI 狀態
GitHub Pages 是否可能需要等待部署或清快取
```
