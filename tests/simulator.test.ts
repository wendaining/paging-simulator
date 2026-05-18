import { describe, expect, it } from "vitest";

import {
    createInitialSimulationState,
    executeFifoStep,
    runSimulation,
    simulateFifoInstructions,
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
    });
});

describe("executeFifoStep", () => {
    it("marks the first access to a page as a page fault", () => {
        const state = createInitialSimulationState();
        const instruction: InstructionAccess = {
            step: 1,
            instructionNumber: 25,
            source: "start",
        };

        const result = executeFifoStep(state, instruction);

        expect(result.isPageFault).toBe(true);
        expect(result.pageNumber).toBe(2);
        expect(result.pageOffset).toBe(5);
        expect(result.memoryFrameNumber).toBe(0);
        expect(result.physicalAddress).toBe(5);
        expect(result.pageFaultCount).toBe(1);
    });

    it("does not mark repeated access to an in-memory page as a page fault", () => {
        const state = createInitialSimulationState();

        executeFifoStep(state, {
            step: 1,
            instructionNumber: 25,
            source: "start",
        });

        const repeatedAccess = executeFifoStep(state, {
            step: 2,
            instructionNumber: 26,
            source: "sequential",
        });

        expect(repeatedAccess.isPageFault).toBe(false);
        expect(repeatedAccess.memoryFrameNumber).toBe(0);
        expect(repeatedAccess.physicalAddress).toBe(6);
        expect(repeatedAccess.pageFaultCount).toBe(1);
    });
});

describe("simulateFifoInstructions", () => {
    it("runs a basic FIFO simulation over a custom sequence", () => {
        const instructions: InstructionAccess[] = [
            { step: 1, instructionNumber: 0, source: "start" },
            { step: 2, instructionNumber: 1, source: "sequential" },
            { step: 3, instructionNumber: 10, source: "backJump" },
        ];

        const result = simulateFifoInstructions(instructions);

        expect(result.algorithm).toBe("fifo");
        expect(result.steps).toHaveLength(3);
        expect(result.pageFaultCount).toBe(2);
    });
});

describe("runSimulation", () => {
    it("runs a full FIFO simulation with generated instructions", () => {
        const result = runSimulation("fifo", 1);

        expect(result.algorithm).toBe("fifo");
        expect(result.seed).toBe(1);
        expect(result.steps).toHaveLength(320);
        expect(result.pageFaultCount).toBeGreaterThan(0);
    });
});
