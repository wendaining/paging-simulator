import { describe, expect, it } from "vitest";

import { getPageNumber, getPageOffset, getPhysicalAddress } from "../src/core/address.js";

describe("address conversion", () => {
    it("converts typical instruction numbers to page numbers", () => {
        expect(getPageNumber(25)).toBe(2);
        expect(getPageNumber(137)).toBe(13);
    });

    it("converts boundary instruction numbers to page numbers", () => {
        expect(getPageNumber(0)).toBe(0);
        expect(getPageNumber(9)).toBe(0);
        expect(getPageNumber(10)).toBe(1);
        expect(getPageNumber(319)).toBe(31);
    });

    it("converts typical instruction numbers to page offsets", () => {
        expect(getPageOffset(25)).toBe(5);
        expect(getPageOffset(137)).toBe(7);
    });

    it("converts boundary instruction numbers to page offsets", () => {
        expect(getPageOffset(0)).toBe(0);
        expect(getPageOffset(9)).toBe(9);
        expect(getPageOffset(10)).toBe(0);
        expect(getPageOffset(319)).toBe(9);
    });

    it("converts memory frame and page offset to physical address", () => {
        expect(getPhysicalAddress(0, 0)).toBe(0);
        expect(getPhysicalAddress(2, 5)).toBe(25);
        expect(getPhysicalAddress(3, 9)).toBe(39);
    });

    it("rejects invalid instruction numbers", () => {
        expect(() => getPageNumber(-1)).toThrow(RangeError);
        expect(() => getPageOffset(320)).toThrow(RangeError);
        expect(() => getPageNumber(1.5)).toThrow(RangeError);
    });

    it("rejects invalid physical address inputs", () => {
        expect(() => getPhysicalAddress(-1, 0)).toThrow(RangeError);
        expect(() => getPhysicalAddress(4, 0)).toThrow(RangeError);
        expect(() => getPhysicalAddress(0, 10)).toThrow(RangeError);
    });
});
