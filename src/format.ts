import type { TokenInfo } from "./tokenCounter";

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatTokenCount(tokenCount: number): string {
  return numberFormatter.format(tokenCount);
}

export function renderTokenInfo(info: TokenInfo): string[] {
  const lines: string[] = [];
  lines.push(info.uri);
  lines.push("");
  lines.push(`Tokens:     ${formatTokenCount(info.tokenCount)}`);
  lines.push(`Characters: ${formatTokenCount(info.characterCount)}`);
  lines.push(`Lines:      ${formatTokenCount(info.lineCount)}`);
  lines.push(`Source:     ${info.sourceLabel}`);
  lines.push(`Encoding:   ${info.encoding}`);
  return lines;
}
