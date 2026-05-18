import { describe, expect, it } from "vitest";

import {
    createInitialSimulationState,
    executeLruStep,
    runSimulation,
} from "../src/core/simulator.js";

describe("LRU replacement algorithm", () => {
    it("updates recent usage order when a page is hit", () => {
        const state = createInitialSimulationState();

        executeLruStep(state, { step: 1, instructionNumber: 0, source: "start" });
        executeLruStep(state, { step: 2, instructionNumber: 10, source: "backJump" });
        executeLruStep(state, { step: 3, instructionNumber: 1, source: "sequential" });

        expect(state.lruQueue).toEqual([1, 0]);
    });

    it("replaces the least recently used page when memory is full", () => {
        const state = createInitialSimulationState();

        executeLruStep(state, { step: 1, instructionNumber: 0, source: "start" });
        executeLruStep(state, { step: 2, instructionNumber: 10, source: "backJump" });
        executeLruStep(state, { step: 3, instructionNumber: 20, source: "backJump" });
        executeLruStep(state, { step: 4, instructionNumber: 30, source: "backJump" });
        executeLruStep(state, { step: 5, instructionNumber: 1, source: "sequential" });
        const replacement = executeLruStep(state, {
            step: 6,
            instructionNumber: 40,
            source: "backJump",
        });

        expect(replacement.isPageFault).toBe(true);
        expect(replacement.replacement).toEqual({
            frameNumber: 1,
            loadedPageNumber: 4,
            evictedPageNumber: 1,
        });
        expect(replacement.memoryFrames[1]).toEqual({
            frameNumber: 1,
            pageNumber: 4,
        });
    });

    it("can produce a different page fault count from FIFO for the same seed", () => {
        const fifoResult = runSimulation("fifo", 1);
        const lruResult = runSimulation("lru", 1);

        expect(lruResult.steps).toHaveLength(320);
        expect(lruResult.pageFaultCount).not.toBe(fifoResult.pageFaultCount);
    });
});
