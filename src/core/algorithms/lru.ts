import { findFreeFrame, loadPageIntoFrame } from "./shared.js";
import type { MemoryFrameNumber, PageNumber } from "../../types/address.js";
import type {
    PageReplacement,
    PageReplacementAlgorithm,
    SimulationState,
} from "../../types/simulation.js";

interface LruState {
    queue: MemoryFrameNumber[];
}

/**
 * 读取 LRU 专用状态。
 *
 * @param state 当前模拟器状态。
 * @returns LRU 专用状态。
 */
function getLruState(state: SimulationState): LruState {
    return state.algorithmState as LruState;
}

/**
 * 创建 LRU 专用初始状态。
 *
 * @returns LRU 专用状态。
 */
function createInitialLruState(): LruState {
    return {
        queue: [],
    };
}

/**
 * 把内存块移动到 LRU 队尾，表示它最近被使用过。
 *
 * @param state 当前模拟器状态。
 * @param frameNumber 最近被访问的内存块号。
 */
export function markLruFrameAsUsed(
    state: SimulationState,
    frameNumber: MemoryFrameNumber,
): void {
    const lruState = getLruState(state);

    lruState.queue = lruState.queue.filter((item) => item !== frameNumber);
    lruState.queue.push(frameNumber);
}

/**
 * 使用 LRU 处理缺页，并记录页面装入或置换信息。
 *
 * @param state 当前模拟器状态。
 * @param pageNumber 发生缺页的页号。
 * @returns 页面装入或置换的结果。
 */
export function handleLruPageFault(
    state: SimulationState,
    pageNumber: PageNumber,
): PageReplacement {
    state.pageFaultCount += 1;
    const lruState = getLruState(state);

    const freeFrame = findFreeFrame(state.memoryFrames);

    if (freeFrame !== null) {
        loadPageIntoFrame(state, freeFrame, pageNumber);
        markLruFrameAsUsed(state, freeFrame);

        return {
            frameNumber: freeFrame,
            loadedPageNumber: pageNumber,
            evictedPageNumber: null,
        };
    }

    const replacedFrame = lruState.queue.shift();

    if (replacedFrame === undefined) {
        throw new Error("LRU 队列为空，无法执行页面置换");
    }

    const evictedPageNumber = state.memoryFrames[replacedFrame]?.pageNumber ?? null;

    loadPageIntoFrame(state, replacedFrame, pageNumber);
    markLruFrameAsUsed(state, replacedFrame);

    return {
        frameNumber: replacedFrame,
        loadedPageNumber: pageNumber,
        evictedPageNumber,
    };
}

export const LRU_ALGORITHM: PageReplacementAlgorithm = {
    name: "lru",
    createInitialState: createInitialLruState,
    handlePageHit: markLruFrameAsUsed,
    handlePageFault: handleLruPageFault,
};
