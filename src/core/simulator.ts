import { MEMORY_FRAME_COUNT } from "../config/constants.js";
import { handleFifoPageFault } from "./algorithms/fifo.js";
import { getPageNumber, getPageOffset, getPhysicalAddress } from "./address.js";
import { generateInstructionSequence } from "./instructions.js";
import type { MemoryFrameNumber, PageNumber } from "../types/address.js";
import type { InstructionAccess } from "../types/instruction.js";
import type {
    MemoryFrameSnapshot,
    ReplacementAlgorithm,
    SimulationResult,
    SimulationState,
    SimulationStep,
} from "../types/simulation.js";

/**
 * 创建模拟器初始状态。
 *
 * @returns 内存为空、缺页次数为 0 的模拟器状态。
 */
export function createInitialSimulationState(): SimulationState {
    return {
        memoryFrames: Array.from({ length: MEMORY_FRAME_COUNT }, (_, index) => ({
            frameNumber: index,
            pageNumber: null,
        })),
        fifoQueue: [],
        pageFaultCount: 0,
    };
}

/**
 * 复制当前内存块快照，避免外部代码修改模拟器内部状态。
 *
 * @param memoryFrames 当前模拟器内存块状态。
 * @returns 新的内存块快照数组。
 */
function cloneMemoryFrames(memoryFrames: MemoryFrameSnapshot[]): MemoryFrameSnapshot[] {
    return memoryFrames.map((frame) => ({ ...frame }));
}

/**
 * 查找指定页面当前所在的内存块号。
 *
 * @param memoryFrames 当前模拟器内存块状态。
 * @param pageNumber 需要查找的页号。
 * @returns 页面所在的内存块号；如果页面不在内存中，返回 null。
 */
function findFrameByPage(
    memoryFrames: MemoryFrameSnapshot[],
    pageNumber: PageNumber,
): MemoryFrameNumber | null {
    const frame = memoryFrames.find((item) => item.pageNumber === pageNumber);

    return frame?.frameNumber ?? null;
}

/**
 * 执行单条指令访问，并更新模拟器状态。
 *
 * @param state 当前模拟器状态。
 * @param instruction 本次访问的指令记录。
 * @returns 本次访问的执行结果。
 */
export function executeFifoStep(
    state: SimulationState,
    instruction: InstructionAccess,
): SimulationStep {
    const pageNumber = getPageNumber(instruction.instructionNumber);
    const pageOffset = getPageOffset(instruction.instructionNumber);
    const existingFrame = findFrameByPage(state.memoryFrames, pageNumber);
    const isPageFault = existingFrame === null;
    const replacement = isPageFault ? handleFifoPageFault(state, pageNumber) : null;
    const memoryFrameNumber = replacement?.frameNumber ?? existingFrame;

    if (memoryFrameNumber === null) {
        throw new Error("页面命中时未找到对应内存块");
    }

    const physicalAddress = getPhysicalAddress(memoryFrameNumber, pageOffset);

    return {
        step: instruction.step,
        instruction,
        pageNumber,
        pageOffset,
        memoryFrameNumber,
        physicalAddress,
        isPageFault,
        replacement,
        pageFaultCount: state.pageFaultCount,
        memoryFrames: cloneMemoryFrames(state.memoryFrames),
    };
}

/**
 * 按 FIFO 骨架执行完整访问序列。
 *
 * @param instructions 需要执行的指令访问序列。
 * @returns 完整模拟结果。
 */
export function simulateFifoInstructions(instructions: InstructionAccess[]): Omit<
    SimulationResult,
    "seed"
> {
    const state = createInitialSimulationState();
    const steps = instructions.map((instruction) => executeFifoStep(state, instruction));

    return {
        algorithm: "fifo",
        pageFaultCount: state.pageFaultCount,
        steps,
    };
}

/**
 * 根据算法名称和 seed 运行完整模拟。
 *
 * @param algorithm 页面置换算法名称；当前阶段只支持 fifo。
 * @param seed 生成访问序列时使用的随机数种子。
 * @returns 完整模拟结果。
 */
export function runSimulation(
    algorithm: ReplacementAlgorithm,
    seed: number,
): SimulationResult {
    if (algorithm !== "fifo") {
        throw new RangeError("当前阶段只支持 fifo 算法");
    }

    const instructions = generateInstructionSequence(seed);
    const result = simulateFifoInstructions(instructions);

    return {
        ...result,
        seed,
    };
}
