# Daily Draft Prompt

Use this prompt only after the static v1.3 shell is approved for real daily operation.

Create a daily M7 Dashboard draft using the v1.3 rules:

1. Read `docs/context/active/previous-daily.json`.
2. Produce the new daily Top3 with the required schema fields.
3. Write the daily Dashboard HTML and optional Full Report HTML as permanent dated files.
4. Update `docs/data/latest.json` and the matching calendar month manifest.
5. Append the daily Top3 only to `docs/context/staging/current-week.json`.
6. Do not read prior Full Reports.
7. Do not modify `docs/index.html`, `docs/assets/app.js`, or `docs/assets/style.css` unless the user explicitly asks to change the website framework.

This repository shell does not fetch market data by itself. Any real inputs must be supplied explicitly by the user or a later approved workflow.
