# Core Memory — Syntax and Replacement Safety

When doing file updates or replacements using search/replace tools:
- **Always preserve bracket match hygiene**: Carefully verify matching braces `{}` and parentheses `()` inside targeted blocks.
- **Double-check replace chunks**: Ensure no closing block brackets or function signatures are accidentally removed or duplicated during partial replacements.
- **Run build checks**: Always execute a production build to check for syntax correctness right after any change.
