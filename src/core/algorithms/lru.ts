import type { MemoryFrameNumber, PageNumber } from "../../types/address.js";
import type {
    MemoryFrameSnapshot,
    PageReplacement,
    SimulationState,
} from "../../types/simulation.js";

/**
 * 查找第一个空闲内存块。
 *
 * @param memoryFrames 当前模拟器内存块状态。
 * @returns 空闲内存块号；如果没有空闲块，返回 null。
 */
function findFreeFrame(memoryFrames: MemoryFrameSnapshot[]): MemoryFrameNumber | null {
    const frame = memoryFrames.find((item) => item.pageNumber === null);

    return frame?.frameNumber ?? null;
}

/**
 * 将页面装入指定内存块。
 *
 * @param state 当前模拟器状态。
 * @param frameNumber 要装入页面的内存块号。
 * @param pageNumber 要装入的页号。
 */
function loadPageIntoFrame(
    state: SimulationState,
    frameNumber: MemoryFrameNumber,
    pageNumber: PageNumber,
): void {
    state.memoryFrames[frameNumber] = {
        frameNumber,
        pageNumber,
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
    state.lruQueue = state.lruQueue.filter((item) => item !== frameNumber);
    state.lruQueue.push(frameNumber);
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

    const replacedFrame = state.lruQueue.shift();

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
