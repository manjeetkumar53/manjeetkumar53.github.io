---
title: "AI Incident Copilot: How to Give AI the Power to Help — But Not the Power to Act Alone"
date: "2026-05-06T12:00:00+02:00"
author: "Manjeet Kumar"
category: "Enterprise AI"
tags: ["Incident Response", "AIOps", "RBAC", "FastAPI", "Production AI", "Python", "Observability"]
excerpt: "A deep-dive into the AI Incident Copilot — a production-style system that uses AI to plan incident responses, but always requires human approval and role-based authorization before any action is taken."
image: ""
featured: true
draft: false
---

## What Is This And Why Does It Exist?

Imagine your monitoring system fires a critical alert at 2am. Your checkout service is throwing 5xx errors. The SLO is breached.

You need to move fast. But moving too fast — giving an AI full control to restart services, shift traffic, or roll back deployments without a human decision — is how you turn a bad incident into a worse one.

The [AI Incident Copilot](https://github.com/manjeetkumar53/ai-incident-copilot) solves this exact tension. It uses AI to do the hard thinking — gather context, identify the runbook, generate a mitigation plan — but puts a human gate before anything actually changes in your system.

**In plain terms:** an alert comes in, the AI builds a response plan, a human with the right role approves it, and only then does execution happen. Every step is logged. A full audit report is available at any point.

**Who is it useful for?**

- **Engineering teams** who want AI-assisted incident response but cannot afford to let AI act without a human sign-off.
- **Platform and SRE teams** building on-call tooling who need RBAC, severity policies, and audit trails built into the system from day one.
- **Engineering managers** who want visibility into how incidents were handled — what was planned, who approved it, and when.

**The core problems it solves:**

| Problem | How this system handles it |
|---|---|
| AI acts before a human reviews | Execution is blocked until the incident is approved |
| Anyone can approve or execute | Role-based authorization on every sensitive endpoint |
| Critical incidents need stricter control | Severity policy: only `incident_commander` can execute critical |
| No record of who did what | Immutable timeline + full Markdown audit report |
| Alerts from multiple sources | PagerDuty, Slack, and webhook ingest surface built in |

You can run it locally in two minutes, trigger a full incident lifecycle, and review the audit report — all without any external services.

> [!IMPORTANT]
> The design principle is **control before automation**. AI earns the right to execute by first earning human trust through a plan, a review, and an approval.

## The Incident Lifecycle

Every incident moves through a strict five-state machine. No state can be skipped.

```text
open  ->  planned  ->  approved  ->  executing  ->  mitigated
```

| State | What happened |
|---|---|
| `open` | Alert ingested — waiting for a plan |
| `planned` | Copilot generated a mitigation plan |
| `approved` | Human with the right role approved the plan |
| `executing` | Approved steps are running |
| `mitigated` | Incident resolved and timeline sealed |

This is not just cosmetic. The API enforces each transition:
- You cannot approve without a plan.
- You cannot execute without approval.
- You cannot execute with the wrong role.
- Critical incidents cannot be executed by anyone except the `incident_commander`.

## Step 1: Ingest the Alert

The first endpoint accepts an alert from your monitoring system — directly or via a named integration:

```python
@app.post("/v1/incidents/ingest", response_model=IngestResponse, status_code=201)
def ingest_incident(payload: IncidentIngestRequest) -> IngestResponse:
    incident_id = str(uuid.uuid4())
    record = IncidentRecord(
        id=incident_id,
        title=payload.title,
        service=payload.service,
        severity=payload.severity,
        source=payload.source,
        summary=payload.summary,
        status=IncidentStatus.open,
    )
    store.add_incident(record)
    store.add_timeline_event(
        incident_id,
        TimelineEvent(event="incident.ingested", actor="system", detail=f"Source={payload.source}"),
    )
    return IngestResponse(incident_id=incident_id, status=record.status)
```

The timeline event is written immediately on ingest. Every state change from this point forward appends a new event. By the time the incident is resolved, you have a complete, ordered record of everything that happened.

PagerDuty, Slack, and webhook integrations use a separate surface (`/v1/integrations/{source}/ingest`) that validates the source name and records it against the incident for audit purposes.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/integrations/pagerduty/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Checkout error spike",
    "service": "checkout-api",
    "severity": "critical",
    "summary": "5xx errors crossed SLO threshold",
    "external_id": "PD-12345"
  }'
