---
name: vercel-deploy-emeu-podeserseu
description: Deploying this repo to Vercel prod — .vercel has repo.json (not project.json), so use `vercel --prod --yes`; alias is emeu-podeserseu.vercel.app
metadata:
  type: project
---

Production deploys of "Era Meu pode ser seu" go out with `vercel --prod --yes` run from the repo root. The `.vercel/` folder here contains **`repo.json`, not `project.json`** (project `emeu-podeserseu`, org `team_IzZoJX6MmoOS6MI41iJjiqAM`). The CLI resolves the link from `repo.json` fine, so a `vercel link` step is not needed. Deploy ends with `Aliased https://emeu-podeserseu.vercel.app` — that alias is production.

**Why:** Instructions for this project often assume `.vercel/project.json` exists and tell you to run `vercel link --yes --project emeu-podeserseu` when it is missing. That link step is unnecessary here and would be a no-op detour; `--yes` alone covers the non-interactive path. `.vercel` is gitignored (added 2026-08-12), so the link is local-only and will be absent in any fresh clone.

**How to apply:** Skip the link check, go straight to `vercel --prod --yes`. Confirm success by `readyState: READY` + `target: production` in the JSON tail and the `Aliased` line. Then smoke-test the alias with curl on a route the deploy just added — a 200 there proves the alias moved, which the CLI output alone does not. If you deploy from a fresh clone with no `.vercel/`, that is when linking is genuinely required.

Related: [[era-meu-pode-ser-seu-repo-setup]], [[push-toolchain]]
