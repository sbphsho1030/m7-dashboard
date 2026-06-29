# Daily Draft Prompt

Use this prompt only after the static v1.3 shell is approved for real daily operation.

Create a daily M7 Dashboard draft using the v1.5 rules:

1. Read `docs/context/active/previous-daily.json`.
2. Do not read `docs/data/previous-daily.json` for readback.
3. Filter raw observations through the Dashboard signal rules before selecting Top3:
   - Green may enter Top3 candidates.
   - Yellow may enter the observation pool but should not enter Dashboard Top3 by default.
   - Red must not enter Dashboard.
4. Produce at most three Daily Top3 items with the required schema fields.
5. Include `evidenceProfile` with the existing fields and, when available, `sourceType`, `evidenceStrength`, `freshness`, and `contradictionRisk`.
6. Produce What Changed only by comparing today's dashboard Top3 against `docs/context/active/previous-daily.json`; do not read prior Full Reports or infer from long-form history.
7. Write the daily Dashboard JSON as `docs/data/daily/YYYY-MM-DD/dashboard.json`.
8. Write optional Full Report JSON as `docs/data/daily/YYYY-MM-DD/full-report.json` only when Top3 or important extension topics need narrative detail.
9. Keep Full Report dynamic, concise when appropriate, and set `notForReadback: true`.
10. Update `docs/data/latest.json` and the matching calendar manifest.
11. Update `docs/context/active/previous-daily.json`.
12. Append the daily Top3 only to `docs/context/staging/current-week.json`.
13. Do not read or write `docs/data/current-week.json` as weekly staging; if it is maintained, treat it only as a legacy / display mirror.
14. Do not modify `docs/index.html`, `docs/assets/app.js`, or `docs/assets/style.css` unless the user explicitly asks to change the website framework.

This repository shell does not fetch market data by itself. Any real inputs must be supplied explicitly by the user or a later approved workflow.
