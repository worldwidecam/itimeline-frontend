# Core Memory — Syntax and Replacement Safety

When doing file updates or replacements using search/replace tools:
- **Always preserve bracket match hygiene**: Carefully verify matching braces `{}` and parentheses `()` inside targeted blocks.
- **Double-check replace chunks**: Ensure no closing block brackets or function signatures are accidentally removed or duplicated during partial replacements.
- **Run build checks**: Always execute a production build to check for syntax correctness right after any change.

# Core Memory — Variable Initialization and Hook Ordering
- **Avoid accessing variables before initialization (Temporal Dead Zone)**: When inserting hooks (like `useEffect` or `useMemo`), make sure you do not reference derived variables (e.g., `normalizedTimelines`) before their declaration in the file. Always use raw state variables (e.g., `timelines`) if the hook is placed above their derivation.

