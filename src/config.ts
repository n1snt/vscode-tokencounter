import * as vscode from "vscode";
import type { TiktokenEncoding } from "tiktoken";

export interface TokenCountConfig {
  readonly encoding: TiktokenEncoding;
  readonly showForUntitled: boolean;
  readonly displayOnRightSide: boolean;
}

const CONFIG_SECTION = "tokenCount";
const DEFAULT_ENCODING: TiktokenEncoding = "cl100k_base";
const SUPPORTED_ENCODINGS: ReadonlySet<string> = new Set<string>([
  "gpt2",
  "r50k_base",
  "p50k_base",
  "p50k_edit",
  "cl100k_base",
  "o200k_base"
]);

function asBoolean(input: unknown, fallback: boolean): boolean {
  return typeof input === "boolean" ? input : fallback;
}

function toEncoding(input: unknown, fallback: TiktokenEncoding): TiktokenEncoding {
  if (typeof input !== "string") {
    return fallback;
  }

  const normalized = input.trim();
  if (!SUPPORTED_ENCODINGS.has(normalized)) {
    return fallback;
  }

  return normalized as TiktokenEncoding;
}

export function readConfig(): TokenCountConfig {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

  return {
    encoding: toEncoding(config.get("encoding"), DEFAULT_ENCODING),
    displayOnRightSide: asBoolean(config.get("displayOnRightSide"), false),
    showForUntitled: asBoolean(config.get("showForUntitled"), true)
  };
}
