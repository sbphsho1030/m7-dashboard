# M7 Dashboard Data Schema｜GHP-09 → GHP-12

GHP-09 將原本只存在於 HTML Dashboard 的每日判斷，整理成可被程式讀取的 JSON 資料層。GHP-10 讓首頁讀取 `latest.json`；GHP-11 / GHP-12 補上 updater、validator、schema 與 GitHub Actions。

## Files

- `latest.json`：最新一日快照，供首頁與自動化流程快速讀取。
- `history.json`：歷史紀錄集合，每日追加或 upsert 一筆 `records[]`。
- `schema.json`：JSON schema 文件，描述 latest/history 的主要欄位。
- `README.md`：本資料層說明。

## Scripts

- `npm run validate`：驗證 `data/latest.json` 與 `data/history.json`。
- `node scripts/update-latest.js <new-latest.json>`：發布新的 latest snapshot，並自動更新 history。
- `node scripts/update-latest.js <new-latest.json> --dry-run`：只檢查、不寫檔。
- `node scripts/update-latest.js <new-latest.json> --no-history`：只更新 latest，不追加 history。

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

## Validation rules

Validator 會檢查：

- latest 必須有 `summary`、`riskLights`、`ranking`、`triggerRules`、`dataQuality`。
- ranking 必須剛好 7 筆。
- ticker 必須是 AAPL / MSFT / GOOGL / AMZN / NVDA / META / TSLA。
- rank 必須唯一且為 1–7。
- risk light 必須是 green / yellow / red / blue / purple。
- history 不可有重複的 `date + reportId`。
- history 必須包含 latest 對應的紀錄。

## Publishing flow

```bash
node scripts/update-latest.js drafts/2026-06-26-latest.json
npm run validate
```

首頁 `index.html` 會直接讀取 `data/latest.json`，因此每日更新資料後，GitHub Pages 固定網址會自動顯示最新 Dashboard。
