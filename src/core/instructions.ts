import { TOTAL_INSTRUCTIONS } from "../config/constants.js";
import { createSeededRandom, getRandomInteger } from "./random.js";
import type { InstructionAccess, InstructionSource } from "../types/instruction.js";

/**
 * 解析接口传入的 seed 参数。
 *
 * @param seedValue 请求查询参数中的 seed 值。
 * @returns 可用于生成访问序列的整数 seed。
 */
export function parseSeed(seedValue: unknown): number {
    if (seedValue === undefined) {
        return Date.now();
    }

    if (typeof seedValue !== "string" || seedValue.trim() === "") {
        throw new RangeError("seed 必须是整数");
    }

    const seed = Number(seedValue);

    if (!Number.isInteger(seed)) {
        throw new RangeError("seed 必须是整数");
    }

    return seed;
}

/**
 * 生成符合课程要求的 320 条指令访问序列。
 *
 * @param seed 用来复现访问序列的随机数种子。
 * @returns 带执行序号、指令号和来源类型的访问记录数组。
 */
export function generateInstructionSequence(seed = Date.now()): InstructionAccess[] {
    const random = createSeededRandom(seed);
    const sequence: InstructionAccess[] = [];

    const appendInstruction = (
        instructionNumber: number,
        source: InstructionSource,
    ): void => {
        if (sequence.length >= TOTAL_INSTRUCTIONS) {
            return;
        }

        sequence.push({
            step: sequence.length + 1,
            instructionNumber,
            source,
        });
    };

    let pivot = getRandomInteger(random, 0, TOTAL_INSTRUCTIONS - 2);

    appendInstruction(pivot, "start");
    appendInstruction(pivot + 1, "sequential");

    while (sequence.length < TOTAL_INSTRUCTIONS) {
        const frontInstruction = pivot > 0 ? getRandomInteger(random, 0, pivot - 1) : 0;
        appendInstruction(frontInstruction, "frontJump");
        appendInstruction(Math.min(frontInstruction + 1, TOTAL_INSTRUCTIONS - 1), "sequential");

        const backStart = Math.min(frontInstruction + 2, TOTAL_INSTRUCTIONS - 1);
        const backInstruction =
            backStart < TOTAL_INSTRUCTIONS - 1
                ? getRandomInteger(random, backStart, TOTAL_INSTRUCTIONS - 2)
                : TOTAL_INSTRUCTIONS - 1;

        appendInstruction(backInstruction, "backJump");
        appendInstruction(Math.min(backInstruction + 1, TOTAL_INSTRUCTIONS - 1), "sequential");

        pivot = backInstruction;
    }

    return sequence;
}
