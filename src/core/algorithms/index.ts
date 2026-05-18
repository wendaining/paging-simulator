import { FIFO_ALGORITHM } from "./fifo.js";
import { LRU_ALGORITHM } from "./lru.js";
import type {
    PageReplacementAlgorithm,
    ReplacementAlgorithm,
} from "../../types/simulation.js";

const ALGORITHMS: Record<ReplacementAlgorithm, PageReplacementAlgorithm> = {
    fifo: FIFO_ALGORITHM,
    lru: LRU_ALGORITHM,
};

/**
 * 根据算法名称获取页面置换算法实现。
 *
 * @param name 页面置换算法名称。
 * @returns 对应的页面置换算法实现。
 */
export function getReplacementAlgorithm(name: ReplacementAlgorithm): PageReplacementAlgorithm {
    return ALGORITHMS[name];
}
