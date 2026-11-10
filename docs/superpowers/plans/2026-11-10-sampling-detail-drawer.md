# Sampling Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sampling detail drawer's three-tab interface with one continuous Ant Design detail view containing basic information, progress, and formula history.

**Architecture:** Extract the single-page drawer body into a focused `SamplingDetailContent` component so its structure can be rendered and tested independently of the large `Main` component. `main.tsx` continues to own drawer state and all existing actions, while the new component owns information layout and progress presentation.

**Tech Stack:** React 19, TypeScript, Ant Design 5, Day.js, Vite, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-10-sampling-detail-drawer-design.md`

## Global Constraints

- Remove the “大样配方 / 打样过程 / 基础信息” tabs only for non-copy sampling detail drawers.
- Preserve existing formula values, action handlers, audit behavior, and the dedicated copy-history drawer.
- Use the existing Ant Design theme and project component standards; do not change the application shell.
- Keep the drawer width at 80%, use 16px content rhythm, 6px radii, and compact data tables.
- Avoid document-level horizontal overflow at 1590px and 820px widths.

## Review Focus

- Missing optional record fields must render `—` instead of blank or crashing; pin in Task 1 SSR test.
- `进行中`, `待审核`, and completed-like statuses must map to a sensible Steps current index; pin in Task 1 unit assertions.
- Formula actions must remain reachable after tabs are removed; pin in Task 1 SSR test using an injected action node.
- Copy-history drawer must remain unchanged; pin in Task 2 source/integration assertion.
- Narrow drawer content must wrap or scroll internally without widening the document; verify in Task 2 browser checks.

---

### Task 1: Build the single-page detail content

**Files:**
- Create: `src/SamplingDetailContent.tsx`
- Create: `src/sampling-detail-content.css`
- Create: `tests/sampling-detail-content.test.mjs`

**Interfaces:**
- Consumes: `LabRecord` from `src/data.ts`, injected `formulaActions: ReactNode`, and injected `formulaTable: ReactNode`.
- Produces: `SamplingDetailContent({record, detailKind, formulaActions, formulaTable})` and `samplingProgressIndex(status, detailKind): number`.

- [x] **Step 1: Write the failing SSR and progress mapping tests**

Assert rendered markup contains “详情信息”, “订字：”, “基础信息”, “打样进度”, “打样情况”, five progress labels, an injected formula action, injected formula table content, and fallback `—` values; assert no tab roles or old tab labels are present. Assert progress indexes for `待审核`, `进行中`, and `已完成`.

- [x] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/sampling-detail-content.test.mjs`

Expected: FAIL because `SamplingDetailContent.tsx` does not exist.

- [x] **Step 3: Implement `SamplingDetailContent`**

Use `Descriptions`, `Steps`, and semantic sections. The five steps are `订单审核`, `任务分配`, `打样完成`, `配方提交`, and `配方完成`; timestamps derive from `record.created` and display `—` when unavailable. Place injected actions in the “打样情况” heading and injected formula content below it.

- [x] **Step 4: Add scoped drawer content styling**

Use `.sampling-detail-content` as the root scope. Apply 16px section gaps, 14px/600 section titles with blue marks, compact bordered descriptions, a light progress surface, and internal formula-table overflow. At narrow widths, allow headings/actions to wrap and keep the steps inside the drawer width.

- [x] **Step 5: Run the focused test and verify it passes**

Run: `node --test tests/sampling-detail-content.test.mjs`

Expected: PASS.

### Task 2: Integrate the component and verify the drawer

**Files:**
- Modify: `src/main.tsx:1-20, 166-167, 1676-1825`
- Modify only if browser verification reveals a defect: `src/sampling-detail-content.css`
- Test: `tests/sampling-detail-content.test.mjs`

**Interfaces:**
- Consumes: `SamplingDetailContent` from Task 1.
- Produces: the non-copy drawer single-page UI while leaving `copyDetails()` and copy drawer behavior unchanged.

- [x] **Step 1: Replace the non-copy tab body**

Remove `detailTab` state and the non-copy `Tabs` rendering. Set the non-copy drawer title to `详情信息`, render `SamplingDetailContent`, and inject the existing formula action buttons and `formulaTable(detailKind === "审核")` result.

- [x] **Step 2: Preserve all existing actions**

Keep `查看配方`, `引用减量率`, and `编辑配方` handlers in the “打样情况” heading; keep existing footer branches for audit and non-audit modes without changing callbacks.

- [x] **Step 3: Run the full automated suite**

Run: `npm test`

Expected: all tests pass.

- [x] **Step 4: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build succeed; the existing chunk-size warning is acceptable.

- [x] **Step 5: Verify rendered behavior in Chrome**

At 1590px and 820px widths, open a non-copy sampling detail and confirm: no tabs, all three sections visible, formula actions clickable, footer actions visible, and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. Open a copy-history detail and confirm its existing layout remains unchanged.
