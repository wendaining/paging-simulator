import { describe, expect, it } from "vitest";

import { CLOCK_ALGORITHM } from "../src/core/algorithms/clock.js";
import {
    createInitialSimulationState,
    executeSimulationStep,
    runSimulation,
} from "../src/core/simulator.js";

describe("CLOCK replacement algorithm", () => {
    it("sets the reference bit when a page is hit", () => {
        const state = createInitialSimulationState(CLOCK_ALGORITHM);

        executeSimulationStep(
            state,
            { step: 1, instructionNumber: 0, source: "start" },
            CLOCK_ALGORITHM,
        );
        state.algorithmState = {
            hand: 1,
            referenceBits: [0, 0, 0, 0],
        };

        const result = executeSimulationStep(
            state,
            { step: 2, instructionNumber: 1, source: "sequential" },
            CLOCK_ALGORITHM,
        );

        expect(result.isPageFault).toBe(false);
        expect(state.algorithmState).toEqual({
            hand: 1,
            referenceBits: [1, 0, 0, 0],
        });
    });

    it("skips pages whose reference bit is 1 before replacing", () => {
        const state = createInitialSimulationState(CLOCK_ALGORITHM);

        executeSimulationStep(
            state,
            { step: 1, instructionNumber: 0, source: "start" },
            CLOCK_ALGORITHM,
        );
        executeSimulationStep(
            state,
            { step: 2, instructionNumber: 10, source: "backJump" },
            CLOCK_ALGORITHM,
        );
        executeSimulationStep(
            state,
            { step: 3, instructionNumber: 20, source: "backJump" },
            CLOCK_ALGORITHM,
        );
        executeSimulationStep(
            state,
            { step: 4, instructionNumber: 30, source: "backJump" },
            CLOCK_ALGORITHM,
        );

        const replacement = executeSimulationStep(
            state,
            { step: 5, instructionNumber: 40, source: "backJump" },
            CLOCK_ALGORITHM,
        );

        expect(replacement.replacement).toEqual({
            frameNumber: 0,
            loadedPageNumber: 4,
            evictedPageNumber: 0,
        });
        expect(state.algorithmState).toEqual({
            hand: 1,
            referenceBits: [1, 0, 0, 0],
        });
    });

    it("advances the clock hand after replacing a page", () => {
        const state = createInitialSimulationState(CLOCK_ALGORITHM);

        state.memoryFrames = [
            { frameNumber: 0, pageNumber: 0 },
            { frameNumber: 1, pageNumber: 1 },
            { frameNumber: 2, pageNumber: 2 },
            { frameNumber: 3, pageNumber: 3 },
        ];
        state.algorithmState = {
            hand: 2,
            referenceBits: [0, 0, 0, 0],
        };

        const replacement = executeSimulationStep(
            state,
            { step: 1, instructionNumber: 40, source: "backJump" },
            CLOCK_ALGORITHM,
        );

        expect(replacement.replacement).toEqual({
            frameNumber: 2,
            loadedPageNumber: 4,
            evictedPageNumber: 2,
        });
        expect(state.algorithmState).toEqual({
            hand: 3,
            referenceBits: [0, 0, 1, 0],
        });
    });

    it("runs a full CLOCK simulation with generated instructions", () => {
        const result = runSimulation("clock", 1);

        expect(result.algorithm).toBe("clock");
        expect(result.seed).toBe(1);
        expect(result.steps).toHaveLength(320);
        expect(result.pageFaultCount).toBeGreaterThan(0);
    });
});
