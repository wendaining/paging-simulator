import { findFreeFrame, loadPageIntoFrame } from "./shared.js";
import type { MemoryFrameNumber, PageNumber } from "../../types/address.js";
import type {
    PageReplacement,
    PageReplacementAlgorithm,
    SimulationState,
} from "../../types/simulation.js";

interface FifoState {
    queue: MemoryFrameNumber[];
}

/**
 * 读取 FIFO 专用状态。
 *
 * @param state 当前模拟器状态。
 * @returns FIFO 专用状态。
 */
function getFifoState(state: SimulationState): FifoState {
    return state.algorithmState as FifoState;
}

/**
 * 创建 FIFO 专用初始状态。
 *
 * @returns FIFO 专用状态。
 */
function createInitialFifoState(): FifoState {
    return {
        queue: [],
    };
}

/**
 * 使用 FIFO 处理缺页，并记录页面装入或置换信息。
 *
 * @param state 当前模拟器状态。
 * @param pageNumber 发生缺页的页号。
 * @returns 页面装入或置换的结果。
 */
export function handleFifoPageFault(
    state: SimulationState,
    pageNumber: PageNumber,
): PageReplacement {
    state.pageFaultCount += 1;
    const fifoState = getFifoState(state);

    const freeFrame = findFreeFrame(state.memoryFrames);

    if (freeFrame !== null) {
        loadPageIntoFrame(state, freeFrame, pageNumber);
        fifoState.queue.push(freeFrame);

        return {
            frameNumber: freeFrame,
            loadedPageNumber: pageNumber,
            evictedPageNumber: null,
        };
    }

    const replacedFrame = fifoState.queue.shift();

    if (replacedFrame === undefined) {
        throw new Error("FIFO 队列为空，无法执行页面置换");
    }

    const evictedPageNumber = state.memoryFrames[replacedFrame]?.pageNumber ?? null;

    loadPageIntoFrame(state, replacedFrame, pageNumber);
    fifoState.queue.push(replacedFrame);

    return {
        frameNumber: replacedFrame,
        loadedPageNumber: pageNumber,
        evictedPageNumber,
    };
}

export const FIFO_ALGORITHM: PageReplacementAlgorithm = {
    name: "fifo",
    createInitialState: createInitialFifoState,
    handlePageHit: () => {},
    handlePageFault: handleFifoPageFault,
};
