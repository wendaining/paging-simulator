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

    const freeFrame = findFreeFrame(state.memoryFrames);

    if (freeFrame !== null) {
        loadPageIntoFrame(state, freeFrame, pageNumber);
        state.fifoQueue.push(freeFrame);

        return {
            frameNumber: freeFrame,
            loadedPageNumber: pageNumber,
            evictedPageNumber: null,
        };
    }

    const replacedFrame = state.fifoQueue.shift();

    if (replacedFrame === undefined) {
        throw new Error("FIFO 队列为空，无法执行页面置换");
    }

    const evictedPageNumber = state.memoryFrames[replacedFrame]?.pageNumber ?? null;

    loadPageIntoFrame(state, replacedFrame, pageNumber);
    state.fifoQueue.push(replacedFrame);

    return {
        frameNumber: replacedFrame,
        loadedPageNumber: pageNumber,
        evictedPageNumber,
    };
}
