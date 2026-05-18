import express, { type Express } from "express";

import { COURSE_CONFIG } from "./config/constants.js";
import { generateInstructionSequence, parseSeed } from "./core/instructions.js";
import { runSimulation } from "./core/simulator.js";
import type { ReplacementAlgorithm } from "./types/simulation.js";

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
        try {
            const algorithm = request.query.algorithm;

            if (algorithm !== "fifo") {
                throw new RangeError("当前阶段只支持 fifo 算法");
            }

            const seed = parseSeed(request.query.seed);
            const result = runSimulation(algorithm as ReplacementAlgorithm, seed);

            console.log(
                `[GET /api/simulations] algorithm=${algorithm} seed=${seed} steps=${result.steps.length} pageFaults=${result.pageFaultCount}`,
            );

            response.json(result);
        } catch (error) {
            response.status(400).json({
                message: error instanceof Error ? error.message : "模拟参数非法",
            });
        }
    });

    return app;
}