```

## Step 2: Generate the Plan

Once an incident is open, you trigger the planner. In [`app/services/planner.py`](https://github.com/manjeetkumar53/ai-incident-copilot/blob/main/app/services/planner.py), the `create_plan` function builds a structured mitigation plan based on service name, severity, and context:

```python
def create_plan(record: IncidentRecord) -> IncidentPlan:
    runbook_id = f"rb-{record.service.lower().replace(' ', '-')}-001"

    base_steps = [
        PlanStep(
            id="s1",
            description="Fetch recent error rate, latency, saturation, and dependency health for the impacted service.",
            step_type=StepType.read_only,
        ),
        PlanStep(
            id="s2",
            description="Correlate latest deploys, config changes, and upstream incidents within the last 30 minutes.",
            step_type=StepType.read_only,
        ),
    ]

    if record.severity in {Severity.critical, Severity.high}:
        mitigation = PlanStep(
            id="s3",
            description="Prepare rollback or traffic-shift command and pause rollout until approved by incident commander.",
            step_type=StepType.write_action,
        )
        confidence = 0.87
        rationale = "High-severity signal with likely user impact; prioritize containment and reversible mitigation."
    else:
        mitigation = PlanStep(
            id="s3",
            description="Apply low-risk config mitigation in canary scope after approval.",
            step_type=StepType.write_action,
        )
        confidence = 0.78
        rationale = "Medium/low severity allows controlled mitigation after focused diagnostics."

    return IncidentPlan(...)
```

Notice how each step has a `step_type`:

- `read_only` — safe diagnostics: checking dashboards, pulling logs, correlating deploys.
- `write_action` — actual changes: rollback, traffic shift, config push.

This distinction matters because the policy engine later checks that a `write_action` exists before allowing execution. A plan with only read steps cannot be executed — there is nothing to do.

The plan also carries a `confidence` score and a `rationale` field. This gives the approver visible reasoning before they sign off.

## Step 3: Require Human Approval

The approval endpoint is role-gated. The implementation lives in [`app/services/authz.py`](https://github.com/manjeetkumar53/ai-incident-copilot/blob/main/app/services/authz.py):

```python
def require_role(request: Request, allowed_roles: set[str]) -> str:
    role = request.headers.get("X-Role", "").strip().lower()
    if role not in allowed_roles:
        allowed = ", ".join(sorted(allowed_roles))
        raise HTTPException(status_code=403, detail=f"Role not allowed. Expected one of: {allowed}")
    return role
```

Only `incident_commander` or `engineering_manager` can approve:

```python
@app.post("/v1/incidents/{incident_id}/approve", response_model=ApprovalResponse)
def approve_plan(incident_id: str, payload: ApprovalRequest, request: Request) -> ApprovalResponse:
    require_role(request, {"incident_commander", "engineering_manager"})

    if store.get_plan(incident_id) is None:
        raise HTTPException(status_code=409, detail="Plan must be generated before approval")

    store.update_incident_status(incident_id, IncidentStatus.approved.value)
    store.add_timeline_event(
        incident_id,
        TimelineEvent(event="plan.approved", actor=payload.approved_by, detail=payload.comment or "No comment"),
    )
    return ApprovalResponse(status=IncidentStatus.approved, approved_by=payload.approved_by)
```

If the role header is missing or wrong, you get a 403. If no plan has been generated yet, you get a 409. The incident status is only updated to `approved` after all checks pass — and the timeline records exactly who approved it and what comment they left.

```bash
curl -s -X POST http://127.0.0.1:8000/v1/incidents/<ID>/approve \
  -H "Content-Type: application/json" \
  -H "X-Role: incident_commander" \
  -d '{"approved_by":"alice","comment":"Reviewed — proceed with rollback"}'
