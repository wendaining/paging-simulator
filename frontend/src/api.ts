import type {
    CourseConfig,
    ReplacementAlgorithm,
    SimulationResult,
} from "./types";

/**
 * 解析接口错误响应。
 *
 * @param response 接口响应对象。
 * @returns 可展示的错误信息。
 */
async function readErrorMessage(response: Response): Promise<string> {
    const body = await response.json().catch(() => null) as { message?: string } | null;

    return body?.message ?? `接口请求失败，状态码 ${response.status}`;
}

/**
 * 请求课程固定配置。
 *
 * @returns 课程固定配置。
 */
export async function fetchCourseConfig(): Promise<CourseConfig> {
    const response = await fetch("/api/config");

    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }

    return await response.json() as CourseConfig;
}

/**
 * 请求一次完整模拟结果。
 *
 * @param algorithm 页面置换算法。
 * @param seedText seed 输入框内容。
 * @returns 完整模拟结果。
 */
export async function fetchSimulation(
    algorithm: ReplacementAlgorithm,
    seedText: string,
): Promise<SimulationResult> {
    const params = new URLSearchParams({ algorithm });
    const trimmedSeed = seedText.trim();

    if (trimmedSeed !== "") {
        params.set("seed", trimmedSeed);
    }

    const response = await fetch(`/api/simulations?${params.toString()}`);

    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }

    return await response.json() as SimulationResult;
}
