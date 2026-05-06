---
title: "Custom PDF AI: Chat with Your Documents Locally"
date: "2026-05-06T11:50:00+02:00"
author: "Manjeet Kumar"
category: "Developer Tools"
tags: ["RAG", "PDF", "Streamlit", "FAISS", "LangChain"]
excerpt: "A local Streamlit app that lets you upload multiple PDFs and chat with their combined content using embeddings and a lightweight vector store."
image: ""
featured: false
draft: false
---

## Simple intro: what this repo is and why it matters

Need a quick way to ask questions about a set of PDF documents? Custom PDF AI turns uploaded PDFs into a searchable knowledge base you can chat with locally. It uses text extraction, chunking, OpenAI embeddings, and a FAISS vector index to return citation-backed, grounded answers.

Who should read this:

- Product and documentation teams who want a quick tool to validate content
- Analysts and researchers who need to query multiple PDFs together
- Developers learning a minimal, local RAG pipeline with Streamlit and FAISS

Quick problem and solution summary

| Problem | How this repo helps |
|---|---|
| PDFs are hard to search and combine | Upload PDFs and get semantic search across all documents |
| Scanned or image-only PDFs hide text | Scanned detection warns you and avoids silent failures |
| Hard to run without cloud infra | Local FAISS index and Streamlit UI that runs without external services |

## How it works in simple steps

1. Upload one or more PDF files via the Streamlit sidebar.
2. `pypdf` extracts selectable text from each PDF. Scanned PDFs are detected and flagged.
3. Text is split into overlapping chunks using `CharacterTextSplitter`.
4. Each chunk is embedded using OpenAI embeddings and indexed into FAISS.
5. On a user question, the top-k similar chunks are retrieved and sent to `gpt-4o-mini` to generate a grounded answer.
6. The chat history is retained so follow-up questions are context-aware.

## Quick start: run it locally

```bash
git clone https://github.com/manjeetkumar53/custom-pdf-ai.git
cd custom-pdf-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set OPENAI_API_KEY in .env
streamlit run app.py
```

Open `http://localhost:8501` in your browser, upload PDFs, and start asking questions.

## Example usage and common flows

- Combine multiple runbooks or SOPs and ask cross-document questions like "Which runbook handles database failover?"
- Upload a research paper collection and ask for a summary across papers
- Validate that a policy document contains a required clause by asking targeted questions

If a PDF has no extractable text, the UI warns you so you can run OCR first.

## Project files and where to look

- `app.py` - Streamlit app, session state, pipeline orchestration, and UI templates
- `htmlTemplates.py` - Chat bubble HTML and CSS for a clean UI
- `.env.example` - Environment template for the OpenAI API key
- `requirements.txt` - Dependencies including `faiss-cpu` and `pypdf`

## Libraries and technical choices

- `pypdf` for fast selectable text extraction from PDFs
- `CharacterTextSplitter` for chunking with overlap to preserve context
- `OpenAIEmbeddings` for semantic vectors
- `FAISS` for a fast local vector index
- `gpt-4o-mini` for compact grounded generation
- `Streamlit` for a small, friendly UI that runs locally

## Known limitations and cautions

- Scanned PDFs are not supported out of the box. Use OCR if you need scanned PDF support.
- Very large PDFs may hit the token limits of the model; the app sends top-4 chunks per query.
- The FAISS index is in-memory per session and is not persisted to disk. For persistence, move to disk-backed FAISS or another vector store.

## Where this is useful in a workflow

- Internal documentation search for teams who want a private, local tool
- Quick due diligence over a set of PDFs before meetings
- Prototyping RAG features before investing in cloud vector stores

## Next steps and production hardening

- Persist FAISS or migrate to a managed vector store for long-term use
- Add OCR support for scanned PDFs using Tesseract or cloud OCR services
- Add per-document metadata and source links in the chat UI
- Add rate limiting and user authentication before sharing outside a trusted environment

## Final thought

Custom PDF AI is a compact, practical example of how to build a local RAG application that is easy to run, explore, and extend. It is ideal for documentation teams and developers who want a private, hands-on tool to query PDF content.

Source: https://github.com/manjeetkumar53/custom-pdf-ai
