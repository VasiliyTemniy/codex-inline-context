import * as vscode from 'vscode';

const CODEX_ADD_TO_THREAD_COMMAND = 'chatgpt.addToThread';
const CODEX_OPEN_SIDEBAR_COMMAND = 'chatgpt.openSidebar';
const CODEX_PRIMARY_VIEW_FOCUS_COMMAND = 'chatgpt.sidebarView.focus';
const CODEX_SECONDARY_VIEW_FOCUS_COMMAND = 'chatgpt.sidebarSecondaryView.focus';
const PASTE_COMMAND = 'editor.action.clipboardPasteAction';
const TYPE_COMMAND = 'type';
const CODEX_FOCUS_SETTLE_DELAY_MS = 0;
const CONFIG_SECTION = 'codexInlineContext';

type InlineTextMode = 'chipHint' | 'atReference';

interface SelectionReference {
  readonly inlineText: string;
  readonly pathWithRange: string;
}

let outputChannel: vscode.OutputChannel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Codex Inline Context');

  context.subscriptions.push(
    outputChannel,
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
    warn('Select a range in a saved file first.');
    return;
  }

  let addedToThread = true;

  try {
    await vscode.commands.executeCommand(CODEX_ADD_TO_THREAD_COMMAND);
  } catch {
    addedToThread = false;
    warn('Codex add-to-thread command was unavailable.');
  }

  await vscode.env.clipboard.writeText(reference.inlineText);
  debug(`Copied inline text: ${reference.inlineText}`);

  let attemptedInlineInsert = false;

  if (addedToThread) {
    attemptedInlineInsert = await insertReferenceIntoCodexComposer(
      reference.inlineText,
    );
  }

  notifyDebug(
    getAddSelectionMessage(
      reference.inlineText,
      addedToThread,
      attemptedInlineInsert,
    ),
  );
}

async function copySelectionRef(): Promise<void> {
  const reference = getActiveSelectionReference();

  if (!reference) {
    warn('Select a range in a saved file first.');
    return;
  }

  await vscode.env.clipboard.writeText(reference.inlineText);
  debug(`Copied inline text: ${reference.inlineText}`);
  notifyDebug(`Copied ${reference.inlineText}`);
}

function getActiveSelectionReference(): SelectionReference | undefined {
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
  const pathWithRange = `${relativePath}#${rangeFragment}`;

  return {
    inlineText: formatInlineText(pathWithRange),
    pathWithRange,
  };
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

function formatInlineText(pathWithRange: string): string {
  const mode = getInlineTextMode();

  if (mode === 'atReference') {
    return `@${pathWithRange}`;
  }

  return `(see Codex context chip: ${pathWithRange})`;
}

function getInlineTextMode(): InlineTextMode {
  return getConfig().get<InlineTextMode>(
    'inlineTextMode',
    'chipHint',
  );
}

function getAddSelectionMessage(
  inlineText: string,
  addedToThread: boolean,
  attemptedInlineInsert: boolean,
): string {
  if (!addedToThread) {
    return `Copied ${inlineText}; Codex add-to-thread command was unavailable.`;
  }

  if (attemptedInlineInsert) {
    return `Added Codex context chip and attempted inline insert: ${inlineText}`;
  }

  return `Added Codex context chip and copied ${inlineText}`;
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

    debug(`Command succeeded: ${command}`);
    return true;
  } catch {
    debug(`Command failed: ${command}`);
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

function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIG_SECTION);
}

function debug(message: string): void {
  if (!getConfig().get<boolean>('debugLogging', false)) {
    return;
  }

  outputChannel?.appendLine(
    `[${new Date().toISOString()}] DEBUG ${message}`,
  );
}

function warn(message: string): void {
  outputChannel?.appendLine(
    `[${new Date().toISOString()}] WARN ${message}`,
  );
}

function notifyDebug(message: string): void {
  debug(message);

  if (!getConfig().get<boolean>('debugNotifications', false)) {
    return;
  }

  void vscode.window.showInformationMessage(message);
}
