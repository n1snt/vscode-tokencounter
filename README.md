# vscode-tokencount

A VS Code extension that shows the token count of the active editor file in the status bar using `tiktoken`.

## Features

- Shows token count as `Tokens: <count>` in the status bar.
- Updates on:
  - active editor change
  - document edits
  - save
  - extension configuration change
- Click the status bar item to toggle a detailed output panel.

## Configuration

- `tokenCount.encoding` (string): tiktoken encoding name (default: `cl100k_base`).
- `tokenCount.displayOnRightSide` (boolean): show on right status bar side.
- `tokenCount.showForUntitled` (boolean): include untitled editors.

## Development

```bash
npm install
npm run compile
npm test
```

Press `F5` in VS Code to launch the Extension Development Host.