```

## Step 4: Enforce Execution Policy

Execution has the strictest controls. The policy engine in [`app/services/policy.py`](https://github.com/manjeetkumar53/ai-incident-copilot/blob/main/app/services/policy.py) runs four checks before a single step is allowed to execute:

```python
def check_execution_policy(incident: IncidentRecord, role: str, plan: IncidentPlan | None) -> tuple[bool, str]:
    if plan is None:
        return False, "Plan must exist before execution"

    # Critical incidents can only be executed by incident commander.
    if incident.severity == Severity.critical and role != "incident_commander":
        return False, "Critical incidents require incident_commander role for execution"

    # Guard against accidental execution when plan has no actionable write step.
    has_write_action = any(step.step_type == "write_action" for step in plan.steps)
    if not has_write_action:
        return False, "Plan has no write_action step to execute"

    return True, "allowed"
```

Combined with the endpoint's status check, you get four independent blockers:

| Check | Blocks execution if... |
|---|---|
| Status check | Incident is not in `approved` state |
| Role check | Caller is not `incident_commander` or `sre_oncall` |
| Severity policy | Incident is `critical` and role is not `incident_commander` |
| Plan content | Plan exists but has no `write_action` steps |

Any one of these failing returns a 403 with a specific reason. No action is taken. No state changes. The timeline is not touched.

## Step 5: Timeline and Audit Report

After mitigation, every event from ingest to resolution is available as a structured timeline, and as a formatted Markdown audit report. The report is generated in [`app/services/reporting.py`](https://github.com/manjeetkumar53/ai-incident-copilot/blob/main/app/services/reporting.py):

```python
def build_audit_report(
    incident: IncidentRecord,
    plan: IncidentPlan | None,
    timeline: list[TimelineEvent],
) -> tuple[list[str], str]:
    controls = [
        "Plan generation required before approval",
        "Approval endpoint protected by incident role allowlist",
        "Execution endpoint protected by role and severity policy",
        "Every state transition recorded in the timeline",
    ]
    # ... builds a Markdown report with incident details, plan steps, controls, and timeline
```

A real audit report looks like this:

```markdown
# Incident Audit Report: Checkout error spike

- Incident ID: a3f8...
- Service: checkout-api
- Severity: critical
- Source: pagerduty
- Current status: mitigated

## Plan
- Runbook: rb-checkout-api-001
- Confidence: 0.87
- Rationale: High-severity signal with likely user impact; prioritize containment

## Planned Steps
- s1: [read_only] Fetch recent error rate, latency, saturation...
- s2: [read_only] Correlate latest deploys, config changes...
- s3: [write_action] Prepare rollback or traffic-shift command...

## Controls
- Plan generation required before approval
- Approval endpoint protected by incident role allowlist
- Execution endpoint protected by role and severity policy
- Every state transition recorded in the timeline

## Timeline
- 2026-05-06T11:00:01: incident.ingested by system - Source=pagerduty
- 2026-05-06T11:00:03: plan.generated by copilot - Runbook=rb-checkout-api-001
- 2026-05-06T11:02:15: plan.approved by alice - Reviewed — proceed with rollback
- 2026-05-06T11:02:18: execution.started by alice - Running approved steps
- 2026-05-06T11:02:19: incident.mitigated by alice - Mitigation marked complete
```

This report is returned from `GET /v1/incidents/{id}/audit-report` as a structured JSON response that includes the raw Markdown, the controls list, the full plan, and the timeline. It is designed to be human-readable for post-incident review and machine-readable for automated compliance checks.

## The Data Model

The entire system is built on clean, typed Pydantic models in [`app/models.py`](https://github.com/manjeetkumar53/ai-incident-copilot/blob/main/app/models.py):

```python
class IncidentPlan(BaseModel):
    incident_id: str
    runbook_id: str
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str
    steps: list[PlanStep]

class PlanStep(BaseModel):
    id: str
    description: str
    step_type: StepType          # read_only | write_action

class TimelineEvent(BaseModel):
    event: str
    actor: str
    detail: str
    created_at: str | None = None
