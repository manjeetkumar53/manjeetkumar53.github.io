---
title: "Enterprise RAG Eval Platform: Testing Ground for Grounded AI"
date: "2026-05-06T11:35:00+02:00"
author: "Manjeet Kumar"
category: "Enterprise AI"
tags: ["RAG", "Evaluation", "Retrieval", "Observability", "Python", "FastAPI"]
excerpt: "A practical, API-first framework to validate retrieval-augmented generation systems: ingestion, chunking, retrieval, citation-backed answers, and deterministic regression evaluation."
image: ""
featured: true
draft: false
---

## Simple intro: what this repo is and why it matters

Have you ever relied on a RAG system in production only to find it silently stopped citing the right documents after a schema change or a prompt tweak? That silent failure is the real risk.

Enterprise RAG Eval Platform is an API-first toolkit to catch those regressions early. It ingests operational documents, creates chunks using multiple strategies, runs deterministic retrieval and rerank checks, synthesizes citation-backed answers, and runs repeatable regression tests with clear pass/fail gates.

Who should read this:

- Platform engineers building retrieval-backed search and assistant systems
- SRE and QA engineers responsible for accuracy and traceability of answers
- Product managers who need measurable quality gates for RAG features

Quick problem/solution summary

| Problem | How this repo helps |
|---|---|
| Retrieval silently breaks after content or chunking changes | Deterministic ingestion + regression CLI checks detect recall drops |
| Answers lack verifiable sources | Grounded answer synthesis with explicit citations and source IDs |
| No measurable quality gates | Evaluation runner computes recall, similarity, faithfulness, hallucination rate, and a pass/fail signal |
| Unsure what changed between runs | SQLite-backed metrics and per-case failures that are inspectable |

## What the system does at a glance

Documents -> chunking (fixed, heading, semantic) -> SQLite store -> retriever + rerank -> answer generator with citations -> evaluation runner -> metrics + regression pass/fail

This repo focuses on the part most demos skip: proving retrieval and grounding still work as the system evolves.

## Key design principles

- Deterministic first: lexical retrieval keeps tests stable without model keys
- Extractive grounding: answers include explicit citations for verifiability
- Per-case evaluation: failures are inspectable, not hidden by averages
- Zero-infrastructure dev runs: SQLite store and mockable components for CI

## How to run locally

```bash
git clone https://github.com/manjeetkumar53/enterprise-rag-eval-platform.git
cd enterprise-rag-eval-platform
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open the Swagger UI at http://127.0.0.1:8000/docs to explore endpoints.

## Core API workflow with examples

1) Ingest documents and create chunks

```bash
curl -s -X POST http://127.0.0.1:8000/v1/documents/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "strategy":"heading",
    "documents":[
      {
        "doc_id":"checkout-runbook",
        "title":"Checkout API 5xx Runbook",
        "source":"runbooks/checkout.md",
        "text":"Checkout 5xx after deploy requires pausing rollout and preparing rollback."
      }
    ]
  }'
```

2) Query with citations

```bash
curl -s -X POST http://127.0.0.1:8000/v1/query \
  -H "Content-Type: application/json" \
  -d '{"question":"How do we mitigate checkout 5xx after deploy?","top_k":3}'
```

The response contains an extractive answer plus a list of cited chunk IDs and source paths. This makes it trivial to audit which document supported the answer.

3) Run evaluation across an expectations dataset

```bash
curl -s -X POST http://127.0.0.1:8000/v1/evaluation/run \
  -H "Content-Type: application/json" \
  --data @evaluation/questions.json
