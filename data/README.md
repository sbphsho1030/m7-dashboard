# M7 Dashboard Data Schema｜GHP-09

GHP-09 將原本只存在於 HTML Dashboard 的每日判斷，整理成可被程式讀取的 JSON 資料層。

## Files

- `latest.json`：最新一日快照，供首頁或自動化流程快速讀取。
- `history.json`：歷史紀錄集合，每日追加一筆 `records[]`。

## Daily record fields

- `date`：報告日期。
- `reportId`：對應 GHP 版本或日報版本。
- `sourceReports`：對應 HTML 頁面。
- `headline` / `oneLineConclusion`：當日摘要。
- `recommendedAction`：今日行為建議，例如不急動、條件式、停止加碼。
- `marketRegime.directionality`：M7 同向性狀態。
- `marketRegime.killSwitch`：是否觸發 Kill Switch。
- `marketRegime.riskLights`：共通風險燈號。
- `m7Ranking[]`：七檔個股排名、評等、新資金態度、風險燈號、Delta、事件備註。
- `triggerRules`：降級、停止加碼、禁止恐慌賣出的條件。
- `dataQuality`：資料是否已重新抓取，以及本筆資料來源狀態。

## Delta convention

正式資料尚未接入前：

```json
{
  "week": null,
  "month": null,
  "rankChangeWeek": null,
  "rankChangeMonth": null,
  "note": "正式週/月資料尚未接入。"
}
```

接入正式資料後，才填入數字，避免把示範欄位誤當真實訊號。

## Next step

GHP-10 可開始讓 `index.html` 讀取 `data/latest.json`，將靜態 HTML 逐步改成資料驅動 Dashboard。
