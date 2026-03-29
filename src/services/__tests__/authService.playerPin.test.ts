import { describe, it, expect } from "vitest";
import { hashPin, verifyPlayerPin } from "../authService.js";
import { makePlayer } from "../../test/fixtures.js";

describe("verifyPlayerPin", () => {
  it("returns true for a correct 4-digit PIN", async () => {
    const hash = await hashPin("1234", 1);
    const player = makePlayer({ playerPin: hash });
    expect(await verifyPlayerPin("1234", player)).toBe(true);
  });

  it("returns false for an incorrect PIN", async () => {
    const hash = await hashPin("1234", 1);
    const player = makePlayer({ playerPin: hash });
    expect(await verifyPlayerPin("9999", player)).toBe(false);
  });

  it("returns false when player has no playerPin", async () => {
    const player = makePlayer();
    expect(await verifyPlayerPin("1234", player)).toBe(false);
  });

  it("returns false for empty string against a hash", async () => {
    const hash = await hashPin("1234", 1);
    const player = makePlayer({ playerPin: hash });
    expect(await verifyPlayerPin("", player)).toBe(false);
  });
});
