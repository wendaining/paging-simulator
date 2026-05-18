import { describe, expect, it } from "vitest";

import { createInitialSimulationState, executeFifoStep } from "../src/core/simulator.js";

describe("FIFO replacement algorithm", () => {
    it("replaces pages in FIFO order when memory is full", () => {
        const state = createInitialSimulationState();

        executeFifoStep(state, { step: 1, instructionNumber: 0, source: "start" });
        executeFifoStep(state, { step: 2, instructionNumber: 10, source: "backJump" });
        executeFifoStep(state, { step: 3, instructionNumber: 20, source: "backJump" });
        executeFifoStep(state, { step: 4, instructionNumber: 30, source: "backJump" });
        const replacement = executeFifoStep(state, {
            step: 5,
            instructionNumber: 40,
            source: "backJump",
        });

        expect(replacement.isPageFault).toBe(true);
        expect(replacement.replacement).toEqual({
            frameNumber: 0,
            loadedPageNumber: 4,
            evictedPageNumber: 0,
        });
        expect(replacement.memoryFrames[0]).toEqual({
            frameNumber: 0,
            pageNumber: 4,
        });
    });

    it("does not change FIFO order when a page is hit", () => {
        const state = createInitialSimulationState();

        executeFifoStep(state, { step: 1, instructionNumber: 0, source: "start" });
        executeFifoStep(state, { step: 2, instructionNumber: 10, source: "backJump" });
        executeFifoStep(state, { step: 3, instructionNumber: 1, source: "sequential" });

        expect(state.fifoQueue).toEqual([0, 1]);
    });
});
