# Codex Inline Context

Codex Inline Context is a small VS Code extension for people who want selected code ranges to be visible in the prompt itself.

It calls Codex's native `chatgpt.addToThread` command for the selected range, then copies an inline reference like:

`@src/example.ts#120-138`

The goal is simple: make intent visible, not hidden only in attached context chips.

## Commands

- `Codex Inline Context: Add Selection`: adds the selected range to Codex context and copies the inline reference.
- `Codex Inline Context: Copy Selection Reference`: copies only the inline reference.

## Default Keybindings

- Windows/Linux: `Ctrl+Alt+L` to add selection, `Ctrl+Alt+C` to copy the reference.
- macOS: `Cmd+Alt+L` to add selection, `Cmd+Alt+C` to copy the reference.

The extension depends on the official OpenAI Codex extension command `chatgpt.addToThread`.
