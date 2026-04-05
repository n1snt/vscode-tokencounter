import { encoding_for_model, get_encoding, get_encoding_name_for_model } from "tiktoken";
import type { Tiktoken } from "tiktoken";
import type { TiktokenEncoding } from "tiktoken";
import type { TiktokenModel } from "tiktoken";

export class TokenCounter {
  private readonly source: CounterSource;
  private readonly sourceLabel: string;
  private readonly resolvedEncoding: TiktokenEncoding;
  private readonly encoder: Tiktoken;

  public constructor(source: CounterSource) {
    this.source = source;
    if (source.kind === "encoding") {
      this.sourceLabel = `Encoding: ${source.encoding}`;
      this.resolvedEncoding = source.encoding;
      this.encoder = get_encoding(source.encoding);
      return;
    }

    this.sourceLabel = `Model: ${source.model}`;
    this.resolvedEncoding = get_encoding_name_for_model(source.model);
    this.encoder = encoding_for_model(source.model);
  }

  public count(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  public getSource(): CounterSource {
    return this.source;
  }

  public getSourceLabel(): string {
    return this.sourceLabel;
  }

  public getResolvedEncodingName(): TiktokenEncoding {
    return this.resolvedEncoding;
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
  readonly sourceLabel: string;
  readonly encoding: string;
}

export type CounterSource =
  | {
    readonly kind: "encoding";
    readonly encoding: TiktokenEncoding;
  }
  | {
    readonly kind: "model";
    readonly model: TiktokenModel;
  };
