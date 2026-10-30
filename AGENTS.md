# Project workflow

## GitHub checkpoints
The owner requests a GitHub commit and push after each completed module or section.
- Complete the requested changes and run relevant verification first.
- Review the diff and commit only the related source, tests, and documentation with a descriptive message.
- Push the commit to the current task branch on origin and verify that the remote branch contains it. Use codex/ for any new task branch.
- Do not force-push, overwrite remote changes, or commit credentials, environment files, uploaded records, local logs, temporary deployment scripts, or generated screenshots.
- Keep unrelated working-tree changes intact. Do not stage the whole workspace blindly.
- Report the branch and commit after each push. If authentication or branch protection blocks a push, report the exact blocker; never claim the push succeeded.
- This workflow applies while working on the project; it does not install a background file watcher or push unfinished edits.
