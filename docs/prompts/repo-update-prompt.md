# Repo Update Prompt

Use this prompt after GPT or a human has prepared one dated M7 Dashboard data package. Update the repo only; do not fetch market data and do not generate investment advice.

## Source Of Truth

`docs/context/` is the only source for rollup, readback, and the memory chain.

`docs/data/` is the source for website display, Archive, latest, and daily payloads.

Rules:

1. Read previous daily only from `docs/context/active/previous-daily.json`.
2. Read weekly staging only from `docs/context/staging/current-week.json`.
3. Future weekly / monthly / quarterly / halfyear / yearly rollups must use `docs/context/`.
4. Treat `docs/data/previous-daily.json` and `docs/data/current-week.json` as legacy / display mirrors only if they exist.
5. Do not read both `docs/data/previous-daily.json` and `docs/context/active/previous-daily.json`.
6. Do not read both `docs/data/current-week.json` and `docs/context/staging/current-week.json`.

## Scope

1. Confirm the target branch before editing.
2. Do not change the website framework unless explicitly requested.
3. Do not modify GitHub Pages settings.
4. Do not create schedules, backend services, databases, Node build systems, or external framework dependencies.

## Inputs Expected

The user should provide:

1. Market date: `YYYY-MM-DD`
2. Dashboard JSON content following `docs/data-contract.md`
3. Optional Full Report JSON content following `docs/data-contract.md`
4. Updated Top3 context, or permission to derive `docs/context/active/previous-daily.json` and `docs/context/staging/current-week.json` from the supplied dashboard JSON

## Files To Add Or Update

1. Add `docs/data/daily/YYYY-MM-DD/dashboard.json`.
2. Add `docs/data/daily/YYYY-MM-DD/full-report.json` only if supplied.
3. Update `docs/data/latest.json`.
4. Update `docs/data/calendar-manifest.json`.
5. Update `docs/data/calendar/index.json` if a new month is added.
6. Update `docs/data/calendar/YYYY-MM.json`.
7. Update `docs/context/active/previous-daily.json`.
8. Update `docs/context/staging/current-week.json`.
9. Update `docs/data/rolling-context.json`.
10. Update `docs/data/previous-daily.json` and `docs/data/current-week.json` only if legacy / display mirrors are intentionally kept.

## Required Checks

1. Every sample file must say `dataStatus: "sample"`; real manual files should say `dataStatus: "manual"`.
2. Every Top3 item must include `topic`, `summary`, `companies`, `theme`, `type`, `persistence`, `thesisImpact`, `actionBias`, `direction`, `horizon`, `watchSignals`, `confidence`, and `evidenceProfile`.
3. Every `evidenceProfile` must include `sourceItemCount`, `recurrence`, `whySelected`, and `whatChanged`.
4. Full Report must set `notForReadback: true`.
5. All fetch paths must be site-root relative and must not start with `/`.
6. Do not hard-code the repo name into data paths.
7. If Dashboard Top3 changes, keep `docs/data/daily/YYYY-MM-DD/dashboard.json`, `docs/context/active/previous-daily.json`, and `docs/context/staging/current-week.json` synchronized.
8. Full Report is permanent display content only and must not be used for rollup readback.

## Final Response

Report:

1. Files added.
2. Files modified.
3. How to test locally.
4. Which files are sample or manual data.
