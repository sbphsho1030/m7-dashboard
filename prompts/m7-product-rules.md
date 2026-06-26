# M7 Dashboard Product Rules

Version: M7-ProductRules-v1.0
Last Updated: 2026-06-27
Project: m7-dashboard

---

## 0. Core Principle

This repository is a maintained product, not a one-off generated HTML page.

Every daily update, test update, page change, feature addition, or repo delivery must preserve existing product rules unless the user explicitly says a specific old rule is retired.

```text
New requirements must extend old rules.
New requirements must not silently replace old rules.
Generation ability must never override product structure.
```

---

## 1. Required Reading Before Any M7 Task

Before any daily update, test update, page change, feature addition, or repo write, the assistant must read these files first:

```text
prompts/m7-product-rules.md
prompts/m7-change-log.md
prompts/m7-full-report-template.md
index.html
latest formal full report under reports/YYYY/MM/DD-full.html
data/latest.json
data/history-index.json
```

If any required file is missing, the assistant must report it before changing the repo.

---

## 2. Product Layering

The project has three distinct product layers:

```text
Dashboard = 今日決策摘要
Full Report = 當日研究底稿
Archive = 歷史回查
```

### 2.1 Dashboard

`index.html` is the Dashboard home page.

Rules:

- `index.html` must remain the Dashboard / Decision Control page.
- `index.html` must not be replaced by a full report.
- `index.html` must not be changed into an iframe shell.
- `index.html` should normally read `data/latest.json` and `data/recent.json`.
- Dashboard should show the latest decision summary, action score, risk lights, event watch, ranking, data quality, and full report link.
- Any Dashboard change must preserve the existing visual style unless the user explicitly approves a redesign.

### 2.2 Full Report

`reports/YYYY/MM/DD-full.html` is the daily research brief behind the Dashboard.

Rules:

- Full Report must follow `prompts/m7-full-report-template.md`.
- Full Report must preserve the required ten sections.
- Full Report must not be compressed into a dashboard summary.
- Full Report must include all seven M7 ticker-specific analyses.
- Full Report must include data-quality and market-data ingestion status.
- Full Report must include source links.
- Full Report must not fabricate missing OHLCV.

### 2.3 Archive

`archive.html` is the history navigation page.

Rules:

- `archive.html` must remain the history list page.
- `archive.html` should read `data/history-index.json`.
- Test records must not be inserted into archive as formal daily reports.
- Archive index may add official daily reports only after the report passes layout and data-quality validation.

---

## 3. Mandatory Full Report Navigation

Every formal `reports/YYYY/MM/DD-full.html` must include top and bottom navigation.

Top navigation must include:

```html
<a class="btn primary" href="../../../index.html">← 回 Dashboard</a>
<a class="btn" href="../../../archive.html">歷史報告</a>
<a class="btn" href="PREVIOUS_DAY-full.html">上一日報告</a>
```

Bottom navigation must include:

```html
<a class="btn primary" href="../../../index.html">← 回 Dashboard</a>
<a class="btn" href="../../../archive.html">歷史報告</a>
<a class="btn" href="#top">回到頁首</a>
```

If a report is the first available report and there is no previous report, the assistant must either omit the previous-day link with an explanation or link to archive.

---

## 4. Mandatory Full Report Sections

Every formal Full Report must include these ten sections in order, using these names:

```text
一、今日總結
二、M7 主決策表
三、Market-data ingestion 結果
四、現金流與 AI Capex 檢查
五、市場與新聞摘要
六、七檔個股分析
七、前瞻性壓力測試
八、反身性檢查
九、今日總排序與最終結論
十、資料來源與限制
```

The report is invalid if any section is missing, renamed in a way that loses meaning, or replaced by a short summary.

---

## 5. Required Ticker Coverage

Every formal Full Report must include ticker-specific discussion for:

```text
GOOGL
NVDA
MSFT
META
AMZN
AAPL
TSLA
```

A valid report must not replace seven ticker analyses with a single grouping paragraph.

---

## 6. Data Integrity Rules

- Data time must be explicit.
- Data source must be explicit.
- Data limitations must be explicit.
- Intraday data must not be labeled as official close.
- Missing OHLCV must not be fabricated.
- Missing data should be represented as `null`, `N/A`, or clearly marked as unavailable.
- If market data is partial, `dataQuality.status` must say so.

Recommended statuses:

```text
formal_full_market_data
formal_partial_market_data
verified_intraday
news_summary_only
repo_format_test
```

---

## 7. Test Update Rules

A test update is not a formal daily report.

Test update rules:

- May generate a local HTML artifact.
- May list planned repo changes.
- Must not update `data/latest.json` as the formal latest report unless user approves.
- Must not add test records to `data/history-index.json` as formal reports.
- Must not overwrite `index.html`.
- Must ask the user before repo delivery.

---

## 8. Formal Daily Update Rules

A formal daily update may update:

```text
reports/YYYY/MM/DD-full.html
data/latest.json
data/history-index.json
data/history/YYYY-MM.json
data/recent.json
data/market/YYYY-MM-DD.json
```

A formal daily update should normally avoid changing:

```text
index.html
archive.html
prompts/*
scripts/*
```

unless the user explicitly asks for product or workflow changes.

---

## 9. Page / Feature Change Rules

When the user asks to change a page or add a feature, the assistant must first produce an impact analysis before modifying the repo.

Impact analysis must include:

```text
1. Change type: Dashboard / Full Report / Archive / Data / Workflow / Validation
2. Existing rules affected
3. Existing rules preserved
4. New rules to add, if any
5. Planned file changes
6. Validation gate to run
```

No repo write should happen before this impact analysis is presented, unless the user has already explicitly approved the described change.

---

## 10. Planned Changes Gate

Before any repo write, the assistant must list:

```text
1. Files to add
2. Files to modify
3. Files to delete
4. Whether index.html changes
5. Whether archive.html changes
6. Whether any formal data JSON changes
7. Whether the change is test-only or formal
8. Validation that must pass after write
```

---

## 11. Validation Gate

Before telling the user a repo update is complete, run or mentally verify the same checks implemented in:

```text
scripts/validate-layout.js
```

Required checks:

- `index.html` exists.
- `index.html` title includes `M7 Decision Control Dashboard`.
- `index.html` must not contain `<iframe`.
- Latest formal Full Report exists.
- Full Report top navigation exists.
- Full Report bottom navigation exists.
- Full Report includes all ten required sections.
- Full Report includes all seven M7 tickers.
- Full Report source links use `target="_blank" rel="noopener"`.
- Full Report states that missing OHLCV is not fabricated.
- `data/history-index.json` does not accidentally promote test records as formal reports.

---

## 12. User Confirmation Rule

If a task produces new daily content or test content, the assistant must stop before repo delivery and ask:

```text
是否要將這份 dashboard / full report 送出 repo？
```

If the user explicitly asks to add or fix repo governance files, validation scripts, or product rules, the assistant may commit those requested governance changes directly and report what changed.
