# Project System Directives

## Autocommit Rule

**Status: Active** - All agents must follow this rule.

You must strictly adhere to the "Autocommit" workflow:

1. Whenever you successfully create, modify, or delete any file, and your current operational step is complete, you must immediately back up your changes to GitHub.
2. Use your terminal tools within the current working directory to execute the following sequence:
   - `git add .`
   - `git commit -m "Autocommit: [Brief description of your specific changes]"`
   - `git push origin main`
3. If the Git repository is not yet initialized in the current directory, handle the setup completely autonomously:
   - Run `git init` and `git branch -M main`.
   - Use the GitHub CLI to create the repository via `gh repo create`. Use appropriate flags (e.g., `--public --source=. --remote=origin --push`) to ensure it runs completely headless and non-interactively.

---

_Last updated: 2026-05-16 by FrontendDev_
