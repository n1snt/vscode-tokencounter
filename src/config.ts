import * as vscode from "vscode";
import type { TiktokenEncoding } from "tiktoken";
import type { TiktokenModel } from "tiktoken";

export interface TokenCountConfig {
  readonly countingMode: CountingMode;
  readonly encoding: TiktokenEncoding;
  readonly model: TiktokenModel;
  readonly debounceMs: number;
  readonly largeFileDebounceMs: number;
  readonly largeFileCharThreshold: number;
  readonly showForUntitled: boolean;
  readonly displayOnRightSide: boolean;
}

export type CountingMode = "encoding" | "model";

const CONFIG_SECTION = "tokenCount";
const DEFAULT_ENCODING: TiktokenEncoding = "cl100k_base";
const DEFAULT_MODEL: TiktokenModel = "gpt-4o-mini";
const DEFAULT_COUNTING_MODE: CountingMode = "encoding";
const DEFAULT_DEBOUNCE_MS = 120;
const DEFAULT_LARGE_FILE_DEBOUNCE_MS = 450;
const DEFAULT_LARGE_FILE_CHAR_THRESHOLD = 60000;

export const SUPPORTED_ENCODINGS: readonly TiktokenEncoding[] = [
  "gpt2",
  "r50k_base",
  "p50k_base",
  "p50k_edit",
  "cl100k_base",
  "o200k_base"
];

export const SUPPORTED_MODELS: readonly TiktokenModel[] = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
  "o3-mini",
  "o4-mini",
  "gpt-5-mini",
  "gpt-5"
];

const SUPPORTED_ENCODINGS_SET: ReadonlySet<string> = new Set<string>([
  ...SUPPORTED_ENCODINGS
]);
const SUPPORTED_MODELS_SET: ReadonlySet<string> = new Set<string>([
  ...SUPPORTED_MODELS
]);

function asBoolean(input: unknown, fallback: boolean): boolean {
  return typeof input === "boolean" ? input : fallback;
}

function asPositiveInteger(input: unknown, fallback: number): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return fallback;
  }

  const rounded = Math.round(input);
  return rounded > 0 ? rounded : fallback;
}

function toCountingMode(input: unknown, fallback: CountingMode): CountingMode {
  if (input === "encoding" || input === "model") {
    return input;
  }

  return fallback;
}

function toEncoding(input: unknown, fallback: TiktokenEncoding): TiktokenEncoding {
  if (typeof input !== "string") {
    return fallback;
  }

  const normalized = input.trim();
  if (!SUPPORTED_ENCODINGS_SET.has(normalized)) {
    return fallback;
  }

  return normalized as TiktokenEncoding;
}

function toModel(input: unknown, fallback: TiktokenModel): TiktokenModel {
  if (typeof input !== "string") {
    return fallback;
  }

  const normalized = input.trim();
  if (!SUPPORTED_MODELS_SET.has(normalized)) {
    return fallback;
  }

  return normalized as TiktokenModel;
}

export function readConfig(): TokenCountConfig {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

  return {
    countingMode: toCountingMode(config.get("countingMode"), DEFAULT_COUNTING_MODE),
    encoding: toEncoding(config.get("encoding"), DEFAULT_ENCODING),
    model: toModel(config.get("model"), DEFAULT_MODEL),
    debounceMs: asPositiveInteger(config.get("debounceMs"), DEFAULT_DEBOUNCE_MS),
    largeFileDebounceMs: asPositiveInteger(config.get("largeFileDebounceMs"), DEFAULT_LARGE_FILE_DEBOUNCE_MS),
    largeFileCharThreshold: asPositiveInteger(
      config.get("largeFileCharThreshold"),
      DEFAULT_LARGE_FILE_CHAR_THRESHOLD
    ),
    displayOnRightSide: asBoolean(config.get("displayOnRightSide"), false),
    showForUntitled: asBoolean(config.get("showForUntitled"), true)
  };
}
