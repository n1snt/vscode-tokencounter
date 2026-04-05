import { get_encoding } from "tiktoken";
import type { Tiktoken } from "tiktoken";
import type { TiktokenEncoding } from "tiktoken";

export class TokenCounter {
  private readonly encodingName: TiktokenEncoding;
  private readonly encoder: Tiktoken;

  public constructor(encodingName: TiktokenEncoding) {
    this.encodingName = encodingName;
    this.encoder = get_encoding(encodingName);
  }

  public count(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  public getEncodingName(): TiktokenEncoding {
    return this.encodingName;
  }

  public dispose(): void {
    this.encoder.free();
  }
}

export interface TokenInfo {
  readonly uri: string;
  readonly lineCount: number;
  readonly characterCount: number;
  readonly tokenCount: number;
  readonly encoding: string;
}