```

The evaluation runner computes retrieval_recall_at_k, average answer similarity, faithfulness, hallucination_rate, and a pass/fail flag based on configured thresholds.

## CLI workflows for regression testing

The repo includes a small CLI wrapper so you can run regressions locally or in CI:

```bash
python -m app.cli ingest data/sample_docs --strategy heading
python -m app.cli query "What caused the search latency incident?"
python -m app.cli eval evaluation/questions.json > benchmark-results.json
python -m app.cli compare baseline.json benchmark-results.json
```

Use the `compare` command in CI to fail the build on any quality regression.

## Core modules and code references

- `app/text_splitter.py` implements fixed, heading, and semantic chunking strategies. Try swapping strategies and rerunning the CLI to see different recall characteristics.
- `app/retrieval.py` contains the retrieval logic and rerank signals. It performs top-k lexical lookup and returns rerank reasons that are used by the evaluation runner.
- `app/generator.py` synthesizes answers from retrieved chunks and attaches explicit citations to each claim.
- `app/evaluation.py` runs per-question checks and aggregates recall, similarity, faithfulness, and hallucination metrics.
- `app/store.py` is a thin SQLite-backed store that persists documents, chunks, and evaluation outcomes for auditability.

Where to look for sample data and tests:

- `data/sample_docs/` contains the example documents used by the bundled benchmark
- `evaluation/questions.json` holds the expected queries and expected source document IDs
- `tests/` includes deterministic tests for chunking, retrieval recall, and evaluation metrics

## A concrete example from the code

Ingest an example and query for answers, then inspect the returned `citations` array to see which chunk and source produced the supporting evidence. The query endpoint returns JSON like this:

```json
{
  "answer": "Pause rollout and prepare rollback.",
  "citations": [
    {"chunk_id":"checkout-runbook:heading-2","source":"runbooks/checkout.md","score":0.92}
  ],
  "sources": ["runbooks/checkout.md"]
}
```

The evaluation runner compares the `citations` list against `expected_sources` in `evaluation/questions.json` to compute recall@k.

## Evaluation metrics explained

- retrieval_recall_at_k: whether any expected source was returned among top-k retrieved chunks
- avg_answer_similarity: overlap between synthesized answer and expected answer (token or embedding-based)
- avg_faithfulness: proportion of answer tokens supported by retrieved evidence
- hallucination_rate: fraction of questions where the system answered with unsupported claims
- passed: derived boolean using configured thresholds for the above metrics

A sample deterministic run in the repo yields perfect recall and faithfulness on the bundled dataset, which is expected because the system intentionally starts with a deterministic lexical retriever.

## Design trade-offs and why they matter

- Start deterministic, then add complexity: lexical retrieval ensures stable CI before introducing embedding or provider-backed models.
- Extractive answers first: easier to reason about and audit than fully generative responses.
- SQLite for local dev: lightweight, reproducible environments without external infra.
- Per-case failures: when a question fails, you get the failing input, the retrieved chunks, and the exact comparison that failed. This makes debugging fast.

## Production hardening roadmap

- Add Postgres + pgvector for scalable vector retrieval and hybrid BM25/vector search
- Add provider-backed reranking and model-based synthesis behind the same evaluation contract
- Add a web dashboard for trends, per-question failures, and historical regressions
- Add CI that fails on quality regression and stores baseline artifacts for audit
- Integrate with a dataset registry for curated evaluation sets across domains

## Where this fits in your stack

Use this repo as a gating layer between content changes and your RAG consumer. Whenever operational documents change, run a quick ingest + eval. If recall or faithfulness drops, the pipeline flags the change and prevents deployment of the updated RAG model or prompt until the failure is investigated.

## Tests and CI

Run the test suite and CLI validations locally:

```bash
pytest -q
python -m app.cli ingest data/sample_docs --strategy heading
python -m app.cli eval evaluation/questions.json
```

The tests validate chunking strategies, retrieval recall, citation grounding, and evaluation aggregation.

## Final thoughts

RAG systems are powerful, but they are brittle to subtle content and indexing changes. This project provides a pragmatic, engineering-first approach to validating the grounding guarantees that production systems need.

If you want a deeper walk-through of any component, or sample CI configuration that fails on quality regression, tell me which part to expand and I will add it to the blog and the repo examples.

Source: https://github.com/manjeetkumar53/enterprise-rag-eval-platform
