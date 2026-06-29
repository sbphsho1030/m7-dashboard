# M7 Dashboard v1.3 Manual Daily Update Guide

This guide is for manual or GPT-assisted daily updates. The static website should keep working without backend services, market crawlers, schedules, or build tools.

## Source Of Truth

Use `docs/context/` for rollup, readback, and memory-chain state. Use `docs/data/` for website display, Archive, latest, and daily payloads.

Authoritative readback and rollup files:

- `docs/context/active/previous-daily.json` is the only previous daily readback source.
- `docs/context/staging/current-week.json` is the only weekly staging source.
- Future weekly / monthly / quarterly / halfyear / yearly rollups must read from `docs/context/`.

Display files:

- `docs/data/daily/YYYY-MM-DD/dashboard.json` is the website display daily Dashboard payload.
- `docs/data/daily/YYYY-MM-DD/full-report.json` is the website display Full Report payload.
- `docs/data/previous-daily.json` and `docs/data/current-week.json`, if present, are legacy / display mirrors only. Do not use them as rollup or readback sources.

Prompt rule:

- Do not read both `docs/data/previous-daily.json` and `docs/context/active/previous-daily.json`.
- Do not read both `docs/data/current-week.json` and `docs/context/staging/current-week.json`.

## 1. Create the Daily Folder

For a market date such as `2026-06-28`, create:

- `docs/data/daily/2026-06-28/dashboard.json`
- `docs/data/daily/2026-06-28/full-report.json`

If there is no full report for that day, skip `full-report.json` and omit `fullReportJson` from the manifests.

## 2. Add dashboard.json

Create a dashboard payload that follows `docs/data-contract.md`.

Required reminders:

- Use `schemaVersion: "m7-dashboard-v1.3"`.
- Use `dataStatus: "manual"` for a real manually supplied update, or `sample` for test data.
- Include exactly three Top3 items.
- Every Top3 item must include `evidenceProfile`.
- Filter raw observations before selecting Top3:
  - Green items may become Top3 candidates.
  - Yellow items may remain in the observation pool, but should not enter Dashboard Top3 by default.
  - Red items must not enter Dashboard.
- Use persistence, thesisImpact, evidenceProfile, evidence strength, freshness, contradiction risk, and concrete watchSignals to prevent daily seven-stock noise from entering Dashboard.
- Do not include investment advice.

## 3. Add full-report.json

Create a full report payload when a report exists.

Required reminders:

- Use `schemaVersion: "m7-full-report-v1.3"`.
- Set `notForReadback: true`.
- Keep the report as a permanent display artifact.
- Do not use the Full Report as future rollup memory.
- Generate sections dynamically only for the day's Top3 or important extension topics.
- Keep it short when there is little to add.
- Do not create empty or filler sections to preserve a fixed format.

## 3a. Add What Changed

What Changed must be anchored only to structured Top3 JSON:

- Compare today's `docs/data/daily/YYYY-MM-DD/dashboard.json` Top3.
- Compare against `docs/context/active/previous-daily.json`.
- Do not read Full Report.
- Do not infer from long-form history.

Use these change categories when applicable:

- new topic
- continuing topic
- downgraded topic
- disappeared topic
- thesisImpact changed
- actionBias changed
- evidenceProfile changed

## 4. Update latest.json

Update `docs/data/latest.json` so the newest date opens by default:

```json
{
  "schemaVersion": "m7-latest-v1.3",
  "dataStatus": "manual",
  "date": "2026-06-28",
  "title": "M7 Dashboard - 2026-06-28",
  "dashboardJson": "data/daily/2026-06-28/dashboard.json",
  "fullReportJson": "data/daily/2026-06-28/full-report.json",
  "notes": "Manual daily update."
}
```

## 5. Update calendar-manifest.json

Add the date to `docs/data/calendar-manifest.json`.

Checklist:

- Add the month to `availableMonths` if it is new.
- Keep `defaultMonth` aligned with the newest date if desired.
- Add one item for the new date.
- Include `fullReportJson` only when the full report exists.

## 6. Update compatibility calendar files

The current shell still keeps month files for compatibility:

- `docs/data/calendar/index.json`
- `docs/data/calendar/YYYY-MM.json`

Update them with the same date and paths used in `calendar-manifest.json`.

## 7. Update previous/current-week/rolling-context

Update `docs/data/previous-daily.json`:

- Treat it as a legacy / display mirror only if it is still maintained.
- Do not use it as the previous daily readback source.

Update `docs/context/active/previous-daily.json`:

- Replace it with the new day Top3.
- Set `marketDate` to the new date.
- Set `sourceDashboard` to the new `dashboard.json`.

Update `docs/data/current-week.json`:

- Treat it as a legacy / display mirror only if it is still maintained.
- Do not use it as weekly staging.

