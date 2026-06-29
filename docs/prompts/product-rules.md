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

## Dashboard Signal Filter

1. Dashboard 每日最多只顯示 Daily Top3。
2. 每日原始觀察可以多於 3 筆，但進入 Dashboard 前必須先經過燈號篩選。
3. Green：可進入 Top3 候選。通常具備明確主題、足夠證據、可描述的 thesisImpact、可追蹤 watchSignals，且不是單日雜訊。
4. Yellow：可進入觀察池，但預設不進 Dashboard Top3。通常是早期訊號、證據不足、影響仍模糊、或與既有 thesis 的關係尚未穩定。
5. Red：不得進 Dashboard，只能留在內部觀察或排除。通常是重複噪音、缺乏來源、與 M7 thesis 無關、純價格波動、或無法形成可驗證 watchSignals。
6. 燈號評分依據包括：source quality、sourceItemCount、recurrence、freshness、contradictionRisk、theme relevance、company relevance、thesisImpact、persistence、watchSignals 是否具體。
7. persistence 判斷應以 recurrence、跨日延續、跨來源重複、是否連到既有 theme 或 thesis 為準；單一孤立 headline 預設不得標為 recurring。
8. thesisImpact 判斷應說明該訊號如何改變、支持、削弱或不影響既有投資假說；無法描述 impact 的項目不得進 Green。
9. evidenceProfile 判斷應至少說明來源數量、來源型態、證據強度、新鮮度、矛盾風險、入選理由與相對前一日變化。
10. 為避免每日 7 檔雜訊污染 Dashboard，原始觀察不得因為公司名稱出現、短線價格波動、社群熱度或單一新聞而自動進 Top3；必須先通過 Green 篩選，並在 Green 候選中排序選出最多三項。

## Full Report Dynamic Sections

1. Full Report 只針對當日 Top3 或重要延伸主題產生。
2. section 數量可動態變化，依當日內容需要決定。
3. 沒有必要時，Full Report 可以很短。
4. 不應為了固定格式而硬產生空洞章節。
5. 可產生章節的情況包括：Top3 需要背景補充、證據鏈需要解釋、theme 之間有交互影響、watchSignals 需要具體化、或 thesisImpact/actionBias 有明顯變化。
6. 不應產生章節的情況包括：沒有新增資訊、只是重述 dashboard、只有 Red/Yellow 觀察且未升級為重要延伸主題、或只是為了湊固定章節數。
7. Full Report 永久保存，但必須標示 `notForReadback: true`。
8. Full Report 不可被未來 rollup / readback 讀取。

## What Changed Rules

1. What Changed 只能比較今日 `docs/data/daily/YYYY-MM-DD/dashboard.json` 的 Top3 與 `docs/context/active/previous-daily.json` 的前一日 Top3。
2. 不得回讀 Full Report。
3. 不得從長篇歷史內容自由推論。
4. 新增主題：今日 Top3 有、前一日 Top3 無，且不是同一 theme/topic 的合理延續。
5. 延續主題：今日與前一日 topic/theme/company exposure 明顯相同或高度相近。
6. 降級主題：前一日 Top3 仍有觀察價值，但今日未進 Top3，或從 Green 降為 Yellow。
7. 消失主題：前一日 Top3 在今日無足夠證據、無 recurrence、或不再有 watchSignals 支撐。
8. thesisImpact 改變：同一主題的 `thesisImpact` 從支持、削弱、中性、風險或不確定之間發生明確變化。
9. actionBias 改變：同一主題的 `actionBias` 發生明確變化，例如 watch、monitor、reduce、avoid 等方向改變。
10. evidenceProfile 改變：來源數量、來源型態、證據強度、新鮮度、矛盾風險、recurrence 或 whatChanged 發生明確變化。

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

## Top3 Data Contract Rules

1. Top3 既有欄位不可任意改名：`topic`、`summary`、`companies`、`theme`、`type`、`persistence`、`thesisImpact`、`actionBias`、`direction`、`horizon`、`watchSignals`、`confidence`、`evidenceProfile`。
2. `evidenceProfile` 既有欄位不可任意改名：`sourceItemCount`、`recurrence`、`whySelected`、`whatChanged`。
3. `evidenceProfile` 應支援補充欄位：`sourceType`、`evidenceStrength`、`freshness`、`contradictionRisk`。
4. 若舊 sample data 尚未包含補充欄位，仍維持相容；新資料應優先補齊。

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
