---
title: "LLM Routing Engine: Smart Model Selection for Cost and Quality"
date: "2026-05-06T11:40:00+02:00"
author: "Manjeet Kumar"
category: "Enterprise AI"
tags: ["Model Routing", "Cost Optimization", "Observability", "Python", "FastAPI"]
excerpt: "Policy-driven routing that sends simple prompts to cheaper models and escalates complex prompts to premium models, while tracking cost, quality proxies, and telemetry."
image: ""
featured: true
draft: false
---

## Simple intro: what this repo is and why it matters

Do all prompts deserve the same expensive model? In most applications, no. Many requests can be handled by cheaper models with equivalent user satisfaction, while only a minority need premium models for higher quality.

LLM Routing Engine is an API-first service that scores prompt complexity, applies routing policy, calls a provider tier, and records telemetry for cost, latency, tokens, routing reasons, and quality proxy signals.

Who should read this:

- Platform engineers looking to cut inference cost with predictable quality
- ML engineers running experiments on routing policies and tier mixes
- Engineering managers who need telemetry and auditability for model spend

Quick problem/solution summary

| Problem | How this repo helps |
|---|---|
| Flat model choice inflates costs | Route simple prompts to cheaper models and escalate only when needed |
| Hard to reason about routing decisions | Rule-based complexity scoring with explicit reason codes for every decision |
| No budget or telemetry | SQLite-backed telemetry, cost math, and Streamlit dashboard for analysis |
| Provider lock-in and brittle SDKs | Provider contract that supports mock, Ollama, OpenAI, and Anthropic modes |

## What it does at a glance

Client -> complexity scorer -> routing policy -> provider contract -> retry + circuit breaker -> fallback -> telemetry and quality proxy -> response with routing details

Key capabilities:

- Complexity scoring with reason codes
- Cheap and premium model tiers selected by policy thresholds
- Experiment modes: router_v1, always_cheap, always_premium
- Reliability guards: retry, circuit breaker, and fallback from cheap to premium
- Telemetry: token usage, latency, estimated cost, and experiment labels
- Evaluation: benchmark for routing accuracy and cost comparison
- Provider abstraction: mock, ollama, openai, anthropic

## How to run locally

```bash
git clone https://github.com/manjeetkumar53/llm-routing-engine.git
cd llm-routing-engine
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open API docs at `http://127.0.0.1:8000/docs` and health at `http://127.0.0.1:8000/health`.

## Core API workflow with examples

Route a prompt and receive routing metadata and a completion:

```bash
curl -s -X POST http://127.0.0.1:8000/v1/route/infer \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Design a scalable event-driven microservice architecture for a fintech platform."}'
```

Typical response fields include `request_id`, `route.selected_tier`, `complexity_score`, `reason_codes`, `usage`, `latency_ms`, `estimated_cost_usd`, and `quality`.

Example response JSON:

```json
{
  "request_id": "3f8a2c14-91e7-4b2d-bc43-7a1d9e204f88",
  "route": {
    "selected_tier": "premium",
    "complexity_score": 0.725,
    "reason_codes": ["complexity_hints_present", "threshold=0.5"]
  },
  "usage": {"input_tokens": 24, "output_tokens": 187},
  "latency_ms": 312.5,
  "estimated_cost_usd": 0.00003125,
  "fallback_used": false,
  "experiment_mode": "router_v1",
  "quality": {"total": 0.927, "acceptable": true}
}
```

## Complexity scoring and reason codes

The router uses a rule-based heuristic to score prompts for complexity. Each check appends a reason code, which makes routing decisions transparent and testable. Common signals include prompt length, presence of code blocks or technical keywords, and explicit user intent hints.

Reason codes feed experiments and offline evaluation so you can answer questions like "how many premium requests were due to code snippets".

## Reliability guards: retry, circuit breaker, fallback

Reliability is critical when routing across providers. The service implements:

- Circuit breaker to stop calling a failing provider
- Retry with backoff for transient failures
- Fallback from cheap to premium when the cheap provider fails or times out

Circuit breaker and retry state are exposed via `GET /v1/circuit-breaker/status` for observability and debugging.

## Provider contract and pricing

Providers implement a common contract so the router does not depend on SDKs. Supported providers include `mock` for deterministic tests, `ollama` for local LLMs, `openai`, and `anthropic` for hosted models.

Pricing is configured with environment variables for input and output tokens per million, allowing precise cost math per request. For example:

```env
CHEAP_INPUT_PRICE_PER_1M=0.15
CHEAP_OUTPUT_PRICE_PER_1M=0.60
PREMIUM_INPUT_PRICE_PER_1M=5.00
PREMIUM_OUTPUT_PRICE_PER_1M=15.00
```

## Telemetry and dashboard

Every routed request writes an event to a SQLite store with provider, tier, tokens, latency, cost estimate, fallback flag, and experiment label. The included Streamlit dashboard visualizes tier mix, spend over time, latency distributions, and experiment outcomes.

Use `python -m benchmark.run` to execute the bundled 50-prompt benchmark and validate routing accuracy and cost math.

## Where to look in the code

- `app/router.py` contains the routing logic and complexity scoring
- `app/reliability.py` implements retries, circuit breaker, and fallback
- `app/experiment.py` defines experiment modes and baseline comparisons
- `app/config.py` centralizes provider selection and pricing env variables
- `app/providers/` contains provider implementations for mock, ollama, openai, and anthropic

Try editing the heuristic in `app/router.py` to experiment with where the threshold sits and re-run the benchmark to see cost and accuracy change.

## Evaluation and benchmark

The repo includes a benchmark that compares routing policy against `always_cheap` and `always_premium` baselines. The focus is on routing accuracy and cost for a small, representative sample.

Benchmark snapshot (example):

| Policy | Routing Accuracy | Cost / 50 Requests | vs Always Premium |
|---|---:|---:|---:|
| `router_v1` | 80.0% | $0.004313 | -65.6% |
| `always_cheap` | 60.0% | $0.000465 | -96.3% |
| `always_premium` | 40.0% | $0.012525 | baseline |

These numbers use the mock provider and configured pricing for deterministic validation.

## Design trade-offs and why they matter

- Rule-based scoring first: transparent, cheap, and easy to test in CI.
- Provider abstraction: keeps the router independent of vendor SDKs.
- Quality proxy: inline, low-cost feedback avoids extra judge calls on every request.
- SQLite telemetry: easy local setup and reproducible analysis for demos.

## Production hardening roadmap

- Persist experiment registry and rollout percentages
- Add LLM-as-judge or human-labeled quality evaluation for better accuracy signals
- Export Prometheus/OpenTelemetry metrics
- Add per-tenant budgets and policy enforcement
- Add CI gate that fails on routing benchmark regressions

## Final thoughts

Routing models by cost and complexity is a pragmatic lever to reduce inference spend while preserving user experience. This repo provides a clear, testable starting point with the essential building blocks: scoring, routing policy, reliability, telemetry, and evaluation.

If you want, I can expand any section with code excerpts, add an example CI workflow that fails on regressions, or wire a Prometheus exporter into the project.

Source: https://github.com/manjeetkumar53/llm-routing-engine
