import type {
    MemoryFrameNumber,
    PageNumber,
    PageOffset,
    PhysicalAddress,
} from "./address.js";
import type { InstructionAccess } from "./instruction.js";

export type ReplacementAlgorithm = "fifo";

export interface MemoryFrameSnapshot {
    frameNumber: MemoryFrameNumber;
    pageNumber: PageNumber | null;
}

export interface SimulationState {
    memoryFrames: MemoryFrameSnapshot[];
    fifoQueue: MemoryFrameNumber[];
    pageFaultCount: number;
}

export interface SimulationStep {
    step: number;
    instruction: InstructionAccess;
    pageNumber: PageNumber;
    pageOffset: PageOffset;
    memoryFrameNumber: MemoryFrameNumber;
    physicalAddress: PhysicalAddress;
    isPageFault: boolean;
    pageFaultCount: number;
    memoryFrames: MemoryFrameSnapshot[];
}

export interface SimulationResult {
    algorithm: ReplacementAlgorithm;
    seed: number;
    pageFaultCount: number;
    steps: SimulationStep[];
}
