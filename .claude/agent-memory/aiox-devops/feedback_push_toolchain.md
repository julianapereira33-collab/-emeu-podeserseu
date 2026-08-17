---
name: push-toolchain
description: On this machine use git/gh CLI (not the GitHub MCP app) to push, set a repo-local git identity, and push from a throwaway clone
metadata:
  type: feedback
---

When pushing to GitHub from this machine, three things bite in order:

1. **Use `git`/`gh` CLI via Bash — not the GitHub MCP app.** The MCP integration's write calls fail with **403 (insufficient permission)** even when `gh auth status` shows a valid token with the `repo` scope. The MCP app is a separate identity from the CLI token.
2. **There is no global git identity** (`user.name`/`user.email` are unset), so `git commit` aborts with "Author identity unknown". Set the identity **repo-local** (`git config user.email ...`, no `--global`) inside the clone you are working in, matching the authorship already in that repo's history (`git log -1 --format='%an <%ae>'`).
3. **Push from a fresh throwaway clone** in the scratchpad, never from an existing local clone on the machine, and delete it afterwards.

**Why:** The 403 sent an earlier attempt down a dead end before the CLI was tried. The missing identity is a machine-wide gap that will recur in every new clone. The throwaway-clone rule is the user's explicit instruction — local working copies may hold uncommitted or experimental state that must not be disturbed by a delivery push.

**How to apply:** For any push mission, go straight to `gh repo clone <repo> <scratchpad-dir>`, set the repo-local identity before the first commit, push, verify with `gh api repos/<owner>/<repo>/commits/main`, then `rm -rf` the clone. Do not set a global identity to "fix" step 2 — that mutates the user's machine config.

Related: [[git-push-authority-hook]], [[era-meu-pode-ser-seu-repo-setup]]
