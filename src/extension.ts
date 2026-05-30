import * as vscode from 'vscode';

const CODEX_ADD_TO_THREAD_COMMAND = 'chatgpt.addToThread';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'codexInlineContext.addSelection',
      addSelection,
    ),
    vscode.commands.registerCommand(
      'codexInlineContext.copySelectionRef',
      copySelectionRef,
    ),
  );
}

export function deactivate(): void {
}

async function addSelection(): Promise<void> {
  const reference = getActiveSelectionReference();

  if (!reference) {
    void vscode.window.showWarningMessage(
      'Select a range in a saved file first.',
    );
    return;
  }

  let addedToThread = true;

  try {
    await vscode.commands.executeCommand(CODEX_ADD_TO_THREAD_COMMAND);
  } catch {
    addedToThread = false;
  }

  await vscode.env.clipboard.writeText(reference);

  const message = addedToThread
    ? `Added to Codex context and copied ${reference}`
    : `Copied ${reference}; Codex add-to-thread command was unavailable`;

  void vscode.window.showInformationMessage(message);
}

async function copySelectionRef(): Promise<void> {
  const reference = getActiveSelectionReference();

  if (!reference) {
    void vscode.window.showWarningMessage(
      'Select a range in a saved file first.',
    );
    return;
  }

  await vscode.env.clipboard.writeText(reference);
  void vscode.window.showInformationMessage(`Copied ${reference}`);
}

function getActiveSelectionReference(): string | undefined {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return undefined;
  }

  const { document, selection } = editor;

  if (selection.isEmpty || document.isUntitled) {
    return undefined;
  }

  const relativePath = vscode.workspace
    .asRelativePath(document.uri, false)
    .replace(/\\/g, '/');
  const {
    startLine,
    endLine,
  } = getInclusiveSelectedLines(selection);
  const rangeFragment = startLine === endLine
    ? `${startLine}`
    : `${startLine}-${endLine}`;

  return `@${relativePath}#${rangeFragment}`;
}

function getInclusiveSelectedLines(selection: vscode.Selection): {
  startLine: number;
  endLine: number;
} {
  const startLine = selection.start.line + 1;
  let endLine = selection.end.line + 1;

  if (
    selection.end.character === 0
    && selection.end.line > selection.start.line
  ) {
    endLine -= 1;
  }

  return {
    startLine,
    endLine,
  };
}
