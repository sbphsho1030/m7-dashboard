# M7 Full Report Fixed Template

Template Version: M7-FullReportTemplate-v1.0
Last Updated: 2026-06-26
Project: m7-dashboard

---

## Purpose

This template fixes the structure of each daily M7 Full Report.

The task may fill in daily content, data, sources, and analysis, but it must not delete sections, rename sections, or shrink the report into a dashboard summary.

Full Report is the research brief behind the Dashboard.

```text
Dashboard = 今日決策摘要
Full Report = 當日研究底稿
Archive = 歷史回查
```

---

## Required Navigation

Top navigation:

```html
<a class="btn primary" href="../../../index.html">← 回 Dashboard</a>
<a class="btn" href="../../../archive.html">歷史報告</a>
<a class="btn" href="PREVIOUS_DAY-full.html">上一日報告</a>
```

Bottom navigation:

```html
<a class="btn primary" href="../../../index.html">← 回 Dashboard</a>
<a class="btn" href="../../../archive.html">歷史報告</a>
<a class="btn" href="#top">回到頁首</a>
```

---

## Required Hero

Hero must include:

- Report title
- Date
- Report ID
- Market session
- Today action
- Top watchlist
- Highest risk group
- dataQuality.status
- market-data ingestion summary
- Disclaimer: research note only, not personalized investment advice

---

## Required Sections

The following ten sections are mandatory and must keep their section names.

---

## 一、今日總結

Must answer:

- 今日 M7 是全面轉強、全面轉弱、還是分化？
- 今日建議動作是什麼？
- 今日最大的市場矛盾是什麼？
- 今日是否觸發 Kill Switch？
- 今日不動作或暫停追價的主要理由是什麼？

Must include one clear conclusion paragraph.

---

## 二、M7 主決策表

Must include all seven names:

```text
GOOGL
NVDA
MSFT
META
AMZN
AAPL
TSLA
```

Required columns:

- Rank
- Ticker
- Score
- Score Band
- Rating
- New Capital Stance
- Risk Light
- Red Streak Days
- Key Observation
- Price / Technical Data Availability

Do not invent missing OHLCV.

---

## 三、Market-data ingestion 結果

Must include:

- dataQuality.status
- market data file path
- attempted true / false
- completeOhlcv true / false
- degraded true / false
- what was successfully obtained
- what remains missing
- explicit statement that missing OHLCV is not fabricated

If full data is available, explain that the Dashboard is complete market-data version.

If partial data is available, explain that the Dashboard is partial market-data version.

If only news summary is available, explain that the Dashboard is news-summary version.

---

## 四、現金流與 AI Capex 檢查

Must distinguish:

- AI Capex beneficiaries
- AI Capex spenders
- product-cycle pressure names
- event-narrative names

Must discuss:

- AI Capex
- FCF
- Revenue / ROI evidence
- Whether market is questioning payback period
- Which names are most exposed to FCF pressure

---

## 五、市場與新聞摘要

Must include clickable source links.

Required format:

```html
<a href="SOURCE_URL" target="_blank" rel="noopener">Source Title</a>
```

Must separate:

- Market close summary
- Semiconductor / AI supply chain news
- Platform mega-cap pressure
- Company-specific events
- Rate / macro background if relevant

Do not quote long copyrighted text.

---

## 六、七檔個股分析

This section must not be replaced by a short grouping summary.

For each ticker, include:

- Facts
- Interpretation
- Risk
- Action / Observation condition
- Score rationale
- New capital stance

Required subsections:

```text
GOOGL
NVDA
MSFT
META
AMZN
AAPL
TSLA
```

Each ticker must have enough content to explain why its rank and score changed or stayed the same.

---

## 七、前瞻性壓力測試

Must answer scenario-based questions.

At minimum include:

- What if AI Capex continues rising but revenue does not accelerate?
- What if hyperscalers guide Capex lower?
- What if semiconductor supply chain stays strong but platform stocks stay weak?
- What if red lights spread to four or more M7 names?
- What would change the next action from wait to add / reduce?

This section is external market scenario testing.

---

## 八、反身性檢查

Must be based on the current day's M7 conflict signals.

Required current structure:

```text
八、反身性檢查：我是不是把所有 AI 股票混成同一個故事？
```

If the day's market conflict is different, the exact question may change, but the section title must still start with:

```text
八、反身性檢查：
```

Must include:

- 今日虛擬角色
- 今日自問
- 回答
- 今日需要人工追蹤的一個關鍵驗證點

This section is internal investor self-correction, not another market scenario analysis.

---

## 九、今日總排序與最終結論

Must include:

- Dashboard Action Score ranking
- New capital priority ranking
- Highest risk ranking
- Final action table
- Final one-paragraph conclusion

Must restate whether the action is:

- add
- wait
- pause adding
- reduce
- no action

---

## 十、資料來源與限制

Must include:

- clickable news / data source links
- market data file link
- data limitation note
- explicit statement that missing OHLCV was not fabricated
- disclaimer

Required link safety:

```html
target="_blank" rel="noopener"
```

---

## Forbidden Report Failures

The report is invalid if any of the following happens:

- The report becomes a dashboard summary page.
- Section names are changed or deleted.
- Seven-stock analysis is replaced by one short grouping paragraph.
- dataQuality.status is missing.
- market-data ingestion result is missing.
- source links are not clickable.
- missing OHLCV is fabricated.
- report lacks top / bottom navigation.
- report includes pre-run wording in a formal version.
- report contains old data from a previous rerun.

---

## Minimum Content Standard

A valid Full Report must be long enough to support the Dashboard decision.

Guideline:

- Every required section must contain meaningful daily content.
- Seven-stock analysis must not be compressed into fewer than seven ticker-specific blocks.
- Market-data ingestion result must be explicit.
- Reflexive check must be tied to the day's actual M7 contradiction.

---

## Daily Fill Variables

The task should fill:

```text
{{date}}
{{reportId}}
{{marketSession}}
{{generatedAt}}
{{dataQualityStatus}}
{{marketDataFile}}
{{marketDataSummary}}
{{headline}}
{{oneLineConclusion}}
{{recommendedAction}}
{{riskLights}}
{{rankingTable}}
{{tickerAnalyses}}
{{pressureTest}}
{{reflexiveQuestion}}
{{sourceLinks}}
```
