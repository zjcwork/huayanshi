# Workbench Homepage Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the existing project component standards consistently across the sampling-management workbench homepage typography, spacing, cards, tables, and statistics.

**Architecture:** Keep the existing React information architecture and behavior unchanged. Consolidate homepage-specific presentation into final, scoped rules in `workbench-overview.css`, with `sampling-ant-design.css` remaining the shared Ant Design contract; verify the resulting contract through real Chrome computed styles and screenshots.

**Tech Stack:** React 19, TypeScript, Ant Design 5, CSS Grid, Vite, Chrome DevTools Protocol

**Spec:** `docs/superpowers/specs/2026-11-10-workbench-homepage-visual-system-design.md`

## Global Constraints

- Reuse the existing project component standard: 14px module titles, 12px table text, 24px primary numbers, 22px progress numbers, 6px radius, 12px module gap, and 16px card padding.
- Preserve the current navigation, sidebar, homepage section order, data calculations, controls, and click behavior.
- Use only existing Ant Design semantic colors and CSS variables.
- Do not add dependencies or create another theme system.
- Preserve the existing paired desktop layout and the no-horizontal-scroll behavior at 820px.
- Do not commit automatically because the worktree contains pre-existing user changes.

## Review Focus

- Seven todo cards must remain on one desktop row without reducing their labels below 14px or clipping text.
- Long labels such as “预打样订单审核” must remain readable without overlapping their numbers.
- Both progress tables must use the same title, header, row-label, numeric, and row-height hierarchy.
- Both overdue tables must remain readable with long process-card values and red duration text.
- At 820px, card stacks and tables must fit the content viewport without page-level horizontal overflow.

---

### Task 1: Establish the homepage type and surface contract

**Files:**
- Modify: `src/workbench-overview.css`
- Reference: `src/sampling-ant-design.css`

**Interfaces:**
- Consumes: existing `.sampling-ant-design`, `.foreman-workbench`, `.foreman-panel`, and `.foreman-section-title` classes.
- Produces: a scoped homepage foundation for 12px gaps, 6px card radius, 48px section headers, 14px/600 module titles, and Ant semantic colors.

- [ ] **Step 1: Capture the failing computed-style baseline**

Use Chrome at 1838px width and record computed values for the workbench gap, panel radius, section-title height, section-title font size/weight, panel border color, and page background.

Expected: at least the current 16px workbench gap, 10px panel radius, or 15px section title differs from the approved contract.

- [ ] **Step 2: Add the minimal scoped foundation rules**

At the end of `src/workbench-overview.css`, add a single clearly labelled visual-contract section scoped under `.sampling-ant-design .foreman-workbench`. Set:

- workbench and operations gaps to `12px`;
- panel radius to `6px`, border to `#f0f0f0`, shadow to `0 1px 2px rgba(0,0,0,.03)`;
- section title min-height to `48px`, padding to `10px 16px`;
- all module headings to `14px / 22px / 600`;
- secondary title metadata to `12px / 20px`.

- [ ] **Step 3: Verify the foundation in Chrome**

Expected computed values: 12px gap, 6px radius, 48px header, 14px/600 heading, `rgb(240,240,240)` border, and `rgb(245,245,245)` page background.

### Task 2: Normalize todo cards, operational tables, and statistics

**Files:**
- Modify: `src/workbench-overview.css`

**Interfaces:**
- Consumes: Task 1 homepage foundation.
- Produces: uniform todo cards, paired progress/overdue tables, and bottom statistic cards using the approved type scale.

- [ ] **Step 1: Capture failing module measurements**

Use Chrome to record todo label/number/unit sizes; sampling and matching table header/row-label/number sizes and row heights; overdue table text and row heights; statistic title/note/chart-label sizes.

Expected: todo labels are currently approximately 10–11px, section/table rules differ, and at least one statistic helper is below the approved 11–12px range.

- [ ] **Step 2: Normalize change and todo cards**

Set internal card radius to 6px, padding to 12px, todo labels to `14px / 22px / 500`, numbers to `24px / 32px / 600`, units to `12px`, and remove hover translation while retaining border/background/shadow feedback. Preserve red change numbers and neutral todo numbers.

- [ ] **Step 3: Normalize both progress tables**

Apply common selectors to sampling and matching tables: 12px headers/cells, 14px/500 row labels, 22px/600 statistics, 48px data rows, `#fafafa` header/label surfaces, and `#f0f0f0` borders.

- [ ] **Step 4: Normalize both overdue tables**

Use 12px text, 600-weight headers, 44px data rows, semantic red durations, link-colored process cards, and 12px empty-state text. Keep internal vertical scrolling.

- [ ] **Step 5: Normalize bottom statistic cards**

Set 16px card padding, 14px/600 titles, 12px notes, chart labels no smaller than 11px, and one consistent chart height. Limit accents to existing semantic colors.

- [ ] **Step 6: Verify module measurements in Chrome**

Expected: computed values match the spec; all seven todo cards remain in one desktop row; the two progress and two overdue cards have matching internal rhythm.

### Task 3: Verify responsiveness and regression safety

**Files:**
- Modify only if verification reveals a defect in `src/workbench-overview.css`.

**Interfaces:**
- Consumes: completed homepage visual contract.
- Produces: a buildable, responsive homepage with unchanged behavior.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Verify desktop presentation**

At approximately 1838px width, confirm typography hierarchy, seven-card todo row, paired progress/overdue layout, consistent card surfaces, and unchanged bottom statistics content.

- [ ] **Step 4: Verify narrow presentation**

At 820px width, confirm section stacking, readable labels, no clipped controls, and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

- [ ] **Step 5: Compare before and after screenshots**

Confirm the visual change improves hierarchy without changing visible labels, values, actions, or business content.
