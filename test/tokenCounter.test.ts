import { strict as assert } from "node:assert";
import { TokenCounter } from "../src/tokenCounter";
import type { TiktokenEncoding } from "tiktoken";
import type { TiktokenModel } from "tiktoken";

describe("TokenCounter", () => {
  it("counts tokens for regular text", () => {
    const counter = new TokenCounter({
      kind: "encoding",
      encoding: "cl100k_base"
    });
    try {
      const count = counter.count("hello world");
      assert.equal(count, 2);
      assert.equal(counter.getResolvedEncodingName(), "cl100k_base");
      assert.equal(counter.getSourceLabel(), "Encoding: cl100k_base");
    } finally {
      counter.dispose();
    }
  });

  it("counts zero tokens for empty input", () => {
    const counter = new TokenCounter({
      kind: "encoding",
      encoding: "cl100k_base"
    });
    try {
      const count = counter.count("");
      assert.equal(count, 0);
    } finally {
      counter.dispose();
    }
  });

  it("supports model-based counting", () => {
    const counter = new TokenCounter({
      kind: "model",
      model: "gpt-4o-mini"
    });
    try {
      const count = counter.count("hello world");
      assert.ok(count > 0);
      assert.equal(counter.getSourceLabel(), "Model: gpt-4o-mini");
    } finally {
      counter.dispose();
    }
  });

  it("throws for an invalid encoding name", () => {
    assert.throws(() => {
      const counter = new TokenCounter({
        kind: "encoding",
        encoding: "this_encoding_does_not_exist" as TiktokenEncoding
      });
      counter.dispose();
    });
  });

  it("throws for an invalid model name", () => {
    assert.throws(() => {
      const counter = new TokenCounter({
        kind: "model",
        model: "this_model_does_not_exist" as TiktokenModel
      });
      counter.dispose();
    });
  });
});
