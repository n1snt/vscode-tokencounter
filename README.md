# vscode-tokencount

A VS Code extension that shows the token count of the active editor file in the status bar using `tiktoken`.

## Features

- Shows token count as `Tokens: <count>` in the status bar.
- Updates on:
  - active editor change
  - document edits
  - save
  - extension configuration change
- Click the status bar item to open a picker and choose:
  - encoding-based counting
  - model-based counting (for example `gpt-4o-mini`)
  - detailed info view

## Configuration

- `tokenCount.countingMode` (string): `encoding` or `model`.
- `tokenCount.encoding` (string): tiktoken encoding name (default: `cl100k_base`).
- `tokenCount.model` (string): tiktoken model name (default: `gpt-4o-mini`).
- `tokenCount.displayOnRightSide` (boolean): show on right status bar side.
- `tokenCount.showForUntitled` (boolean): include untitled editors.
- `tokenCount.debounceMs` (number): typing debounce for regular files (default: `120`).
- `tokenCount.largeFileDebounceMs` (number): typing debounce for large files (default: `450`).
- `tokenCount.largeFileCharThreshold` (number): threshold that triggers large-file debounce (default: `60000`).

## Development

```bash
npm install
npm run compile
npm test
```

Press `F5` in VS Code to launch the Extension Development Host.
