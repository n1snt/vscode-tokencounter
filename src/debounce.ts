import type { TokenCountConfig } from "./config";

export function getDebounceDelayMs(
  characterCount: number,
  config: Pick<TokenCountConfig, "debounceMs" | "largeFileDebounceMs" | "largeFileCharThreshold">
): number {
  return characterCount >= config.largeFileCharThreshold
    ? config.largeFileDebounceMs
    : config.debounceMs;
}
