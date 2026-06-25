# M7 Dashboard Data Layer｜v1

M7 Dashboard v1 使用 JSON 資料層驅動畫面：

- `data/latest.json`：最新 Dashboard 快照。
- `data/history.json`：歷史紀錄集合。
- `data/schema.json`：資料格式文件。

首頁 `index.html` 會讀取 `latest.json` 與 `history.json`，用來顯示今日結論、M7 排名、週/月 Delta、紅燈連續天數與資料品質。

Archive `archive.html` 會讀取 `history.json` 自動產生歷史列表。

## v1 daily flow

```bash
node scripts/generate-draft.js inputs/YYYY-MM-DD-notes.json
node scripts/update-latest.js drafts/YYYY-MM-DD-latest.json
npm run validate
```

## Delta convention

若 history 還沒有足夠基準資料：

```json
{
  "weeklyDelta": null,
  "monthlyDelta": null,
  "rankChangeWeek": null,
  "rankChangeMonth": null,
  "deltaNote": "週排名基準不足；月排名基準不足"
}
```

接入足夠 history 後，`update-latest.js` 會透過 `scripts/lib/m7-analytics.js` 產生：

- `weeklyDelta`
- `monthlyDelta`
- `rankChangeWeek`
- `rankChangeMonth`
- `redStreakDays`
- `analytics.maxRedStreak`

## Validation rules

`npm run validate` 會檢查：

- latest 必須有 `summary`、`riskLights`、`ranking`、`triggerRules`、`dataQuality`。
- ranking 必須剛好 7 筆。
- ticker 必須是 AAPL / MSFT / GOOGL / AMZN / NVDA / META / TSLA。
- rank 必須唯一且為 1–7。
- risk light 必須是 green / yellow / red / blue / purple。
- history 不可有重複的 `date + reportId`。
- history 必須包含 latest 對應的紀錄。

## Maintenance principle

v1 後不再追無限 GHP 編號。只有當資料欄位、顯示邏輯或驗證流程在實際使用中出現問題，才進行維護修改。
