import { describe, expect, it } from "vitest";

import { FIFO_ALGORITHM } from "../src/core/algorithms/fifo.js";
import { LRU_ALGORITHM } from "../src/core/algorithms/lru.js";
import { COURSE_CONFIG } from "../src/config/constants.js";
import {
    createInitialSimulationState,
    executeSimulationStep,
    runSimulation,
    simulateInstructions,
} from "../src/core/simulator.js";
import type { InstructionAccess } from "../src/types/instruction.js";

describe("createInitialSimulationState", () => {
    it("starts with empty memory frames and zero page faults", () => {
        const state = createInitialSimulationState();

        expect(state.pageFaultCount).toBe(0);
        expect(state.memoryFrames).toEqual([
            { frameNumber: 0, pageNumber: null },
            { frameNumber: 1, pageNumber: null },
            { frameNumber: 2, pageNumber: null },
            { frameNumber: 3, pageNumber: null },
        ]);
        expect(state.algorithmState).toEqual({ queue: [] });
    });
});

describe("executeSimulationStep", () => {
    it("marks the first access to a page as a page fault", () => {
        const state = createInitialSimulationState(FIFO_ALGORITHM);
        const instruction: InstructionAccess = {
            step: 1,
            instructionNumber: 25,
            source: "start",
        };

        const result = executeSimulationStep(state, instruction, FIFO_ALGORITHM);

        expect(result.isPageFault).toBe(true);
        expect(result.pageNumber).toBe(2);
        expect(result.pageOffset).toBe(5);
        expect(result.memoryFrameNumber).toBe(0);
        expect(result.physicalAddress).toBe(5);
        expect(result.replacement).toEqual({
            frameNumber: 0,
            loadedPageNumber: 2,
            evictedPageNumber: null,
        });
        expect(result.pageFaultCount).toBe(1);
    });

    it("does not mark repeated access to an in-memory page as a page fault", () => {
        const state = createInitialSimulationState(FIFO_ALGORITHM);

        executeSimulationStep(
            state,
            {
                step: 1,
                instructionNumber: 25,
                source: "start",
            },
            FIFO_ALGORITHM,
        );

        const repeatedAccess = executeSimulationStep(
            state,
            {
                step: 2,
                instructionNumber: 26,
                source: "sequential",
            },
            FIFO_ALGORITHM,
        );

        expect(repeatedAccess.isPageFault).toBe(false);
        expect(repeatedAccess.memoryFrameNumber).toBe(0);
        expect(repeatedAccess.physicalAddress).toBe(6);
        expect(repeatedAccess.replacement).toBeNull();
        expect(repeatedAccess.pageFaultCount).toBe(1);
    });
    it("can execute a step with LRU algorithm", () => {
        const state = createInitialSimulationState(LRU_ALGORITHM);
        const result = executeSimulationStep(
            state,
            {
                step: 1,
                instructionNumber: 25,
                source: "start",
            },
            LRU_ALGORITHM,
        );

        expect(result.isPageFault).toBe(true);
        expect(result.pageNumber).toBe(2);
        expect(result.memoryFrameNumber).toBe(0);
        expect(result.replacement).toEqual({
            frameNumber: 0,
            loadedPageNumber: 2,
            evictedPageNumber: null,
        });
    });
});

describe("simulateInstructions", () => {
    it("runs a basic simulation over a custom sequence", () => {
        const instructions: InstructionAccess[] = [
            { step: 1, instructionNumber: 0, source: "start" },
            { step: 2, instructionNumber: 1, source: "sequential" },
            { step: 3, instructionNumber: 10, source: "backJump" },
        ];

        const result = simulateInstructions(instructions, FIFO_ALGORITHM);

        expect(result.algorithm).toBe("fifo");
        expect(result.steps).toHaveLength(3);
        expect(result.pageFaultCount).toBe(2);
        expect(result.config).toEqual(COURSE_CONFIG);
        expect(result.instructions).toEqual(instructions);
        expect(result.pageFaultRate).toBe(2 / 3);
    });
});

describe("runSimulation", () => {
    it("runs a full FIFO simulation with generated instructions", () => {
        const result = runSimulation("fifo", 1);

        expect(result.algorithm).toBe("fifo");
        expect(result.seed).toBe(1);
        expect(result.config).toEqual(COURSE_CONFIG);
        expect(result.instructions).toHaveLength(320);
        expect(result.steps).toHaveLength(320);
        expect(result.pageFaultCount).toBeGreaterThan(0);
        expect(result.pageFaultRate).toBe(result.pageFaultCount / result.instructions.length);
    });
});
