import { strict as assert } from "node:assert";
import { canTrackDocument } from "../src/documentGuards";

describe("canTrackDocument", () => {
  it("accepts file scheme documents", () => {
    const result = canTrackDocument(
      {
        isUntitled: false,
        uri: { scheme: "file" }
      },
      false
    );

    assert.equal(result, true);
  });

  it("rejects non-file scheme documents", () => {
    const result = canTrackDocument(
      {
        isUntitled: false,
        uri: { scheme: "git" }
      },
      true
    );

    assert.equal(result, false);
  });

  it("respects showForUntitled config", () => {
    const allowed = canTrackDocument(
      {
        isUntitled: true,
        uri: { scheme: "untitled" }
      },
      true
    );
    const blocked = canTrackDocument(
      {
        isUntitled: true,
        uri: { scheme: "untitled" }
      },
      false
    );

    assert.equal(allowed, true);
    assert.equal(blocked, false);
  });
});
