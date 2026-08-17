---
name: git-push-authority-hook
description: Never prefix git push with AIOX_ACTIVE_AGENT=devops or any env var — the authority hook trusts only the runtime agent_type
metadata:
  type: feedback
---

Never prepend `AIOX_ACTIVE_AGENT=devops` (or any other environment-variable prefix) to a `git push` command to satisfy the global `enforce-git-push-authority.cjs` hook. Run the plain push command.

**Why:** The hook used to accept `AIOX_ACTIVE_AGENT=devops` typed inside the command string itself, which meant any caller could forge devops authority — a real security hole. It was rewritten on 2026-08-11 to remove that path. The hook now trusts only the `agent_type` field that the Claude Code runtime attaches automatically when a tool call runs inside a subagent. A genuine `aiox-devops` subagent already passes on that basis alone.

**How to apply:** When running any push as the devops subagent, issue the bare command (e.g. `git push origin master:main`). If the hook blocks it anyway, STOP and report the literal error — do not attempt any workaround, and do not reintroduce the env-var prefix into memory, docs, or scripts.

Related: [[era-meu-pode-ser-seu-repo-setup]]
