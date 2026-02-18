---
title: "Practical Guide to Claude Agent Teams"
date: "2026-02-06T12:05:00"
author: "Manjeet Kumar"
category: "AI Tools"
tags: ["Claude", "AI Agents", "Claude Code", "Productivity"]
excerpt: "Learn how to use Claude Agent Teams to coordinate multiple AI instances for parallel research, debugging, and modular development locally."
image: ""
featured: true
draft: false
---

## Introduction

Claude **Agent Teams** (research preview as of early 2026) is an experimental feature in **Claude Code** — Anthropic's agentic terminal/IDE tool. It lets one "team lead" Claude session spawn and coordinate multiple independent "teammate" Claude instances. 

These teammates work in parallel on a shared codebase or task, communicate directly via a mailbox system, manage a shared task list (with states like pending/in-progress/completed and dependencies), and collaborate without everything funneling through the lead like subagents do.

> [!IMPORTANT]
> This enables true multi-perspective work: parallel research, competing debugging hypotheses, modular development (frontend/backend/tests), code reviews from specialized angles, or autonomous division of labor on large projects.

It's token-heavy (each teammate loads full project context independently), so use it for tasks that benefit from parallelism over single-threaded depth.

---

## Top 5 Practical Things with Claude Agent Teams

Recent examples include Anthropic using it with Opus 4.6 to build a full Rust-based C compiler (compiling Linux kernel, SQLite, Doom) with 16 parallel agents on a shared repo, mostly autonomously.

Here are the **top 5 meaty, practical things** people are doing or can do right now on their local machine — with exact setup and usage steps.

### 1. Enable and Set Up Agent Teams Locally

Claude Code runs locally (CLI in terminal, VS Code extension, desktop app) and stores teams/tasks in `~/.claude/`.

**Steps**:
1. **Install Claude Code** (requires Claude Pro/Max/Teams/Enterprise or Console account):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
   Authenticate via `claude login` (links to your Anthropic account).

2. **Enable the experimental flag** (disabled by default):
   - **Option A (persistent):** Edit or create `~/.claude/settings.json` (or project-local `.claude/settings.json`):
     ```json
     {
       "env": {
         "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
       }
     }
     ```
   - **Option B (session-only):** Export in shell:
     ```bash
     export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
     ```

3. **Optimize the UX** (split panes per teammate):
   - Install **tmux** (macOS: `brew install tmux`; Linux/Windows WSL similar).
   - Or use iTerm2 (macOS) + install it2 CLI tools and enable Python API in iTerm2 settings.
   - Set teammate display mode if needed:
     ```json
     {
       "teammateMode": "tmux"
     }
     ```

> [!TIP]
> Using `tmux` mode provides the best experience as it allows you to see all agents working in real-time in separate panes.

4. **Start Claude Code** in your project folder:
   ```bash
   cd your-project
   claude
   ```

---

### 2. Spawn a Team for Parallel Code Review

Best early use: complex debugging or reviewing large changes/PRs where multiple angles help.

**How to trigger it**:
In your Claude Code session, prompt naturally:
```text
Create an agent team to review this PR / debug why the service crashes under load.

Spawn 3 teammates:
- Security reviewer: focus on vulnerabilities, auth, injection risks.
- Performance specialist: check bottlenecks, scaling issues.
- Test coverage critic: validate existing tests, suggest gaps.

Have them work in parallel, discuss findings via messages, then you (lead) synthesize a final report.
```

Claude (lead) spawns teammates, creates shared task list, assigns or lets them self-claim tasks. Teammates message each other/broadcast (use sparingly for cost).

**Interaction commands**:
- **In-process mode:** `Shift+Up/Down` to select teammate, type to message them directly.
- **tmux/split:** Click panes or use tmux keys.
- **Monitor tasks:** `Ctrl+T` toggles task list view.

---

### 3. Coordinate Modular Development

For building/refactoring across layers without context pollution.

**Example prompt**:
```text
We're building a TODO CLI tool. Create an agent team with:
- Frontend teammate (CLI UX, argument parsing, output formatting)
- Backend teammate (core logic, storage, TODO comment parsing)
- Test teammate (unit/integration tests, edge cases)

Assign disjoint modules/files. Use Sonnet for speed if desired. Require plan approval before code changes.
```

> [!NOTE]
> Enable **plan approval mode** (teammate plans in read-only until lead approves) or **delegate mode** (`Shift+Tab`: lead only coordinates, no direct coding).

---

### 4. Run Adversarial Hypothesis Investigations

Great for research-heavy or ambiguous bugs.

**Example** (inspired by Anthropic's compiler work):
```text
Users see app disconnect after first message. Spawn 5 teammates to explore competing hypotheses in parallel:

1. Network timeout config
2. Event loop blockage
3. Memory leak
4. Protocol mismatch
5. Devil's advocate: user error or env issue

Have them debate/disprove each other via messages, update a shared findings.md with consensus.
```

---

### 5. Automate Multi-Perspective Planning

Agent Teams work beyond pure code — any parallelizable task with shared context (e.g., via `CLAUDE.md` docs).

**Examples**:
- **Market analysis:** Spawn researcher, skeptic, data synthesizer.
- **Doc writing:** One for outline, one for depth, one for critique.
- **Prompt:** 
  ```text
  Create a team to plan a new feature: one UX-focused, one architecture, one edge-case devil's advocate. Output consolidated spec.
  ```

---

## Pro Tips for Local Teams

- **Start small (2-4 teammates)** to control costs/tokens.
- **Give clear role prompts** when spawning (e.g., "Spawn security teammate with prompt: Review src/auth for vulns...").
- **Use disjoint tasks/files** to avoid conflicts.
- **Pre-approve common ops** in Claude Code permissions to reduce prompts.
- **Monitor:** Teammates notify lead when idle; lead synthesizes.

> [!CAUTION]
> **Experimental Status:** There is no easy "resume" for teammates yet, and shutdown can be slow. Always perform a clean shutdown:
> ```text
> Clean up the team
> ```
