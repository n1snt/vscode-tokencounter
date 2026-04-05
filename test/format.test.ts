import { strict as assert } from "node:assert";
import { formatTokenCount, renderTokenInfo } from "../src/format";
import type { TokenInfo } from "../src/tokenCounter";

describe("format helpers", () => {
  it("formats numbers with separators", () => {
    assert.equal(formatTokenCount(1234567), "1,234,567");
  });

  it("renders token info details in stable order", () => {
    const info: TokenInfo = {
      uri: "/tmp/sample.ts",
      tokenCount: 3210,
      characterCount: 9876,
      lineCount: 123,
      encoding: "cl100k_base"
    };

    const lines = renderTokenInfo(info);

    assert.deepEqual(lines, [
      "/tmp/sample.ts",
      "",
      "Tokens:     3,210",
      "Characters: 9,876",
      "Lines:      123",
      "Encoding:   cl100k_base"
    ]);
  });
});
