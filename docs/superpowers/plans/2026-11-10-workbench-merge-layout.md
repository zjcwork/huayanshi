# Workbench Sampling and Matching Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the sampling/matching tabs and show sampling progress, repair overdue, matching progress, and inspection overdue together in the approved paired layout.

**Architecture:** `Workbench` owns the shared team and refresh state, and renders one responsive operations grid. `DyeMatchingOverview` remains a focused child that produces the two matching cards, but consumes the parent's team instead of maintaining a second team selector.

**Tech Stack:** React 19, TypeScript, Ant Design 5, CSS Grid, Node test runner, Vite

**Spec:** `docs/superpowers/specs/2026-11-10-workbench-merge-layout-design.md`

## Global Constraints

- Preserve the existing “变更” and “待办事项” first row.
- Desktop operations rows use approximately `60% / 40%` progress-to-overdue columns.
- At widths of `850px` or less, order the cards as “打样进度 → 回修超时 → 对样进度 → 半检超时” with no page-level horizontal scroll.
- Use one shared team selection and one shared refresh action for all four cards.
- Do not change data calculations, backend interfaces, bottom statistics, or navigation behavior.
- Do not add dependencies.
- Do not commit automatically because the current worktree contains pre-existing user changes.

## Review Focus

- “全部班组” and named teams must update both sampling and matching cards with the same team value.
- Matching records with unavailable metrics must continue to render “—”.
- Empty repair and inspection overdue lists must retain their current empty states.
- At `820px` viewport width, the four cards must be single-column and the page must not scroll horizontally.
- Refreshing from the visible refresh action must update sampling items, matching records, and the current time together.

---

### Task 1: Pin the merged information architecture

**Files:**
- Create: `tests/workbench-layout.test.mjs`
- Modify: `src/Workbench.tsx`
- Modify: `src/DyeMatchingOverview.tsx`

**Interfaces:**
- Consumes: `Workbench` state `team`, `items`, `matchingRecords`, and `now`.
- Produces: `DyeMatchingOverview({records, items, now, team})` returning the matching progress and inspection overdue cards as sibling grid items.

- [ ] **Step 1: Write the failing structure test**

Add Node tests that read `src/Workbench.tsx` and `src/DyeMatchingOverview.tsx` and assert:

```js
assert.doesNotMatch(workbench, /<Tabs|overviewTab|label:'对样'/);
assert.match(workbench, /className="workbench-operations-grid"/);
assert.match(workbench, /<DyeMatchingOverview[^>]*team=\{team\}/);
assert.doesNotMatch(matching, /useState\(currentTeam\)|<Select|onRefresh/);
```

Also assert source ordering: `打样进度` before `回修超时`, the matching component before the statistics grid, and the matching component exposes `班组对样进度` before `半检超时`.

- [ ] **Step 2: Run the new test and verify failure**

Run: `node --test tests/workbench-layout.test.mjs`

Expected: FAIL because tabs, the independent matching team state, and the old conditional rendering still exist.

- [ ] **Step 3: Implement the shared workbench structure**

In `src/Workbench.tsx`, remove `Tabs`, `overviewTab`, and conditional tab content. Add `div.workbench-operations-grid` containing the existing sampling progress and repair overdue sections followed by `<DyeMatchingOverview records={matchingRecords} items={items} now={now} team={team}/>`.

In `src/DyeMatchingOverview.tsx`, change the props to `{records: Record<string, MatchingRecord>; items: WorkItem[]; now: number; team: string}`. Remove its local team state, `Select`, refresh control, wrapper grid, and unused imports. Return the two existing cards as a fragment so they participate directly in the parent grid.

- [ ] **Step 4: Run the structure test**

Run: `node --test tests/workbench-layout.test.mjs`

Expected: PASS.

### Task 2: Implement responsive paired layout

**Files:**
- Modify: `src/workbench-overview.css`
- Modify: `tests/workbench-layout.test.mjs`

**Interfaces:**
- Consumes: `.workbench-operations-grid` and its four direct panel children.
- Produces: desktop `minmax(0, 1.5fr) minmax(0, 1fr)` layout and mobile single-column layout at `850px`.

- [ ] **Step 1: Extend the failing CSS contract test**

Read `src/workbench-overview.css` and assert:

```js
assert.match(css, /\.workbench-operations-grid\s*\{[^}]*grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\)/s);
assert.match(css, /@media\(max-width:850px\)[\s\S]*\.workbench-operations-grid\s*\{[^}]*grid-template-columns:1fr/s);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/workbench-layout.test.mjs`

Expected: FAIL because the approved operations grid styles do not exist.

- [ ] **Step 3: Add the responsive grid styles**

Add `.workbench-operations-grid` with a two-column `1.5fr / 1fr` grid, `16px` gap, stretch alignment, and `min-width: 0` handling for children. At `max-width: 850px`, switch to `grid-template-columns: 1fr`. Remove or neutralize obsolete tab-only and `.dye-matching-overview` layout rules that can affect the merged layout, while retaining the table, empty-state, and card-specific styles used by the two matching cards.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/workbench-layout.test.mjs`

Expected: PASS.

### Task 3: Verify behavior and presentation

**Files:**
- Modify only if verification reveals a defect in the files above.

**Interfaces:**
- Consumes: completed merged workbench.
- Produces: buildable application with verified desktop and narrow-screen behavior.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Verify desktop layout at approximately `1838px` width**

Confirm the tabs are gone, the first operational row is “打样进度 / 回修超时”, the second is “对样进度 / 半检超时”, and the bottom statistics are unchanged.

- [ ] **Step 4: Verify narrow layout at `820px` width**

Confirm the four operational cards appear in the approved single-column order and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

- [ ] **Step 5: Verify shared controls**

Change the team selector and confirm all four cards use the same team scope; use refresh and confirm no errors or duplicated controls appear.
