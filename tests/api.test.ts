import { describe, expect, it } from "vitest";

import { createSimulationApiResponse } from "../src/app.js";
import { COURSE_CONFIG } from "../src/config/constants.js";
import type { ReplacementAlgorithm, SimulationResult } from "../src/types/simulation.js";

/**
 * 断言响应体是完整模拟结果。
 *
 * @param body 接口响应体。
 * @returns 完整模拟结果。
 */
function expectSimulationResult(body: unknown): SimulationResult {
    expect(body).toHaveProperty("algorithm");
    expect(body).toHaveProperty("seed");
    expect(body).toHaveProperty("config");
    expect(body).toHaveProperty("instructions");
    expect(body).toHaveProperty("steps");
    expect(body).toHaveProperty("pageFaultCount");
    expect(body).toHaveProperty("pageFaultRate");

    return body as SimulationResult;
}

describe("simulation API", () => {
    it("returns 400 for unsupported algorithms", () => {
        const response = createSimulationApiResponse({
            algorithm: "random",
            seed: "1",
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            message: "当前阶段只支持 fifo、lru 和 clock 算法",
        });
    });

    it("returns 400 for invalid seed values", () => {
        const response = createSimulationApiResponse({
            algorithm: "fifo",
            seed: "abc",
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            message: "seed 必须是整数",
        });
    });

    it.each<ReplacementAlgorithm>(["fifo", "lru", "clock"])(
        "returns a complete simulation result for %s",
        (algorithm) => {
            const response = createSimulationApiResponse({
                algorithm,
                seed: "1",
            });
            const result = expectSimulationResult(response.body);

            expect(response.statusCode).toBe(200);
            expect(result.algorithm).toBe(algorithm);
            expect(result.seed).toBe(1);
            expect(result.config).toEqual(COURSE_CONFIG);
            expect(result.instructions).toHaveLength(320);
            expect(result.steps).toHaveLength(320);
            expect(result.pageFaultCount).toBeGreaterThan(0);
            expect(result.pageFaultRate).toBe(result.pageFaultCount / result.instructions.length);
        },
    );
});
