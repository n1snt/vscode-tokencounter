import { strict as assert } from "node:assert";
import { TokenCounter } from "../src/tokenCounter";
import type { TiktokenEncoding } from "tiktoken";

describe("TokenCounter", () => {
  it("counts tokens for regular text", () => {
    const counter = new TokenCounter("cl100k_base");
    try {
      const count = counter.count("hello world");
      assert.equal(count, 2);
    } finally {
      counter.dispose();
    }
  });

  it("counts zero tokens for empty input", () => {
    const counter = new TokenCounter("cl100k_base");
    try {
      const count = counter.count("");
      assert.equal(count, 0);
    } finally {
      counter.dispose();
    }
  });

  it("throws for an invalid encoding name", () => {
    assert.throws(() => {
      const counter = new TokenCounter("this_encoding_does_not_exist" as TiktokenEncoding);
      counter.dispose();
    });
  });
});
