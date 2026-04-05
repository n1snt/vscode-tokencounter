import * as vscode from "vscode";
import type { TokenCountConfig } from "./config";
import { readConfig, SUPPORTED_ENCODINGS, SUPPORTED_MODELS } from "./config";
import { canTrackDocument } from "./documentGuards";
import { formatTokenCount, renderTokenInfo } from "./format";
import type { CounterSource } from "./tokenCounter";
import { TokenCounter } from "./tokenCounter";
import type { TokenInfo } from "./tokenCounter";

const OUTPUT_CHANNEL_NAME = "Token Count";
const CONFIG_SECTION = "tokenCount";
const COMMAND_TOGGLE_DETAILS = "tokenCount.toggleDetails";
const COMMAND_PICK_COUNTER_SOURCE = "tokenCount.pickCounterSource";

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
  item.command = COMMAND_PICK_COUNTER_SOURCE;
  item.tooltip = "Token Count - Click to choose model or encoding";
  return item;
}

function toCounterSource(config: TokenCountConfig): CounterSource {
  if (config.countingMode === "model") {
    return {
      kind: "model",
      model: config.model
    };
  }

  return {
    kind: "encoding",
    encoding: config.encoding
  };
}

function hasCounterSourceChanged(previous: TokenCountConfig, next: TokenCountConfig): boolean {
  if (previous.countingMode !== next.countingMode) {
    return true;
  }

  if (next.countingMode === "model") {
    return previous.model !== next.model;
  }

  return previous.encoding !== next.encoding;
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
    sourceLabel: tokenCounter.getSourceLabel(),
    encoding: tokenCounter.getResolvedEncodingName()
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

interface CounterActionItem extends vscode.QuickPickItem {
  readonly action:
    | { readonly kind: "showDetails" }
    | { readonly kind: "useEncoding"; readonly encoding: (typeof SUPPORTED_ENCODINGS)[number] }
    | { readonly kind: "useModel"; readonly model: (typeof SUPPORTED_MODELS)[number] };
}

function buildCounterSourceItems(config: TokenCountConfig): CounterActionItem[] {
  const showDetailsItem: CounterActionItem = {
    label: "$(list-selection) Show Detailed Info",
    description: "Open token details for current file",
    action: { kind: "showDetails" }
  };

  const encodingItems: CounterActionItem[] = SUPPORTED_ENCODINGS.map((encoding) => {
    const isSelected = config.countingMode === "encoding" && config.encoding === encoding;
    return {
      label: isSelected ? `$(check) Encoding: ${encoding}` : `Encoding: ${encoding}`,
      description: "Count using direct encoding",
      action: {
        kind: "useEncoding",
        encoding
      }
    };
  });

  const modelItems: CounterActionItem[] = SUPPORTED_MODELS.map((model) => {
    const isSelected = config.countingMode === "model" && config.model === model;
    return {
      label: isSelected ? `$(check) Model: ${model}` : `Model: ${model}`,
      description: "Count using model mapping",
      action: {
        kind: "useModel",
        model
      }
    };
  });

  return [
    showDetailsItem,
    { label: "Encodings", kind: vscode.QuickPickItemKind.Separator, action: { kind: "showDetails" } },
    ...encodingItems,
    { label: "Models", kind: vscode.QuickPickItemKind.Separator, action: { kind: "showDetails" } },
    ...modelItems
  ];
}

async function applyCounterSelection(selection: CounterActionItem): Promise<void> {
  if (selection.action.kind === "showDetails") {
    return;
  }

  const configuration = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const target = vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  if (selection.action.kind === "useEncoding") {
    await configuration.update("countingMode", "encoding", target);
    await configuration.update("encoding", selection.action.encoding, target);
    return;
  }

  await configuration.update("countingMode", "model", target);
  await configuration.update("model", selection.action.model, target);
}

async function pickCounterSource(state: ExtensionState): Promise<void> {
  const picked = await vscode.window.showQuickPick(buildCounterSourceItems(state.config), {
    title: "Token Count Source",
    placeHolder: "Choose model-based or encoding-based token counting"
  });
  if (picked === undefined) {
    return;
  }

  if (picked.action.kind === "showDetails") {
    toggleDetails(state);
    return;
  }

  await applyCounterSelection(picked);
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

  if (hasCounterSourceChanged(previous, next)) {
    state.tokenCounter.dispose();
    state.tokenCounter = new TokenCounter(toCounterSource(next));
  }

  updateFromActiveEditor(state);
}

export function activate(context: vscode.ExtensionContext): void {
  const config = readConfig();
  const state: ExtensionState = {
    config,
    statusBarItem: createStatusBarItem(config),
    outputChannel: vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME),
    tokenCounter: new TokenCounter(toCounterSource(config)),
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
    vscode.commands.registerCommand(COMMAND_PICK_COUNTER_SOURCE, async () => {
      await pickCounterSource(state);
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
