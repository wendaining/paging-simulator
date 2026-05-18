export type ReplacementAlgorithm = "fifo" | "lru" | "clock";

export interface CourseConfig {
    totalInstructions: number;
    instructionsPerPage: number;
    totalPages: number;
    memoryFrameCount: number;
}

export interface InstructionAccess {
    step: number;
    instructionNumber: number;
    source: "start" | "sequential" | "frontJump" | "backJump";
}

export interface MemoryFrameSnapshot {
    frameNumber: number;
    pageNumber: number | null;
}

export interface PageReplacement {
    frameNumber: number;
    loadedPageNumber: number;
    evictedPageNumber: number | null;
}

export interface SimulationStep {
    step: number;
    instruction: InstructionAccess;
    pageNumber: number;
    pageOffset: number;
    memoryFrameNumber: number;
    physicalAddress: number;
    isPageFault: boolean;
    replacement: PageReplacement | null;
    pageFaultCount: number;
    memoryFrames: MemoryFrameSnapshot[];
}

export interface SimulationResult {
    algorithm: ReplacementAlgorithm;
    seed: number;
    config: CourseConfig;
    instructions: InstructionAccess[];
    pageFaultCount: number;
    pageFaultRate: number;
    steps: SimulationStep[];
}
