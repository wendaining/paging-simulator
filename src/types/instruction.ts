import type { InstructionNumber } from "./address.js";

export type InstructionSource = "start" | "sequential" | "frontJump" | "backJump";

export interface InstructionAccess {
    step: number;
    instructionNumber: InstructionNumber;
    source: InstructionSource;
}
