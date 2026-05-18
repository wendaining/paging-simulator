const LCG_MODULUS = 2 ** 32;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

/**
 * 根据种子创建可复现的伪随机数生成函数。
 *
 * @param seed 用来初始化随机数序列的整数种子。
 * @returns 返回 0 到 1 之间随机小数的函数。
 */
export function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;

        return state / LCG_MODULUS;
    };
}

/**
 * 生成闭区间内的随机整数。
 *
 * @param random 返回 0 到 1 之间随机小数的函数。
 * @param min 随机整数的最小值。
 * @param max 随机整数的最大值。
 * @returns 位于 min 和 max 之间的整数。
 */
export function getRandomInteger(random: () => number, min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new RangeError("随机整数范围必须是合法的整数闭区间");
    }

    return Math.floor(random() * (max - min + 1)) + min;
}
