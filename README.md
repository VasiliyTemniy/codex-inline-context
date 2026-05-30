# Codex Inline Context

Codex Inline Context is a small VS Code extension for people who want selected code ranges to be visible in the prompt itself.

It can call Codex's native `chatgpt.addToThread` command for the selected range, then also prepare an inline reference like:

`@src/example.ts#120-138`

The goal is simple: make intent visible, not hidden only in attached context chips.
