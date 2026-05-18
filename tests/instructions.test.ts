import { describe, expect, it } from "vitest";

import { generateInstructionSequence, parseSeed } from "../src/core/instructions.js";

describe("generateInstructionSequence", () => {
    it("generates 320 instruction access records", () => {
        const sequence = generateInstructionSequence(1);

        expect(sequence).toHaveLength(320);
    });

    it("keeps every instruction number in the valid range", () => {
        const sequence = generateInstructionSequence(1);

        expect(sequence.every((item) => item.instructionNumber >= 0)).toBe(true);
        expect(sequence.every((item) => item.instructionNumber <= 319)).toBe(true);
    });

    it("uses stable output for the same seed", () => {
        const firstSequence = generateInstructionSequence(123);
        const secondSequence = generateInstructionSequence(123);

        expect(secondSequence).toEqual(firstSequence);
    });

    it("records step numbers in execution order", () => {
        const sequence = generateInstructionSequence(1);

        expect(sequence[0]?.step).toBe(1);
        expect(sequence[319]?.step).toBe(320);
    });

    it("includes sequential, front jump, and back jump sources", () => {
        const sources = new Set(generateInstructionSequence(1).map((item) => item.source));

        expect(sources.has("sequential")).toBe(true);
        expect(sources.has("frontJump")).toBe(true);
        expect(sources.has("backJump")).toBe(true);
    });
});

describe("parseSeed", () => {
    it("parses integer seed strings", () => {
        expect(parseSeed("123")).toBe(123);
    });

    it("rejects invalid seed values", () => {
        expect(() => parseSeed("abc")).toThrow(RangeError);
        expect(() => parseSeed("1.5")).toThrow(RangeError);
        expect(() => parseSeed("")).toThrow(RangeError);
    });
});
