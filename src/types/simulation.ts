import type {
    MemoryFrameNumber,
    PageNumber,
    PageOffset,
    PhysicalAddress,
} from "./address.js";
import type { InstructionAccess } from "./instruction.js";

export type ReplacementAlgorithm = "fifo" | "lru";

export interface MemoryFrameSnapshot {
    frameNumber: MemoryFrameNumber;
    pageNumber: PageNumber | null;
}

export interface SimulationState {
    memoryFrames: MemoryFrameSnapshot[];
    algorithmState: unknown;
    pageFaultCount: number;
}

export interface PageReplacement {
    frameNumber: MemoryFrameNumber;
    loadedPageNumber: PageNumber;
    evictedPageNumber: PageNumber | null;
}

export interface PageReplacementAlgorithm {
    name: ReplacementAlgorithm;
    createInitialState: () => unknown;
    handlePageHit: (state: SimulationState, frameNumber: MemoryFrameNumber) => void;
    handlePageFault: (state: SimulationState, pageNumber: PageNumber) => PageReplacement;
}

export interface SimulationStep {
    step: number;
    instruction: InstructionAccess;
    pageNumber: PageNumber;
    pageOffset: PageOffset;
    memoryFrameNumber: MemoryFrameNumber;
    physicalAddress: PhysicalAddress;
    isPageFault: boolean;
    replacement: PageReplacement | null;
    pageFaultCount: number;
    memoryFrames: MemoryFrameSnapshot[];
}

export interface SimulationResult {
    algorithm: ReplacementAlgorithm;
    seed: number;
    pageFaultCount: number;
    steps: SimulationStep[];
}
