# Memory Index

- [Git push authority hook](feedback_git_push_authority_hook.md) — never prefix push with AIOX_ACTIVE_AGENT; the hook trusts only the runtime agent_type
- [Repo setup](project_repo_setup.md) — no AIOX scaffolding here; local `master` tracks `origin/main`, push with `master:main`
- [Push toolchain](feedback_push_toolchain.md) — GitHub MCP write 403s; use gh/git CLI, set repo-local identity, push from a throwaway clone
- [Vercel prod deploy](project_vercel_deploy.md) — `.vercel` has repo.json not project.json; `vercel --prod --yes`, alias emeu-podeserseu.vercel.app
