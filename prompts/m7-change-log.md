# M7 Product Change Log

Project: m7-dashboard
Purpose: Preserve old rules while adding new requirements.

---

## Change Log Rule

Every product rule change, page behavior change, full report format change, data schema change, workflow change, or validation rule change must be recorded here.

A new rule extends existing rules unless the entry explicitly says an older rule is retired.

Required format:

```text
## YYYY-MM-DD - Change title

Type: Dashboard / Full Report / Archive / Data / Workflow / Validation / Governance
Status: Active / Retired / Superseded

New requirement:
- ...

Old rules preserved:
- ...

Rules retired:
- None, unless explicitly listed.

Files affected:
- ...

Validation required:
- ...
```

---

## 2026-06-27 - Product governance files added

Type: Governance / Validation
Status: Active

New requirement:
- Add `prompts/m7-product-rules.md` as the permanent product-rule source.
- Add `prompts/m7-change-log.md` as the versioned rule-change history.
- Add `scripts/validate-layout.js` as the layout validation gate.
- Every daily update, test update, page redesign, feature change, or repo delivery must read these files before producing planned changes.

Old rules preserved:
- `index.html` remains the Dashboard home page.
- `index.html` must not be changed into an iframe shell.
- `reports/YYYY/MM/DD-full.html` remains the daily Full Report.
- `archive.html` remains the history page.
- Full Report must follow `prompts/m7-full-report-template.md`.
- Full Report must preserve ten required sections.
- Full Report must include seven ticker-specific analyses.
- Missing OHLCV must not be fabricated.
- Test records must not be promoted as formal archive records.

Rules retired:
- None.

Files affected:
- `prompts/m7-product-rules.md`
- `prompts/m7-change-log.md`
- `scripts/validate-layout.js`

Validation required:
- Run `node scripts/validate-layout.js` before declaring any formal dashboard/full-report update complete.
- For feature changes, run the same validation after the planned changes are applied.

---

## 2026-06-27 - Full Report navigation rule clarified

Type: Full Report / Validation
Status: Active

New requirement:
- Every formal Full Report must include top navigation with:
  - `← 回 Dashboard`
  - `歷史報告`
  - `上一日報告`
- Every formal Full Report must include bottom navigation with:
  - `← 回 Dashboard`
  - `歷史報告`
  - `回到頁首`

Old rules preserved:
- Full Report remains the research brief, not the Dashboard.
- Dashboard remains `index.html`.
- Archive remains `archive.html`.
- Full Report must retain ten required sections.

Rules retired:
- None.

Files affected:
- Formal reports under `reports/YYYY/MM/DD-full.html`.
- `scripts/validate-layout.js` must check these links.

Validation required:
- Validate that top navigation appears near the report header.
- Validate that bottom navigation appears near the end of the report.

---

## 2026-06-27 - Dashboard iframe prohibition clarified

Type: Dashboard / Validation
Status: Active

New requirement:
- `index.html` must never be converted into a wrapper page that only iframes a Full Report.
- If the Dashboard links to a Full Report, it must do so through a normal link/button such as `fullReportLink`.

Old rules preserved:
- `index.html` is the Dashboard / Decision Control page.
- Dashboard may read `data/latest.json` and `data/recent.json`.
- Full Report content belongs under `reports/YYYY/MM/DD-full.html`.

Rules retired:
- None.

Files affected:
- `index.html`
- `scripts/validate-layout.js`

Validation required:
- `index.html` must not contain `<iframe`.
- `index.html` title must contain `M7 Decision Control Dashboard`.

---

## 2026-06-27 - Test update isolation rule clarified

Type: Data / Archive / Workflow
Status: Active

New requirement:
- Test reports and experimental full-page reports must not be inserted into `data/history-index.json` as formal daily reports.
- Test updates may generate local artifacts and planned changes, but must stop before repo delivery unless the user confirms.

Old rules preserved:
- Formal daily reports may update `data/latest.json`, `data/history-index.json`, monthly history, recent data, and market data.
- Archive should show formal historical reports, not unapproved test artifacts.

Rules retired:
- None.

Files affected:
- `data/history-index.json`
- `data/latest.json`
- `reports/YYYY/MM/DD-full.html`

Validation required:
- Check that archive records do not contain obvious test-only report IDs unless the user explicitly approved publishing a test record.
