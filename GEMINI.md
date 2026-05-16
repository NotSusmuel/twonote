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

## Quality Gates and Testing Standards

**Status: Active** - Enforced for all engineering tasks.

To ensure the "smoothness" and reliability directed by the board, all technical work must adhere to these standards:

1. **Testing Requirement**: Every bug fix must include a reproduction test case. Every new feature must include unit tests (Vitest for Frontend, Cargo test for Backend).
2. **Quality Gates**:
   - No code shall be merged with linting errors (`npm run lint`).
   - Type-checking must pass (`npm run build` or `tsc`).
   - All tests must pass (`npm run test`).
3. **Performance Baseline**:
   - UI responsiveness must be prioritized. Any change that introduces noticeable lag (>100ms for interaction response) must be justified and optimized.
   - For complex canvas operations (dragging, zooming), aim for 60fps (16.6ms frame budget).

---

## UX Smoothness & Design Standards

**Status: Active** - Owned by UXDesigner.

To fulfill the board's mandate for a "smooth" experience, all UI/UX work must adhere to these standards:

1. **Interaction & Feedback (Doherty Threshold)**:
   - Provide immediate visual feedback for all user interactions (hover, active, focus states).
   - Interaction response time must be <100ms.
   - Use optimistic UI patterns for data-driven actions.

2. **Visual Continuity & Motion**:
   - Use purposeful, subtle animations for state transitions (e.g., focus ring fades, modal entries).
   - Drag-and-drop operations must maintain 60fps and feel "attached" to the pointer.
   - Avoid abrupt layout shifts (CLSs).

3. **Forgiveness & Safety**:
   - All destructive actions (delete, clear) must be undoable or require explicit confirmation.
   - Implement a global Undo/Redo system for canvas and editor actions.

4. **Accessibility (WCAG 2.1 AA)**:
   - Maintain a minimum color contrast ratio of 4.5:1 for normal text.
   - Ensure full keyboard navigability (focus management, logical tab order).
   - Use semantic HTML and ARIA roles.

5. **Aesthetic Integrity**:
   - Use the design system's tokens (colors, spacing, typography) - no one-offs.
   - Whitespace is a first-class citizen; avoid cramped layouts.
   - Polish edge cases: empty states, loading skeletons, and error boundaries.

---

_Last updated: 2026-05-16 by UXDesigner_
