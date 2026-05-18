import type { MemoryFrameNumber, PageNumber } from "../../types/address.js";
import type { MemoryFrameSnapshot, SimulationState } from "../../types/simulation.js";

/**
 * 查找第一个空闲内存块。
 *
 * @param memoryFrames 当前模拟器内存块状态。
 * @returns 空闲内存块号；如果没有空闲块，返回 null。
 */
export function findFreeFrame(memoryFrames: MemoryFrameSnapshot[]): MemoryFrameNumber | null {
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
export function loadPageIntoFrame(
    state: SimulationState,
    frameNumber: MemoryFrameNumber,
    pageNumber: PageNumber,
): void {
    state.memoryFrames[frameNumber] = {
        frameNumber,
        pageNumber,
    };
}
