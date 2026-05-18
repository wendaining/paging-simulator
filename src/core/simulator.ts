import { COURSE_CONFIG, MEMORY_FRAME_COUNT } from "../config/constants.js";
import { getReplacementAlgorithm } from "./algorithms/index.js";
import { getPageNumber, getPageOffset, getPhysicalAddress } from "./address.js";
import { generateInstructionSequence } from "./instructions.js";
import type { MemoryFrameNumber, PageNumber } from "../types/address.js";
import type { InstructionAccess } from "../types/instruction.js";
import type {
    MemoryFrameSnapshot,
    PageReplacementAlgorithm,
    ReplacementAlgorithm,
    SimulationResult,
    SimulationState,
    SimulationStep,
} from "../types/simulation.js";

/**
 * 创建模拟器初始状态。
 *
 * @param algorithm 页面置换算法实现。
 * @returns 内存为空、缺页次数为 0 的模拟器状态。
 */
export function createInitialSimulationState(
    algorithm: PageReplacementAlgorithm = getReplacementAlgorithm("fifo"),
): SimulationState {
    return {
        memoryFrames: Array.from({ length: MEMORY_FRAME_COUNT }, (_, index) => ({
            frameNumber: index,
            pageNumber: null,
        })),
        algorithmState: algorithm.createInitialState(),
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
 * 执行单条指令访问，并通过指定算法更新模拟器状态。
 *
 * @param state 当前模拟器状态。
 * @param instruction 本次访问的指令记录。
 * @param algorithm 页面置换算法实现。
 * @returns 本次访问的执行结果。
 */
export function executeSimulationStep(
    state: SimulationState,
    instruction: InstructionAccess,
    algorithm: PageReplacementAlgorithm,
): SimulationStep {
    const pageNumber = getPageNumber(instruction.instructionNumber);
    const pageOffset = getPageOffset(instruction.instructionNumber);
    const existingFrame = findFrameByPage(state.memoryFrames, pageNumber);
    const isPageFault = existingFrame === null;
    const replacement = isPageFault ? algorithm.handlePageFault(state, pageNumber) : null;
    const memoryFrameNumber = replacement?.frameNumber ?? existingFrame;

    if (memoryFrameNumber === null) {
        throw new Error("页面命中时未找到对应内存块");
    }

    if (!isPageFault) {
        algorithm.handlePageHit(state, memoryFrameNumber);
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
 * 按指定页面置换算法执行完整访问序列。
 *
 * @param instructions 需要执行的指令访问序列。
 * @param algorithm 页面置换算法实现。
 * @returns 完整模拟结果。
 */
export function simulateInstructions(
    instructions: InstructionAccess[],
    algorithm: PageReplacementAlgorithm,
): Omit<
    SimulationResult,
    "seed"
> {
    const state = createInitialSimulationState(algorithm);
    const steps = instructions.map((instruction) =>
        executeSimulationStep(state, instruction, algorithm),
    );

    return {
        algorithm: algorithm.name,
        config: COURSE_CONFIG,
        instructions,
        pageFaultCount: state.pageFaultCount,
        pageFaultRate: state.pageFaultCount / instructions.length,
        steps,
    };
}

/**
 * 根据算法名称和 seed 运行完整模拟。
 *
 * @param algorithm 页面置换算法名称。
 * @param seed 生成访问序列时使用的随机数种子。
 * @returns 完整模拟结果。
 */
export function runSimulation(
    algorithm: ReplacementAlgorithm,
    seed: number,
): SimulationResult {
    const instructions = generateInstructionSequence(seed);
    const result = simulateInstructions(instructions, getReplacementAlgorithm(algorithm));

    return {
        ...result,
        seed,
    };
}
