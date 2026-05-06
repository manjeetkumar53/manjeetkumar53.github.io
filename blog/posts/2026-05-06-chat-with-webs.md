---
title: "Chat with Websites: Build a RAG-Powered Web Chatbot"
date: "2026-05-06T11:48:00+02:00"
author: "Manjeet Kumar"
category: "Developer Tools"
tags: ["RAG", "Streamlit", "LangChain", "ChromaDB", "Web Scraping"]
excerpt: "A simple, local Streamlit app that turns any public web page into a chatable knowledge base using RAG. Learn how it works, run it locally, and see example usage."
image: ""
featured: false
draft: false
---

## Simple intro: what this repo is and why it matters

Want to ask questions about a web page in natural language? Chat with Websites converts any public page into a conversation you can ask follow up questions to. It extracts the page text, creates embeddings, and uses a retriever plus an LLM to produce grounded answers.

This is useful for research, quick site summaries, documentation checks, and building simple demo apps that require grounded answers from a specific web page.

Who should read this:

- Developers building quick internal tools to query documentation or support pages
- Researchers who want a simple way to interrogate web content with context
- Product people who need a demo to show grounding and source-aware answers

Quick problem and solution summary

| Problem | How this repo helps |
|---|---|
| You need contextual answers from a web page | Paste a URL and get citation-backed answers from that page |
| Multi-turn context is hard to maintain | Conversation history is used to rephrase follow up questions |
| Scraping and chunking can be complex | Built-in loader, splitter, and ChromaDB make it simple to run locally |

## How it works in simple steps

1. Paste a public website URL in the sidebar.
2. The app loads the page with WebBaseLoader and BeautifulSoup.
3. The content is split into chunks using RecursiveCharacterTextSplitter.
4. Chunks are embedded with OpenAI embeddings and stored in a ChromaDB index.
5. When you ask a question, a history-aware retriever rephrases the question.
6. The top relevant chunks are retrieved and sent to GPT-4o-mini to produce a grounded answer.

This flow keeps answers tied to page text and shows when the page does not contain an answer.

## Quick start: run it locally

```bash
git clone https://github.com/manjeetkumar53/chat-with-webs.git
cd chat-with-webs
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# add your OPENAI_API_KEY to .env
streamlit run src/app.py
```

Open `http://localhost:8501` to use the app.

## Example usage

1. Paste `https://example.com/some-doc` into the sidebar.
2. Wait a few seconds while the page is indexed.
3. Ask: "How do I reset my password on this site?"
4. The bot returns a short answer and shows which chunk or source supported the response.

If the page does not include the answer, the bot will say it does not know, so you avoid hallucinated claims.

## Project structure and where to look

- `src/app.py` - Streamlit UI and RAG pipeline. This is the best place to start.
- `docs/HTML-rag-diagram.jpg` - Simple architecture diagram.
- `.env.example` - Environment variables template, including OPENAI_API_KEY.

The app uses LangChain 0.3 and ChromaDB for a local, minimal RAG pipeline you can run without extra cloud services.

## API and libraries used

- WebBaseLoader and BeautifulSoup for page loading and parsing
- RecursiveCharacterTextSplitter for chunking (1000 char chunks, 200 overlap)
- OpenAI embeddings for vectorizing chunks
- ChromaDB local index for retrieval
- GPT-4o-mini for grounded answer synthesis
- Streamlit for interactive UI

## Known limitations and cautions

- Public pages only. Pages behind authentication, paywalls, or bot protections will not work.
- Content extraction is text only. Images, complex tables, and JavaScript-rendered content may be missing.
- The vector index is in-memory per session. It is rebuilt when you change the URL.
- Not designed for production persistence. Use this as a demo or a local utility.

## Use cases and ideas

- Quick documentation Q and A for product teams
- Support staff assistant to find steps on a public knowledge base
- Research assistant for summarizing articles and extracting facts
- Demo app for workshops to show RAG grounding and source attribution

## Where to go next: improvements and production notes

- Persist ChromaDB to disk or migrate to a production vector store
- Add multi-URL session support and long-term memory
- Improve extractors to render JavaScript content via a headless browser
- Add source highlighting and direct link to the supporting paragraph
- Add rate limiting and request protections before exposing in public

## Final thoughts

Chat with Websites is a compact, well scoped demo of retrieval-augmented generation applied to a single web page. It is a great hands-on tool to learn how chunking, embedding, and retrieval work together to produce grounded answers. Run it locally, inspect the code in `src/app.py`, and try swapping chunking strategies to see how recall changes.

Source: https://github.com/manjeetkumar53/chat-with-webs
