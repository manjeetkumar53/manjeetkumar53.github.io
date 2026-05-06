---
title: "Building a Production Agentic AI Platform: Architecture, Guardrails, and Observability"
date: "2026-05-06T11:00:00+02:00"
author: "Manjeet Kumar"
category: "GenAI"
tags: ["Agentic AI", "LLM", "FastAPI", "Guardrails", "Observability", "Production AI", "Python"]
excerpt: "A deep-dive into how I built a production-style agentic AI platform with planner/executor orchestration, typed tool calls, PII guardrails, circuit breakers, SQLite telemetry, and a live operations dashboard."
image: ""
featured: true
draft: false
---

## What Is This And Why Does It Exist?

Have you ever asked an AI assistant something and wondered: *how did it decide what to do? Did it accidentally read my private data? What happens if the AI service goes down? How much did that response cost?*

Most AI demos never answer these questions. They show a cool result but hide everything happening underneath.

The [Agentic AI Platform](https://github.com/manjeetkumar53/agentic-ai-platform) is built to answer all of them — openly, on every single request.

In plain terms: it is a small but complete AI system that receives a question, figures out which tools to use to answer it, calls those tools, generates an answer using an AI model, and returns everything — the answer, how it reasoned, what tools it called, how long it took, what it cost, and whether anything went wrong.

**Who is it useful for?**

- **Developers** building AI features who want to understand how to structure a safe, observable agent — not just a prompt-and-response loop.
- **Teams** evaluating LLM providers who need a clean way to swap between OpenAI, Anthropic, Ollama, or a local mock without rewriting code.
- **Engineers** who need to demonstrate that their AI system has safety checks, cost tracking, and reliability controls — not just a working demo.

**The core problems it solves:**

| Problem | How this platform handles it |
|---|---|
| AI might read private data | PII guardrails block emails, phone numbers, SSNs before the model sees them |
| Provider outages break the system | Circuit breaker + automatic fallback provider |
| No idea what the AI decided or why | Every response includes a full trace of reasoning and tool calls |
| Unknown cost until the bill arrives | Per-request token count and cost estimate in every response |
| Tests require real API keys | Mock provider runs the full pipeline with zero external dependencies |

You can run it locally in under two minutes, with no API keys, and see every one of these in action.

> [!IMPORTANT]
> The goal is not to build an agent that sometimes works. The goal is to build a system that can be measured, debugged, evaluated, and safely operated.

## What The Platform Actually Does

At its core, the platform runs a three-stage pipeline on every request:

```text
Client
  -> FastAPI middleware          (request ID, latency measurement, structured logs)
  -> prompt guardrails           (PII blocking, tool allowlist enforcement)
  -> AgentPlatformService
       -> PlannerAgent           (decide which tools are needed)
       -> ExecutorAgent          (run the tools, collect context)
       -> LLMProvider            (generate answer with context)
       -> response guardrails    (length and blocked phrase checks)
       -> telemetry store        (persist event to SQLite)
  -> response with answer, trace, cost, latency, and fallback flag
```

Every request returns not just an answer, but a full trace. You can see why the planner selected certain tools, what each tool returned, how long the provider took, what it cost, and whether a fallback provider was used.

## Layer 1: Orchestration — Planner and Executor

The orchestration layer lives in [`app/orchestration.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/orchestration.py) and separates concerns cleanly into three classes.

### The Planner

The `PlannerAgent` decides which tools to use based on prompt analysis:

```python
class PlannerAgent:
    def plan(self, prompt: str) -> PlannerOutput:
        lowered = prompt.lower()
        tools: list[str] = []
        reasoning_bits: list[str] = []

        if any(ch.isdigit() for ch in prompt):
            tools.append("calculator")
            reasoning_bits.append("Detected numeric intent")

        if any(term in lowered for term in ["cqrs", "event", "vector", "latency"]):
            tools.append("search_docs")
            reasoning_bits.append("Detected architecture/docs lookup intent")

        if not tools:
            reasoning_bits.append("No tool needed; answer directly")

        return PlannerOutput(reasoning="; ".join(reasoning_bits), tools=tools)
```

The `PlannerOutput` carries both the reasoning string and the selected tool list. This makes the planner decision explicit and testable — you can write benchmark cases against it without touching the LLM.

### The Executor

The `ExecutorAgent` runs each selected tool and accumulates context:

```python
class ExecutorAgent:
    def __init__(self) -> None:
        self._registry = {
            "calculator": CalculatorTool(),
            "search_docs": SearchDocsTool(),
        }

    def execute(self, prompt: str, tools: list[str]) -> ExecutionResult:
        calls: list[ToolCall] = []
        context_parts: list[str] = []

        for tool_name in tools:
            tool = self._registry.get(tool_name)
            if tool is None:
                continue
            output = tool.run(prompt)
            calls.append(ToolCall(tool_name=tool_name, tool_input=prompt, tool_output=output))
            context_parts.append(f"[{tool_name}] {output}")

        return ExecutionResult(tool_calls=calls, context_blob="\n".join(context_parts))
```

Each `ToolCall` is a typed Pydantic object, not a raw string. The `context_blob` is passed to the LLM so it can reason over real tool outputs.

### The Service Layer

`AgentPlatformService` wires planner, executor, provider, guardrails, reliability, and telemetry together. It is also the place where provider fallback is orchestrated:

```python
class AgentPlatformService:
    def __init__(self, settings: Settings, telemetry: TelemetryStore, ...) -> None:
        self._llm = create_provider(settings.model_provider)
        self._fallback_llm = MockLLMProvider()
        self._breaker = CircuitBreaker(
            failure_threshold=settings.breaker_failure_threshold,
            recovery_timeout_s=settings.breaker_recovery_timeout_s,
        )
```

When the primary provider fails enough times, the circuit breaker opens and requests automatically route to the fallback provider. The response carries a `fallback_used: true` flag so operators can see exactly when this happens.

## Layer 2: Typed Response Shape

One of the most underrated decisions in this platform is the response model in [`app/models.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/models.py):

```python
class AgentRunResponse(BaseModel):
    request_id: str
    answer: str
    trace: AgentTrace
    latency_ms: float
    tokens_in: int
    tokens_out: int
    estimated_cost_usd: float
    provider: str
    fallback_used: bool
```

And the trace inside it:

```python
class AgentTrace(BaseModel):
    planner_reasoning: str
    selected_tools: list[str]
    tool_calls: list[ToolCall]
```

A real response from the `/v1/agent/run` endpoint looks like this:

```json
{
  "request_id": "3fa85f64-...",
  "answer": "The result is 896.",
  "trace": {
    "planner_reasoning": "Detected numeric intent; Detected architecture/docs lookup intent",
    "selected_tools": ["calculator", "search_docs"],
    "tool_calls": [
      {
        "tool_name": "calculator",
        "tool_input": "128 * 7",
        "tool_output": "896"
      }
    ]
  },
  "latency_ms": 4.2,
  "tokens_in": 120,
  "tokens_out": 35,
  "estimated_cost_usd": 0.0000327,
  "provider": "mock",
  "fallback_used": false
}
```

This is not just a nice-to-have. When a planner makes a wrong tool selection in production, you can see exactly what reasoning it used. When a provider is slow, you have the latency per request. When costs spike, you have per-request token and cost data. All of this in the response body, not buried in a log file.

## Layer 3: Guardrails In The Request Path

Guardrails live in [`app/guardrails.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/guardrails.py) and run before and after the LLM call.

### PII Guard

```python
_PII_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("email",       re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")),
    ("phone_us",    re.compile(r"\b(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b")),
    ("ssn",         re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("credit_card", re.compile(r"\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|...)\b")),
    ("ipv4",        re.compile(r"\b(?:(?:25[0-5]|...)\.){3}...\b")),
]

class PIIGuard:
    def check(self, text: str) -> None:
        for label, pattern in _PII_PATTERNS:
            if pattern.search(text):
                raise GuardrailViolation(
                    "PIIGuard",
                    f"Detected {label} pattern in prompt — request blocked",
                )
```

If a prompt contains an email, SSN, credit card number, US phone number, or IP address, the request is blocked with a structured `GuardrailViolation` before it ever reaches the LLM. No silent leaks.

### Tool Allowlist

```python
@dataclass
class ToolAllowlist:
    _session_allowlists: dict[str, frozenset[str]] = field(default_factory=dict)

    def check(self, session_id: str, requested_tools: list[str]) -> None:
        allowed = self._session_allowlists.get(session_id)
        if allowed is None:
            return  # no restriction registered
        denied = [t for t in requested_tools if t not in allowed]
        if denied:
            raise GuardrailViolation(
                "ToolAllowlist",
                f"Session '{session_id}' is not permitted to use tools: {denied}",
            )
```

Per-session tool permissions. A session that should only use `calculator` cannot trigger a `search_docs` call, even if the planner selects it.

### Response Guard

After generation, the response is checked for length and blocked phrases. An LLM that returns a 100,000-character response or contains a prohibited string is intercepted before it reaches the client.

The composite `Guardrails` facade wraps all three:

```python
class Guardrails:
    def check_prompt(self, prompt: str, session_id: str, planned_tools: list[str]) -> None:
        self.pii.check(prompt)
        self.allowlist.check(session_id, planned_tools)

    def check_response(self, response: str) -> None:
        self.response.check(response)
```

| Guard | Trigger | HTTP response |
|---|---|---|
| `PIIGuard` | Email, phone, SSN, credit card, IPv4 | 422 — request blocked |
| `ToolAllowlist` | Tool not in session allowlist | 422 — request blocked |
| `ResponseGuard` | Response too long or blocked phrase | 422 — response suppressed |

All violations return the same structured error type so client code handles them uniformly.

## Layer 4: Reliability — Circuit Breaker and Retry

The reliability module in [`app/reliability.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/reliability.py) implements two patterns.

### Retry With Exponential Backoff

```python
def retry_with_backoff(
    fn: Callable[..., T],
    *args,
    max_attempts: int = 2,
    initial_delay_s: float = 0.05,
    **kwargs,
) -> T:
    attempt = 1
    delay = initial_delay_s
    while True:
        try:
            return fn(*args, **kwargs)
        except Exception:
            if attempt >= max_attempts:
                raise
            time.sleep(delay)
            delay *= 2
            attempt += 1
```

Simple, testable, and not tied to any specific provider. The delay doubles on each retry.

### Circuit Breaker

```python
class CircuitBreaker:
    def call(self, fn: Callable[..., T], *args, **kwargs) -> T:
        with self._lock:
            if self._state == CircuitState.OPEN:
                if (time.time() - self._opened_at) >= self._recovery_timeout_s:
                    self._state = CircuitState.HALF_OPEN
                else:
                    raise CircuitBreakerOpen("Circuit breaker is OPEN")
        try:
            result = fn(*args, **kwargs)
        except Exception:
            with self._lock:
                self._failures += 1
                if self._failures >= self._failure_threshold:
                    self._state = CircuitState.OPEN
                    self._opened_at = time.time()
            raise
        with self._lock:
            self._failures = 0
            self._state = CircuitState.CLOSED
        return result
```

After `failure_threshold` consecutive failures, the breaker opens and requests fast-fail with `CircuitBreakerOpen`. After `recovery_timeout_s` seconds, it transitions to `HALF_OPEN` and allows one probe. Success resets to `CLOSED`.

The breaker state is exposed via `GET /v1/circuit-breaker/status`, so operators can see when the system is degraded without digging into logs.

## Layer 5: Provider Abstraction

All LLM providers sit behind the same interface in `app/providers/base.py`. The factory pattern in [`app/providers/factory.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/providers/factory.py) makes switching trivial:

```python
def create_provider(name: str) -> LLMProvider:
    provider = name.lower()
    if provider == "openai":
        return OpenAIProvider()
    if provider == "ollama":
        return OllamaProvider()
    if provider == "anthropic":
        return AnthropicProvider()
    return MockLLMProvider()
```

You change `MODEL_PROVIDER` in your `.env` and the service wires the correct provider without touching application code.

| Provider | Required config |
|---|---|
| `mock` | None — deterministic, no API key needed |
| `openai` | `OPENAI_API_KEY` |
| `anthropic` | `ANTHROPIC_API_KEY` |
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

The mock provider is not a stub — it returns deterministic responses that pass guardrails and telemetry, which is exactly what you need for CI. All 37 tests pass with `MODEL_PROVIDER=mock` and no API keys.

## Layer 6: Telemetry — SQLite Event Store

Every agent run writes a `TelemetryEvent` to SQLite via [`app/telemetry.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/app/telemetry.py):

```python
@dataclass
class TelemetryEvent:
    request_id: str
    created_at: str
    provider: str
    latency_ms: float
    tokens_in: int
    tokens_out: int
    estimated_cost_usd: float
    fallback_used: bool
    tool_count: int
```

The `TelemetryStore` exposes two query methods: `all_events()` for the event log, and `summary()` for aggregate metrics:

```python
def summary(self) -> dict:
    # returns:
    {
        "request_count": 42,
        "avg_latency_ms": 3.8,
        "avg_cost_usd": 0.0000327,
        "total_cost_usd": 0.00137,
        "fallback_count": 2,
        "by_provider": {"mock": 38, "openai": 4}
    }
```

These power the `GET /v1/metrics/summary` endpoint and the Streamlit dashboard. SQLite is a practical choice for a single-node setup — no infrastructure overhead, no network dependency, and easy to inspect directly.

## Layer 7: Evaluation — Planner Regression Testing

The evaluation harness in [`evaluation/run.py`](https://github.com/manjeetkumar53/agentic-ai-platform/blob/main/evaluation/run.py) runs benchmark cases from `evaluation/prompts.json` and measures planner accuracy:

```bash
python -m evaluation.run

# Output:
precision       1.0000
recall          1.0000
f1              1.0000
exact_match     1.0000
```

The benchmark exits non-zero if F1 drops below the configured threshold. This gives you a regression gate that can run in CI. If a change to the planner logic causes it to miss tool selections or over-select tools, the evaluation fails before it merges.

This is the evaluation mindset that is missing from most agent implementations. Prompts are code. They need regression tests.

## Layer 8: Operations Dashboard

Running `streamlit run dashboard/app.py` opens a live analytics view backed by the telemetry database. It shows request volume, average latency, cost breakdown, provider distribution, and fallback rate — all from the same SQLite file the service writes to.

You do not need a separate metrics infrastructure to operate this system. The telemetry store is the source of truth.

## The Full API Surface

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check |
| `POST /v1/agent/run` | Run planner, tools, provider, guardrails, telemetry |
| `GET /v1/metrics/summary` | Aggregate latency, cost, provider, and fallback metrics |
| `GET /v1/eval/events?limit=100` | Recent telemetry events |
| `GET /v1/circuit-breaker/status` | Current circuit breaker state |

## Running It Locally

```bash
git clone https://github.com/manjeetkumar53/agentic-ai-platform.git
cd agentic-ai-platform

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# No API key needed — mock provider runs by default
uvicorn app.main:app --reload
```

Send a request:

```bash
curl -s -X POST http://127.0.0.1:8000/v1/agent/run \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 128 * 7 using CQRS context?","session_id":"demo"}'
```

Run tests:

```bash
pytest -q                    # all unit tests
python -m evaluation.run     # planner benchmark
streamlit run dashboard/app.py  # operations dashboard
```

## What Makes This Different From A Typical Agent Demo

Most agent implementations look like this:

```python
agent = Agent(tools=[...])
response = agent.run(prompt)
print(response)
```

This platform is different in five specific ways.

**1. Guardrails in the request path, not bolted on.**
PII blocking and tool allowlists fire before the LLM sees the prompt. Response checks fire before the client sees the answer. This is not optional — it runs on every request.

**2. Explicit, typed traces.**
Every response includes `planner_reasoning`, `selected_tools`, and `tool_calls`. You can debug a production issue by reading the response body, not by searching logs.

**3. Reliability by default.**
Retry and circuit breaker are wired into the service layer. The fallback provider is always ready. Degraded state is exposed via a dedicated endpoint.

**4. Cost and latency tracked per request.**
Not just in aggregate dashboards — each response body carries `tokens_in`, `tokens_out`, `estimated_cost_usd`, and `latency_ms`. Operations teams can find expensive requests without a dedicated APM tool.

**5. Deterministic tests without API keys.**
The mock provider makes the entire test suite runnable in CI with zero external dependencies. The planner evaluation has a numeric threshold gate. A failing planner fails the build.

## Design Decisions Worth Noting

**Why SQLite for telemetry?**
SQLite has zero operational overhead, works immediately without configuration, and is queryable directly with any SQL client. For a reference platform, it is the right default. The store can be replaced with a Postgres or ClickHouse backend without changing any service code.

**Why a mock provider instead of test mocks?**
A deterministic mock LLM provider gives stable responses that pass guardrails and produce valid telemetry events. This means the full request path runs in tests, including guardrails, telemetry writes, and circuit breaker state changes.

**Why separate planner and executor?**
Because they have different failure modes and different test concerns. The planner should be evaluated against a benchmark of intent examples. The executor should be tested against tool contracts. Merging them makes both harder to test and harder to improve independently.

## What I Would Add For Full Production

The current platform has a documented production hardening backlog:

- Replace in-memory session facts with Redis or Postgres-backed memory for multi-instance deployments
- Add tenant-aware tool policies for multi-tenant SaaS
- Add OpenTelemetry tracing for distributed request correlation
- Add persisted evaluation history so planner quality can be trended over time
- Add CI workflow that gates planner regressions on every pull request

Each of these is a known, bounded engineering problem — not an unknown risk.

## Final Thought

Production agentic AI is not about picking the right model. It is about building the system around the model correctly.

Safety checks that run in the request path, not as an afterthought. Traces that explain every decision. Reliability controls that keep the system working when providers fail. Telemetry that makes cost and latency visible from day one. Evaluation that catches planner regressions before they reach users.

That is what this platform demonstrates. And it runs locally, without API keys, in under two minutes.

The code is at [github.com/manjeetkumar53/agentic-ai-platform](https://github.com/manjeetkumar53/agentic-ai-platform).
