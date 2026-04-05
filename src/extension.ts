import * as vscode from "vscode";
import type { TokenCountConfig } from "./config";
import { readConfig } from "./config";
import { canTrackDocument } from "./documentGuards";
import { formatTokenCount, renderTokenInfo } from "./format";
import { TokenCounter } from "./tokenCounter";
import type { TokenInfo } from "./tokenCounter";

const OUTPUT_CHANNEL_NAME = "Token Count";
const COMMAND_TOGGLE_DETAILS = "tokenCount.toggleDetails";

interface ExtensionState {
  statusBarItem: vscode.StatusBarItem;
  outputChannel: vscode.OutputChannel;
  tokenCounter: TokenCounter;
  config: TokenCountConfig;
  latestInfo: TokenInfo | null;
  isShowingDetails: boolean;
}
function createStatusBarItem(config: TokenCountConfig): vscode.StatusBarItem {
  const alignment = config.displayOnRightSide ? vscode.StatusBarAlignment.Right : vscode.StatusBarAlignment.Left;
  const item = vscode.window.createStatusBarItem(alignment, 1);
  item.command = COMMAND_TOGGLE_DETAILS;
  item.tooltip = "Token Count - Click to toggle detailed information";
  return item;
}

function computeInfo(
  document: vscode.TextDocument,
  tokenCounter: TokenCounter
): TokenInfo {
  const text = document.getText();
  return {
    uri: document.isUntitled ? document.uri.toString() : document.fileName,
    lineCount: document.lineCount,
    characterCount: text.length,
    tokenCount: tokenCounter.count(text),
    encoding: tokenCounter.getEncodingName()
  };
}

function renderDetails(outputChannel: vscode.OutputChannel, info: TokenInfo): void {
  outputChannel.clear();
  for (const line of renderTokenInfo(info)) {
    outputChannel.appendLine(line);
  }
}

function hideAll(state: ExtensionState): void {
  state.statusBarItem.hide();
  if (state.isShowingDetails) {
    state.outputChannel.hide();
    state.isShowingDetails = false;
  }
}

function showStatusBarInfo(state: ExtensionState, info: TokenInfo): void {
  state.statusBarItem.text = `Tokens: ${formatTokenCount(info.tokenCount)}`;
  state.statusBarItem.show();
}

function updateFromActiveEditor(state: ExtensionState): void {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor === undefined) {
    state.latestInfo = null;
    hideAll(state);
    return;
  }

  const { document } = activeEditor;
  if (!canTrackDocument(document, state.config.showForUntitled)) {
    state.latestInfo = null;
    hideAll(state);
    return;
  }

  const info = computeInfo(document, state.tokenCounter);
  state.latestInfo = info;
  showStatusBarInfo(state, info);

  if (state.isShowingDetails) {
    renderDetails(state.outputChannel, info);
  }
}

function toggleDetails(state: ExtensionState): void {
  if (state.isShowingDetails) {
    state.outputChannel.hide();
    state.isShowingDetails = false;
    return;
  }

  if (state.latestInfo === null) {
    state.outputChannel.clear();
    state.outputChannel.appendLine("No token information is available for this context.");
    state.outputChannel.show(true);
    state.isShowingDetails = true;
    return;
  }

  renderDetails(state.outputChannel, state.latestInfo);
  state.outputChannel.show(true);
  state.isShowingDetails = true;
}

function reloadConfig(state: ExtensionState): void {
  const previous = state.config;
  const next = readConfig();
  state.config = next;

  if (previous.displayOnRightSide !== next.displayOnRightSide) {
    state.statusBarItem.hide();
    state.statusBarItem.dispose();
    state.statusBarItem = createStatusBarItem(next);
  }

  if (previous.encoding !== next.encoding) {
    state.tokenCounter.dispose();
    state.tokenCounter = new TokenCounter(next.encoding);
  }

  updateFromActiveEditor(state);
}

export function activate(context: vscode.ExtensionContext): void {
  const config = readConfig();
  const state: ExtensionState = {
    config,
    statusBarItem: createStatusBarItem(config),
    outputChannel: vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME),
    tokenCounter: new TokenCounter(config.encoding),
    latestInfo: null,
    isShowingDetails: false
  };

  const subscriptions: vscode.Disposable[] = [
    state.statusBarItem,
    state.outputChannel,
    vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration("tokenCount")) {
        reloadConfig(state);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor !== undefined && event.document.uri.toString() === activeEditor.document.uri.toString()) {
        updateFromActiveEditor(state);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateFromActiveEditor(state);
    }),
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor !== undefined && document.uri.toString() === activeEditor.document.uri.toString()) {
        updateFromActiveEditor(state);
      }
    }),
    vscode.commands.registerCommand(COMMAND_TOGGLE_DETAILS, () => {
      toggleDetails(state);
    }),
    new vscode.Disposable(() => {
      state.tokenCounter.dispose();
    })
  ];

  for (const disposable of subscriptions) {
    context.subscriptions.push(disposable);
  }

  updateFromActiveEditor(state);
}

export function deactivate(): void {
  // No-op. VS Code disposes subscriptions from activate().
}
