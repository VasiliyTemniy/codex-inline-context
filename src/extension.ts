import * as vscode from 'vscode';

const CODEX_ADD_TO_THREAD_COMMAND = 'chatgpt.addToThread';
const CODEX_OPEN_SIDEBAR_COMMAND = 'chatgpt.openSidebar';
const CODEX_PRIMARY_VIEW_FOCUS_COMMAND = 'chatgpt.sidebarView.focus';
const CODEX_SECONDARY_VIEW_FOCUS_COMMAND = 'chatgpt.sidebarSecondaryView.focus';
const PASTE_COMMAND = 'editor.action.clipboardPasteAction';
const TYPE_COMMAND = 'type';
const CODEX_FOCUS_SETTLE_DELAY_MS = 0;

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

  let attemptedInlineInsert = false;

  if (addedToThread) {
    attemptedInlineInsert = await insertReferenceIntoCodexComposer(reference);
  }

  const message = addedToThread
    ? getAddSelectionMessage(
      reference,
      attemptedInlineInsert,
    )
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

async function insertReferenceIntoCodexComposer(reference: string): Promise<boolean> {
  await nextTick();
  await executeBestEffortCommand(CODEX_OPEN_SIDEBAR_COMMAND);
  await executeBestEffortCommand(CODEX_SECONDARY_VIEW_FOCUS_COMMAND);
  await executeBestEffortCommand(CODEX_PRIMARY_VIEW_FOCUS_COMMAND);
  await sleep(CODEX_FOCUS_SETTLE_DELAY_MS);

  const pasted = await executeBestEffortCommand(PASTE_COMMAND);

  if (pasted) {
    return true;
  }

  return executeBestEffortCommand(TYPE_COMMAND, { text: reference });
}

function getAddSelectionMessage(
  reference: string,
  attemptedInlineInsert: boolean,
): string {
  if (attemptedInlineInsert) {
    return `Added to Codex context, copied ${reference}, and attempted inline insert`;
  }

  return `Added to Codex context and copied ${reference}`;
}

async function executeBestEffortCommand(
  command: string,
  args?: unknown,
): Promise<boolean> {
  try {
    if (args === undefined) {
      await vscode.commands.executeCommand(command);
    } else {
      await vscode.commands.executeCommand(command, args);
    }

    return true;
  } catch {
    return false;
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds,
    );
  });
}

function nextTick(): Promise<void> {
  return sleep(0);
}
