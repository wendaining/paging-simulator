import express, { type Express } from "express";

import { COURSE_CONFIG } from "./config/constants.js";
import { generateInstructionSequence, parseSeed } from "./core/instructions.js";
import { runSimulation } from "./core/simulator.js";
import type {
    ReplacementAlgorithm,
    SimulationResult,
    SimulationStep,
} from "./types/simulation.js";

interface SimulationApiQuery {
    algorithm?: unknown;
    seed?: unknown;
}

interface SimulationApiResponse {
    statusCode: number;
    body: SimulationResult | { message: string };
}

/**
 * 判断接口参数是否是当前支持的页面置换算法。
 *
 * @param algorithm 请求中传入的算法参数。
 * @returns 如果算法受支持，返回 true。
 */
function isReplacementAlgorithm(algorithm: unknown): algorithm is ReplacementAlgorithm {
    return algorithm === "fifo" || algorithm === "lru" || algorithm === "clock";
}

/**
 * 根据查询参数生成模拟接口响应。
 *
 * @param query 请求查询参数。
 * @returns HTTP 状态码和响应体。
 */
export function createSimulationApiResponse(query: SimulationApiQuery): SimulationApiResponse {
    try {
        const algorithm = query.algorithm;

        if (!isReplacementAlgorithm(algorithm)) {
            throw new RangeError("当前阶段只支持 fifo、lru 和 clock 算法");
        }

        const seed = parseSeed(query.seed);
        const result = runSimulation(algorithm, seed);

        return {
            statusCode: 200,
            body: result,
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: {
                message: error instanceof Error ? error.message : "模拟参数非法",
            },
        };
    }
}

/**
 * 输出单步模拟日志。
 *
 * @param algorithm 当前模拟使用的页面置换算法。
 * @param step 本次模拟步骤。
 */
function logSimulationStep(algorithm: ReplacementAlgorithm, step: SimulationStep): void {
    const status = step.isPageFault ? "缺页" : "命中";

    console.log(
        `[simulation step] algorithm=${algorithm} step=${step.step} instruction=${step.instruction.instructionNumber} page=${step.pageNumber} frame=${step.memoryFrameNumber} status=${status} pageFaults=${step.pageFaultCount}`,
    );

    if (step.replacement !== null && step.replacement.evictedPageNumber !== null) {
        console.log(
            `[simulation replacement] algorithm=${algorithm} step=${step.step} frame=${step.replacement.frameNumber} evicted=${step.replacement.evictedPageNumber} loaded=${step.replacement.loadedPageNumber}`,
        );
    }
}

/**
 * 输出完整模拟过程日志。
 *
 * @param result 完整模拟结果。
 */
function logSimulationResult(result: SimulationResult): void {
    console.log(
        `[simulation start] algorithm=${result.algorithm} seed=${result.seed} instructions=${result.instructions.length}`,
    );

    result.steps.forEach((step) => logSimulationStep(result.algorithm, step));

    console.log(
        `[simulation end] algorithm=${result.algorithm} seed=${result.seed} pageFaults=${result.pageFaultCount} pageFaultRate=${result.pageFaultRate}`,
    );
}

/**
 * 创建 Express 应用，并注册当前已有的 API 路由。
 *
 * @returns 配置完成的 Express 应用实例。
 */
export function createApp(): Express {
    // 把 app 理解为「后端本体」，
    // 后续所有接口都会注册到这个对象上
    const app = express();
    // 注册中间件，
    // 让 Express 能够解析 JSON 格式的请求体
    app.use(express.json());

    app.get("/health", (_request, response) => {
        response.json({
            status: "ok",
            service: "paging-simulator",
        });
    });

    app.get("/api/config", (_request, response) => {
        console.log("[GET /api/config] 返回课程固定配置");
        response.json(COURSE_CONFIG);
    });

    app.get("/api/instructions", (request, response) => {
        try {
            const seed = parseSeed(request.query.seed);
            const instructions = generateInstructionSequence(seed);

            console.log(
                `[GET /api/instructions] seed=${seed} length=${instructions.length} preview=${JSON.stringify(instructions.slice(0, 5))}`,
            );

            response.json({
                seed,
                length: instructions.length,
                instructions,
            });
        } catch (error) {
            response.status(400).json({
                message: error instanceof Error ? error.message : "seed 参数非法",
            });
        }
    });

    app.get("/api/simulations", (request, response) => {
        const apiResponse = createSimulationApiResponse(request.query);

        if (apiResponse.statusCode === 200) {
            logSimulationResult(apiResponse.body as SimulationResult);
        }

        response.status(apiResponse.statusCode).json(apiResponse.body);
    });

    return app;
}
