# M7 Dashboard v1.3 Product Rules

此文件整理 v1.3 的核心資料流規則。第一階段只建立靜態網站骨架與 sample data，不處理真實日更資料。

## Source Of Truth

1. `docs/context/` 是 rollup / readback / memory chain 的唯一來源。
2. `docs/data/` 是 website display / Archive / latest / daily payload 的展示資料來源。
3. `docs/context/active/previous-daily.json` 是 previous daily readback 的唯一來源。
4. `docs/context/staging/current-week.json` 是 weekly staging 的唯一來源。
5. 未來 weekly / monthly / quarterly / halfyear / yearly rollup 都以 `docs/context/` 內資料為準。
6. `docs/data/previous-daily.json` 與 `docs/data/current-week.json` 若存在，只能視為 legacy / display mirror，不可作為 rollup/readback 來源。
7. 不允許任何 prompt 同時從 `docs/data/previous-daily.json` 和 `docs/context/active/previous-daily.json` 讀取。
8. 不允許任何 prompt 同時從 `docs/data/current-week.json` 和 `docs/context/staging/current-week.json` 讀取。

## Permanent Artifacts

1. Dashboard / Full Report 每天永久保留。
2. `index.html` 是固定入口，不放每日完整內容。
3. 每日 Dashboard 與 Full Report 應以日期檔案保存，並由 manifest 指向。
4. `docs/data/daily/YYYY-MM-DD/dashboard.json` 是網站展示用 daily dashboard payload。
5. `docs/data/daily/YYYY-MM-DD/full-report.json` 是網站展示用 full report payload。

## Readback Rules

1. Full Report 永久保存，但 `notForReadback: true`，不可被未來 rollup 讀回。
2. 每日日更必須讀 `docs/context/active/previous-daily.json`。
3. Daily Top3 只進 `docs/context/staging/current-week.json` staging。
4. Weekly 只讀 `docs/context/staging/current-week.json`。
5. Monthly 只讀 Weekly。
6. Quarterly 只讀 Monthly。
7. Half-Year 只讀 Quarterly。
8. Yearly 只讀 Half-Year。
9. 每日更新時，若 dashboard Top3 有變更，必須同步更新 `docs/data/daily/YYYY-MM-DD/dashboard.json`、`docs/context/active/previous-daily.json`、`docs/context/staging/current-week.json`。

## Rollup Lifecycle

1. 下一層確認後，上一層可移除或退休。
2. 尚未產生 weekly / monthly / quarterly / halfyear / yearly 時，rolling context 對應欄位可為 `null`。
3. Staging 狀態應清楚標示，例如 `collecting`、`ready` 或 `closed`。

## Website Stability Rules

1. 每日更新不得修改 `index.html` / `app.js` / `style.css`，除非使用者明確要求改網站框架。
2. Fetch path 必須由 `siteUrl(path)` 統一處理。
3. 不可使用 `/content/...` 絕對路徑。
4. 不可寫死 repo name。
5. 本機預覽應使用 `http://localhost:8000`，不要依賴 `file://`。

## Scope Guardrails

1. 第一階段只做網站框架與範例資料。
2. 不抓市場資料。
3. 不產投資建議。
4. 不建立每日排程。
5. 不改 GitHub Pages 設定。
6. 不使用後端、資料庫、Node build system 或外部 framework。