Update `docs/context/staging/current-week.json`:

- Append the new daily Top3 under `dailyTop3`.
- Keep `status: "collecting"` until a weekly rollup is intentionally created.

Update `docs/data/rolling-context.json`:

- Point `previousDaily.path` to `context/active/previous-daily.json`.
- Point `currentWeek.path` to `context/staging/current-week.json`.
- Update `lastProcessedMarketDate`.
- Keep missing rollup outputs as `null`.

When the daily Dashboard Top3 changes, update these files together:

- `docs/data/daily/YYYY-MM-DD/dashboard.json`
- `docs/context/active/previous-daily.json`
- `docs/context/staging/current-week.json`

## 8. Local Test

Start a static server from `docs/` and open:

- `http://localhost:8000`
- `http://localhost:8000/data/latest.json`
- `http://localhost:8000/data/calendar-manifest.json`

Confirm:

- The latest date opens by default.
- Archive enables only dates that have entries.
- Dashboard renders from `dashboard.json`.
- Full Report renders from `full-report.json`.
- Full Report button is disabled when `fullReportJson` is missing.

## 錯誤資料回復 / Rollback

Before each daily update, check the git state so the current staged and unstaged changes are clear. Keep the rollback focused on data files only unless the user explicitly asks to change the website framework.

If the day's `dashboard.json` is wrong:

- Edit `docs/data/daily/YYYY-MM-DD/dashboard.json` in place.
- Keep `schemaVersion`, `dataStatus`, `date`, `title`, `summary`, and `top3` intact.
- Re-check that every Top3 item still includes the full Top3 schema and `evidenceProfile`.
- If the corrected dashboard changes the final Top3, update `docs/context/active/previous-daily.json` and the matching entry in `docs/context/staging/current-week.json`.
- Update `docs/data/previous-daily.json` and `docs/data/current-week.json` only as legacy / display mirrors if those mirrors are still maintained.

If `latest.json` points to the wrong date:

- Restore `docs/data/latest.json` to the intended latest valid date.
- Confirm `dashboardJson` points to an existing `dashboard.json`.
- Include `fullReportJson` only when the matching full report exists.
- Open `http://localhost:8000/data/latest.json` and confirm it returns the corrected date.

If `calendar-manifest.json` lists a date but the daily JSON does not exist:

- Either create the missing `docs/data/daily/YYYY-MM-DD/dashboard.json`, or remove that date from `items`.
- If the removed date was the only date in its month, remove that month from `availableMonths` unless another calendar compatibility file still needs it.
- Keep `docs/data/calendar/YYYY-MM.json` aligned with the same date list.

If a dashboard exists but the full report is missing:

- Omit `fullReportJson` from `latest.json`, `calendar-manifest.json`, and the compatibility month manifest for that date.
- Do not leave `fullReportJson` pointing to a missing file.
- Confirm the Full Report button is disabled for that date.

If `previous-daily.json` was overwritten incorrectly:

- Restore `docs/context/active/previous-daily.json` from the intended previous valid Top3 source.
- Set `marketDate` to the restored date.
- Set `sourceDashboard` to the restored dashboard path.
- Confirm the `top3` array matches the restored dashboard Top3.
- If `docs/data/previous-daily.json` exists, update it only as a legacy / display mirror.

If `current-week.json` was appended incorrectly:

- Remove only the incorrect `dailyTop3` entry from `docs/context/staging/current-week.json`.
- If the date should remain in the week, replace that entry with the corrected Top3 from the valid dashboard.
- Keep `weekId`, `status`, and the existing valid daily entries unchanged.
- If `docs/data/current-week.json` exists, update it only as a legacy / display mirror.

If `rolling-context.json` points to the wrong files or dates:

- Restore `previousDaily.path` to `context/active/previous-daily.json`.
- Restore `currentWeek.path` to `context/staging/current-week.json`.
- Correct `lastProcessedMarketDate` to the latest valid processed date.
- Keep missing rollup outputs as `null` until the corresponding rollup is intentionally created.

After rollback, manually test:

- Open `http://localhost:8000`.
- Confirm the intended latest date loads.
- Confirm Archive enables only dates with existing dashboard JSON.
- Confirm Dashboard renders for the restored date.
- Confirm Full Report renders only when `fullReportJson` exists.
- Open `http://localhost:8000/data/latest.json`.
- Open `http://localhost:8000/data/calendar-manifest.json`.
- Check the browser console for red errors.

## Do Not Do During Daily Updates

- Do not fetch market data automatically.
- Do not create schedules.
- Do not add a backend, database, Node build system, or external framework.
- Do not change GitHub Pages settings.
- Do not modify `docs/index.html`, `docs/assets/app.js`, or `docs/assets/style.css` unless the user explicitly asks for a website framework change.
