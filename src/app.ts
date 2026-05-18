import express, { type Express } from "express";

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

    return app;
}