```

The `confidence` field is bounded between 0 and 1 at the model level. `step_type` is an enum — no free-text string can slip through. Every field the API accepts or returns is validated and typed.

## The Full API Surface

```text
External alert
  -> POST /v1/integrations/{source}/ingest   (PagerDuty, Slack, webhook)
     or POST /v1/incidents/ingest            (direct)
  -> SQLite incident store
  -> POST /v1/incidents/{id}/plan            (copilot generates plan)
  -> POST /v1/incidents/{id}/approve         (X-Role: incident_commander or engineering_manager)
  -> POST /v1/incidents/{id}/execute         (X-Role: incident_commander or sre_oncall + policy check)
  -> timeline events + audit report
```

| Endpoint | Purpose |
|---|---|
| `GET /health` | Service liveness |
| `POST /v1/incidents/ingest` | Direct alert ingest |
| `POST /v1/integrations/{source}/ingest` | PagerDuty, Slack, or webhook ingest |
| `POST /v1/incidents/{id}/plan` | Generate mitigation plan |
| `POST /v1/incidents/{id}/approve` | Role-gated plan approval |
| `POST /v1/incidents/{id}/execute` | Role + policy-gated execution |
| `GET /v1/incidents/{id}` | Incident detail with plan and timeline |
| `GET /v1/incidents/{id}/audit-report` | Reviewer-ready incident evidence |
| `GET /v1/incidents` | Filtered and paginated incident list |
| `GET /v1/metrics/summary` | Operational metrics by status and severity |

## Running It Locally

```bash
git clone https://github.com/manjeetkumar53/ai-incident-copilot.git
cd ai-incident-copilot

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

Open Swagger UI at `http://127.0.0.1:8000/docs` and run the full lifecycle in the browser.

```bash
# Run all tests
pytest -q

# Run just the lifecycle tests
pytest -q tests/test_incident_flow.py
```

The test suite covers the happy path, every blocked state transition, every role violation, the severity policy, integration ingest, and audit report generation.

## What Makes This Different

Most "AI + incident response" demos show a chatbot answering questions about an alert. This system is different in three specific ways.

**1. The AI plans; humans approve; policy executes.**
There is a hard boundary between generation and action. The AI cannot skip approval. The system cannot execute without a plan. An `sre_oncall` cannot execute a critical incident. These are enforced at the API level, not by convention.

**2. Every decision is recorded before it happens.**
Timeline events are written at ingest, at plan generation, at approval, at execution start, and at mitigation. The audit report is not assembled after the fact — it is the live record of the incident as it unfolded.

**3. The controls are part of the product surface.**
The `GET /v1/incidents/{id}/audit-report` endpoint returns a `controls` array alongside the Markdown report. This is not a docs page. It is the system telling you, on every incident, which controls were active and applied.

## Design Decisions Worth Noting

**Why header-based roles?**
Simple enough to demonstrate clearly in a portfolio context while making control boundaries explicit. In a real deployment, this would be JWT claims or a signed identity token from your IdP.

**Why SQLite?**
Zero infrastructure overhead. The store is abstracted behind an interface and can be replaced with Postgres with a migration without changing any service code.

**Why a deterministic planner instead of a live LLM call?**
Stable tests, predictable behavior under incident pressure, and no dependency on an API key or network call during an active incident. The planner logic is the part to extend — the control model around it is what matters.

## Production Hardening Backlog

The README is honest about what is production-ready and what is not:

- Replace header-based roles with signed JWT claims
- Move SQLite persistence to Postgres with migration tooling
- Execute write actions through an async job worker with retry
- Add real PagerDuty, Slack, and deployment rollback integrations
- Add immutable audit export and incident analytics dashboard

Each of these is a known, bounded problem. The control model — state machine, RBAC, policy engine, timeline, audit report — is the hard part, and it is already built.

## Final Thought

AI can make incident response faster. But faster in the wrong direction — an AI that acts without review during a critical production incident — creates more damage, not less.

The right model is: AI handles the cognitive load of planning, humans handle the judgment of approval, and policy handles the enforcement of who can do what.

That pattern is what this repository demonstrates. A complete incident lifecycle. Role-based gates. Severity-aware policy. Immutable audit trail. All in a system you can run locally, inspect in full, and extend to real integrations.

The code is at [github.com/manjeetkumar53/ai-incident-copilot](https://github.com/manjeetkumar53/ai-incident-copilot).
