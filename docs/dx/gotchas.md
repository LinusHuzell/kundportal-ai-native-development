# Development Gotchas

## Line endings

Use LF line endings across the repository so diffs stay consistent between Windows, macOS and Linux. The root `.gitattributes` normalizes text files to LF in Git and on checkout. The root `.editorconfig` asks compatible editors to use LF; the backend has its own `.editorconfig`, so it repeats the setting there.

When applying this policy to already tracked files, run `git add --renormalize .` and review the staged diff before committing. No per-developer `core.autocrlf` setting is required.