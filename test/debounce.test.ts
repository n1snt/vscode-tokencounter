import { strict as assert } from "node:assert";
import { getDebounceDelayMs } from "../src/debounce";

describe("getDebounceDelayMs", () => {
  it("uses normal debounce for small documents", () => {
    const delay = getDebounceDelayMs(1000, {
      debounceMs: 120,
      largeFileDebounceMs: 450,
      largeFileCharThreshold: 60000
    });

    assert.equal(delay, 120);
  });

  it("uses large-file debounce when threshold is reached", () => {
    const delay = getDebounceDelayMs(60000, {
      debounceMs: 120,
      largeFileDebounceMs: 450,
      largeFileCharThreshold: 60000
    });

    assert.equal(delay, 450);
  });
});
