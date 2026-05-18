import { MEMORY_FRAME_COUNT } from "../../config/constants.js";
import { findFreeFrame, loadPageIntoFrame } from "./shared.js";
import type { MemoryFrameNumber, PageNumber } from "../../types/address.js";
import type {
    PageReplacement,
    PageReplacementAlgorithm,
    SimulationState,
} from "../../types/simulation.js";

interface ClockState {
    hand: MemoryFrameNumber;
    referenceBits: number[];
}

/**
 * 读取 CLOCK 专用状态。
 *
 * @param state 当前模拟器状态。
 * @returns CLOCK 专用状态。
 */
function getClockState(state: SimulationState): ClockState {
    return state.algorithmState as ClockState;
}

/**
 * 创建 CLOCK 专用初始状态。
 *
 * @returns CLOCK 专用状态。
 */
function createInitialClockState(): ClockState {
    return {
        hand: 0,
        referenceBits: Array.from({ length: MEMORY_FRAME_COUNT }, () => 0),
    };
}

/**
 * 计算 CLOCK 指针的下一个位置。
 *
 * @param frameNumber 当前内存块号。
 * @returns 下一个 CLOCK 指针位置。
 */
function getNextClockHand(frameNumber: MemoryFrameNumber): MemoryFrameNumber {
    return ((frameNumber + 1) % MEMORY_FRAME_COUNT) as MemoryFrameNumber;
}

/**
 * 把指定内存块的访问位置为 1。
 *
 * @param state 当前模拟器状态。
 * @param frameNumber 被访问的内存块号。
 */
export function markClockFrameAsReferenced(
    state: SimulationState,
    frameNumber: MemoryFrameNumber,
): void {
    const clockState = getClockState(state);

    clockState.referenceBits[frameNumber] = 1;
}

/**
 * 在内存已满时扫描 CLOCK 指针，找到可替换的内存块。
 *
 * @param state 当前模拟器状态。
 * @returns 可替换的内存块号。
 */
function findClockReplacementFrame(state: SimulationState): MemoryFrameNumber {
    const clockState = getClockState(state);

    for (let scannedCount = 0; scannedCount < MEMORY_FRAME_COUNT * 2; scannedCount += 1) {
        const currentFrame = clockState.hand;

        if (clockState.referenceBits[currentFrame] === 0) {
            return currentFrame;
        }

        clockState.referenceBits[currentFrame] = 0;
        clockState.hand = getNextClockHand(currentFrame);
    }

    throw new Error("CLOCK 指针扫描失败，无法找到可替换页面");
}

/**
 * 使用 CLOCK 处理缺页，并记录页面装入或置换信息。
 *
 * @param state 当前模拟器状态。
 * @param pageNumber 发生缺页的页号。
 * @returns 页面装入或置换的结果。
 */
export function handleClockPageFault(
    state: SimulationState,
    pageNumber: PageNumber,
): PageReplacement {
    state.pageFaultCount += 1;
    const clockState = getClockState(state);

    const freeFrame = findFreeFrame(state.memoryFrames);

    if (freeFrame !== null) {
        loadPageIntoFrame(state, freeFrame, pageNumber);
        markClockFrameAsReferenced(state, freeFrame);
        clockState.hand = getNextClockHand(freeFrame);

        return {
            frameNumber: freeFrame,
            loadedPageNumber: pageNumber,
            evictedPageNumber: null,
        };
    }

    const replacedFrame = findClockReplacementFrame(state);
    const evictedPageNumber = state.memoryFrames[replacedFrame]?.pageNumber ?? null;

    loadPageIntoFrame(state, replacedFrame, pageNumber);
    markClockFrameAsReferenced(state, replacedFrame);
    clockState.hand = getNextClockHand(replacedFrame);

    return {
        frameNumber: replacedFrame,
        loadedPageNumber: pageNumber,
        evictedPageNumber,
    };
}

export const CLOCK_ALGORITHM: PageReplacementAlgorithm = {
    name: "clock",
    createInitialState: createInitialClockState,
    handlePageHit: markClockFrameAsReferenced,
    handlePageFault: handleClockPageFault,
};
