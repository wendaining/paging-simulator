import {
    INSTRUCTIONS_PER_PAGE,
    MEMORY_FRAME_COUNT,
    TOTAL_INSTRUCTIONS,
} from "../config/constants.js";
import type {
    InstructionNumber,
    MemoryFrameNumber,
    PageNumber,
    PageOffset,
    PhysicalAddress,
} from "../types/address.js";

/**
 * 校验指令号是否在作业地址空间范围内。
 *
 * @param instructionNumber 需要校验的指令号。
 */
function assertValidInstructionNumber(instructionNumber: InstructionNumber): void {
    if (
        !Number.isInteger(instructionNumber) ||
        instructionNumber < 0 ||
        instructionNumber >= TOTAL_INSTRUCTIONS
    ) {
        throw new RangeError(`指令号必须是 0 到 ${TOTAL_INSTRUCTIONS - 1} 之间的整数`);
    }
}

/**
 * 校验页内偏移是否在单页容量范围内。
 *
 * @param pageOffset 需要校验的页内偏移。
 */
function assertValidPageOffset(pageOffset: PageOffset): void {
    if (!Number.isInteger(pageOffset) || pageOffset < 0 || pageOffset >= INSTRUCTIONS_PER_PAGE) {
        throw new RangeError(`页内偏移必须是 0 到 ${INSTRUCTIONS_PER_PAGE - 1} 之间的整数`);
    }
}

/**
 * 校验内存块号是否在主存块范围内。
 *
 * @param memoryFrameNumber 需要校验的内存块号。
 */
function assertValidMemoryFrameNumber(memoryFrameNumber: MemoryFrameNumber): void {
    if (
        !Number.isInteger(memoryFrameNumber) ||
        memoryFrameNumber < 0 ||
        memoryFrameNumber >= MEMORY_FRAME_COUNT
    ) {
        throw new RangeError(`内存块号必须是 0 到 ${MEMORY_FRAME_COUNT - 1} 之间的整数`);
    }
}

/**
 * 根据指令号计算该指令所在的页号。
 *
 * @param instructionNumber 需要转换的指令号。
 * @returns 指令所在的页号。
 */
export function getPageNumber(instructionNumber: InstructionNumber): PageNumber {
    assertValidInstructionNumber(instructionNumber);

    return Math.floor(instructionNumber / INSTRUCTIONS_PER_PAGE);
}

/**
 * 根据指令号计算该指令在页面内的偏移。
 *
 * @param instructionNumber 需要转换的指令号。
 * @returns 指令在所在页面内的偏移。
 */
export function getPageOffset(instructionNumber: InstructionNumber): PageOffset {
    assertValidInstructionNumber(instructionNumber);

    return instructionNumber % INSTRUCTIONS_PER_PAGE;
}

/**
 * 根据内存块号和页内偏移计算物理地址。
 *
 * @param memoryFrameNumber 页面当前所在的内存块号。
 * @param pageOffset 指令在页面内的偏移。
 * @returns 指令对应的物理地址。
 */
export function getPhysicalAddress(
    memoryFrameNumber: MemoryFrameNumber,
    pageOffset: PageOffset,
): PhysicalAddress {
    assertValidMemoryFrameNumber(memoryFrameNumber);
    assertValidPageOffset(pageOffset);

    return memoryFrameNumber * INSTRUCTIONS_PER_PAGE + pageOffset;
}
