# Core Memory — Syntax and Replacement Safety

When doing file updates or replacements using search/replace tools:
- **Always preserve bracket match hygiene**: Carefully verify matching braces `{}` and parentheses `()` inside targeted blocks.
- **Double-check replace chunks**: Ensure no closing block brackets or function signatures are accidentally removed or duplicated during partial replacements.
- **Run build checks**: Always execute a production build to check for syntax correctness right after any change.

# Core Memory — Variable Initialization and Hook Ordering
- **Avoid accessing variables before initialization (Temporal Dead Zone)**: When inserting hooks (like `useEffect` or `useMemo`), make sure you do not reference derived variables (e.g., `normalizedTimelines`) before their declaration in the file. Always use raw state variables (e.g., `timelines`) if the hook is placed above their derivation.

# Core Memory — Import Completeness
- **Always verify imports when introducing new JSX components or hooks**: If a new component (e.g., `CircularProgress`, `Tooltip`, `Skeleton`) is added inside JSX, confirm it is present in the file's import block before saving. The build may succeed (tree-shaking) but the runtime will crash with `ReferenceError: X is not defined`.

# Core Memory — MUI Dialog Child Structure
- **Never place arbitrary JSX outside `DialogTitle`/`DialogContent`/`DialogActions` inside a MUI `<Dialog>`**: MUI Dialog only renders children that are one of those three slots. Placing a `<Box>`, `<Paper>`, or a second `<Dialog>` as a direct sibling inside a `<Dialog>` (after `</DialogActions>`) causes the panel to appear empty or broken at runtime.
- **Correct pattern for sibling Dialogs**: If a component IS a `<Dialog>` (e.g. a panel), and you need to render a second `<Dialog>` (e.g. a confirmation modal) alongside it, wrap both in a React fragment `<>...</>` in the return statement so they are true siblings — not nested.
- **Correct pattern for scrollable danger zones inside a Dialog**: Place the Danger Zone `<Paper>` **inside** `<DialogContent>` with a large `mt` (e.g. `mt: '80vh'`) so the user must scroll to reach it. Do not put it outside `</DialogContent>`.

