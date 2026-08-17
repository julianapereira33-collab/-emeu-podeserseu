---
name: era-meu-pode-ser-seu-repo-setup
description: This repo has no AIOX scaffolding and its local branch is master tracking origin/main — push with the mapped refspec
metadata:
  type: project
---

The "Era Meu pode ser seu" repo (Next.js app, deployed on Vercel via GitHub integration) has no AIOX scaffolding: no `.aiox-core/`, no `.claude/commands/AIOX/`, no `.aiox/gotchas.json`. Its local branch is `master` while the tracked remote branch is `origin/main`, so pushes need the mapped refspec `git push origin master:main`.

**Why:** The project was set up outside the AIOX framework, and the local/remote branch names diverged at creation. Vercel builds from `main`, so anything pushed there deploys.

**How to apply:** Skip the AIOX context-loading steps (gotchas, technical-preferences, core-config, repos.yaml) when running missions here — those files do not exist. For pushes, use the mapped refspec rather than a plain `git push`. Alan's "`git push -f origin main`" rule is for the /app Vercel repo; here a normal fast-forward push has been the correct call, so do not reach for `-f` unless the history has actually diverged.

Related: [[git-push-authority-hook]]
