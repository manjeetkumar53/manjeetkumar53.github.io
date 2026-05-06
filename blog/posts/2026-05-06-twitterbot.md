---
title: "TwitterBot: Daily Social Intelligence for X (Twitter)"
date: "2026-05-06T11:57:00+02:00"
author: "Manjeet Kumar"
category: "Social Listening"
tags: ["Social Listening", "Playwright", "Sentiment", "Python"]
excerpt: "A practical toolkit to crawl, analyze, and report daily social signals from X. Use API-first crawling, rule-based sentiment, and persisted reports for trend analysis."
image: ""
featured: false
draft: false
---

## Simple intro: what this repo is and why it matters

Want a reliable way to know what people are saying about a topic on X? TwitterBot is a focused social listening toolkit that crawls tweets, scores sentiment, extracts trends, and writes daily reports you can review or store for trend analysis.

It prioritizes evidence, not engagement: the tool is built to analyze and report, not to perform mass automation.

Who should read this:

- Community and growth teams tracking topic sentiment and trends
- SRE and ops teams monitoring operational signals mentioned on social channels
- Researchers and analysts who need reproducible daily reports across topics

Quick problem and solution summary

| Problem | How this repo helps |
|---|---|
| One-off scraping scripts are brittle | Official X API first, browser fallback for manual research, and offline mode for deterministic runs |
| Hard to track trends over time | Daily reports persisted in SQLite and a history command for comparisons |
| No context on which tweets drove metrics | Reports include tweet-level sentiment records and top hashtags/mentions |
| Silent changes in conversation | Watchlists and scheduled runs capture daily changes for audit and review |

## What the system does at a glance

CLI -> crawler source (api | browser | file) -> sentiment analyzer -> trend extractor -> report writers (markdown, html, json) -> SQLite history

Core capabilities

- Playwright login helper for manual authenticated sessions
- Official X API recent search crawler for production use
- Browser fallback crawler using Playwright for research workflows
- Rule-based sentiment analyzer for transparent, testable scoring
- Trend extraction for top terms, hashtags, and mentions
- Report writers that output Markdown, HTML, and JSON
- SQLite persistence of report runs and tweet-level records
- Watchlist CLI for running multiple topics in batch

## Quick start: run locally

```bash
git clone https://github.com/manjeetkumar53/TwitterBot.git
cd TwitterBot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install firefox
```

Offline example using sample data

```bash
python app.py daily \
  --query "#AI" \
  --source file \
  --input data/sample_tweets.json \
  --markdown reports/ai-daily.md \
  --html reports/ai-daily.html \
  --json reports/ai-daily.json
```

Open `reports/ai-daily.md` or `reports/ai-daily.html` to review the generated report. The SQLite file `data/twitterbot.sqlite3` stores historical runs.

## Common CLI workflows

- `python app.py login` to start an authenticated browser session for research
- `python app.py crawl --source api --query "agentic AI" --limit 50` to fetch recent tweets via the official X API
- `python app.py crawl --source browser --query "agentic AI" --limit 30 --headless` to use the Playwright fallback
- `python app.py report --input output/tweets.json --markdown reports/agentic-ai.md` to render reports from fetched tweets
- `python app.py watchlist --config config/watchlist.json --reports-dir reports` to run batch topics

## Report contents and data model

Each report includes timestamp, query, total tweets analyzed, sentiment distribution, average sentiment, dominant sentiment, top terms, hashtags, mentions, and a tweet-level table. Tweet payloads follow a simple JSON model with `id`, `author`, `created_at`, `text`, `url`, and `metrics`.

SQLite tables

- `report_runs` - One row per report with summary metrics
- `report_tweets` - Tweet-level sentiment records for each run

## Where to look in the code

- `x_daily_reporter/crawlers.py` - API, browser, and file crawler implementations
- `x_daily_reporter/auth.py` - Playwright login helper and browser session management
- `x_daily_reporter/analyzer.py` - Rule-based sentiment scoring and term extraction
- `x_daily_reporter/reporter.py` - Markdown, HTML, and JSON report writers
- `x_daily_reporter/storage.py` - SQLite persistence and history queries
- `app.py` - CLI entrypoint and pipeline orchestration

## Responsible use and limitations

- Prefer the official X API for production crawling. Browser automation is only for manual research and requires careful use.
- Do not use this project for spam, mass engagement, credential abuse, platform-limit evasion, or automated interactions that violate platform policies.
- The sentiment analyzer is rule-based and deterministic; consider adding an LLM-backed classifier behind the same analyzer contract if you need more nuance.

## Production hardening and next steps

- Schedule daily runs with GitHub Actions or cron
- Add optional LLM sentiment classifier behind the same analyzer contract
- Add topic clustering and named entity extraction for richer insights
- Add a dashboard for trend history and interactive exploration
- Add Slack or email delivery for daily reports
- Add Postgres storage for team-scale persistence

## Final thought

TwitterBot is a practical, API-first social listening toolkit that focuses on analysis and evidence retention instead of automation. It is a good starting point for teams that want reproducible daily intelligence from social platforms and a testable, local-first pipeline to iterate on.

Source: https://github.com/manjeetkumar53/TwitterBot
