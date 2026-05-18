<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
    Cpu,
    DataAnalysis,
    Grid,
    Right,
    Refresh,
    TrendCharts,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import { fetchCourseConfig, fetchSimulation } from "./api";
import type {
    CourseConfig,
    ReplacementAlgorithm,
    SimulationResult,
} from "./types";

const algorithmOptions: Array<{ label: string; value: ReplacementAlgorithm }> = [
    { label: "FIFO", value: "fifo" },
    { label: "LRU", value: "lru" },
    { label: "CLOCK", value: "clock" },
];

const selectedAlgorithm = ref<ReplacementAlgorithm>("fifo");
const useRandomSeed = ref(true);
const seedText = ref("");
const config = ref<CourseConfig | null>(null);
const simulation = ref<SimulationResult | null>(null);
const isLoading = ref(false);
const selectedStepNumber = ref(1);

const pageFaultRateText = computed(() => {
    if (simulation.value === null) {
        return "--";
    }

    return `${(simulation.value.pageFaultRate * 100).toFixed(2)}%`;
});

const allSteps = computed(() => simulation.value?.steps ?? []);

const selectedStep = computed(() => {
    if (simulation.value === null) {
        return null;
    }

    return simulation.value.steps.find((step) => step.step === selectedStepNumber.value)
        ?? simulation.value.steps[0]
        ?? null;
});

const pageTableRows = computed(() => {
    if (config.value === null || selectedStep.value === null) {
        return [];
    }

    return Array.from({ length: config.value.totalPages }, (_, pageNumber) => {
        const frame = selectedStep.value?.memoryFrames.find((item) => item.pageNumber === pageNumber);

        return {
            pageNumber,
            frameNumber: frame?.frameNumber ?? null,
            isCurrent: selectedStep.value?.pageNumber === pageNumber,
        };
    });
});

const currentMemoryFrames = computed(() => selectedStep.value?.memoryFrames ?? []);

const seedLabel = computed(() => {
    if (simulation.value === null) {
        return "--";
    }

    return useRandomSeed.value ? `${simulation.value.seed} 随机` : `${simulation.value.seed} 指定`;
});

const maxStepNumber = computed(() => simulation.value?.steps.length ?? 1);

/**
 * 获取本次模拟请求要使用的 seed 字符串。
 *
 * @returns 随机模式返回空字符串，指定模式返回输入框内容。
 */
function getSeedForRequest(): string {
    return useRandomSeed.value ? "" : seedText.value;
}

/**
 * 运行一次完整模拟并刷新页面状态。
 */
async function runSimulation(): Promise<void> {
    isLoading.value = true;

    try {
        const result = await fetchSimulation(selectedAlgorithm.value, getSeedForRequest());

        simulation.value = result;
        selectedStepNumber.value = 1;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "模拟请求失败");
    } finally {
        isLoading.value = false;
    }
}

/**
 * 处理算法切换，切换后从头开始执行一次模拟。
 */
async function handleAlgorithmChange(): Promise<void> {
    await runSimulation();
}

/**
 * 加载课程配置和默认模拟结果。
 */
async function initializePage(): Promise<void> {
    isLoading.value = true;

    try {
        const [loadedConfig, result] = await Promise.all([
            fetchCourseConfig(),
            fetchSimulation(selectedAlgorithm.value, getSeedForRequest()),
        ]);

        config.value = loadedConfig;
        simulation.value = result;
        selectedStepNumber.value = 1;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "页面初始化失败");
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => {
    void initializePage();
});

/**
 * 选择表格中的某一步作为可视化观察对象。
 *
 * @param row 被点击的模拟步骤。
 */
function selectStep(row: { step: number }): void {
    selectedStepNumber.value = row.step;
}

/**
 * 前进到下一步模拟记录。
 */
function goToNextStep(): void {
    selectedStepNumber.value = Math.min(selectedStepNumber.value + 1, maxStepNumber.value);
}
</script>

<template>
    <main class="shell">
        <section class="masthead">
            <div>
                <p class="eyebrow">Paging Simulator</p>
                <h1>请求调页存储管理模拟器</h1>
            </div>
        </section>

        <section class="workspace">
            <aside class="control-panel">
                <div class="panel-heading">
                    <el-icon><Cpu /></el-icon>
                    <span>控制台</span>
                </div>

                <el-form label-position="top" class="control-form">
                    <el-form-item label="算法">
                        <el-select
                            v-model="selectedAlgorithm"
                            class="control-input"
                            :disabled="isLoading"
                            @change="handleAlgorithmChange"
                        >
                            <el-option
                                v-for="item in algorithmOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Seed">
                        <div class="seed-mode">
                            <el-switch
                                v-model="useRandomSeed"
                                active-text="随机种子"
                                inactive-text="指定种子"
                                :disabled="isLoading"
                            />
                        </div>
                        <el-input
                            v-model="seedText"
                            class="control-input"
                            placeholder="指定种子，例如 1"
                            :disabled="isLoading || useRandomSeed"
                            @keyup.enter="runSimulation"
                        />
                    </el-form-item>

                    <el-button
                        type="primary"
                        class="run-button"
                        :loading="isLoading"
                        @click="runSimulation"
                    >
                        <el-icon><Refresh /></el-icon>
                        运行模拟
                    </el-button>
                </el-form>

                <div class="config-grid" v-if="config !== null">
                    <div>
                        <span>指令</span>
                        <strong>{{ config.totalInstructions }}</strong>
                    </div>
                    <div>
                        <span>页数</span>
                        <strong>{{ config.totalPages }}</strong>
                    </div>
                    <div>
                        <span>页长</span>
                        <strong>{{ config.instructionsPerPage }}</strong>
                    </div>
                    <div>
                        <span>内存块</span>
                        <strong>{{ config.memoryFrameCount }}</strong>
                    </div>
                </div>
            </aside>

            <section class="results">
                <div class="metric-row">
                    <article class="metric-card">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>缺页次数</span>
                        <strong>{{ simulation?.pageFaultCount ?? "--" }}</strong>
                    </article>
                    <article class="metric-card accent">
                        <el-icon><TrendCharts /></el-icon>
                        <span>缺页率</span>
                        <strong>{{ pageFaultRateText }}</strong>
                    </article>
                    <article class="metric-card">
                        <el-icon><Grid /></el-icon>
                        <span>执行步数</span>
                        <strong>{{ simulation?.steps.length ?? "--" }}</strong>
                    </article>
                </div>

                <div class="summary-band" v-if="simulation !== null">
                    <div>
                        <span>当前 seed</span>
                        <strong>{{ seedLabel }}</strong>
                    </div>
                    <div>
                        <span>访问序列</span>
                        <strong>{{ simulation.instructions.length }}</strong>
                    </div>
                    <div>
                        <span>算法</span>
                        <strong>{{ simulation.algorithm.toUpperCase() }}</strong>
                    </div>
                </div>

                <section class="visual-panel">
                    <div class="section-title">
                        <span>页表与换页过程</span>
                        <div class="step-controls">
                            <small>第 {{ selectedStep?.step ?? "--" }} / {{ maxStepNumber }} 步</small>
                            <el-button
                                class="step-button"
                                :disabled="selectedStep === null || selectedStepNumber >= maxStepNumber"
                                @click="goToNextStep"
                            >
                                <el-icon><Right /></el-icon>
                                下一步
                            </el-button>
                        </div>
                    </div>

                    <div class="visual-grid" v-if="selectedStep !== null">
                        <el-slider
                            v-model="selectedStepNumber"
                            :min="1"
                            :max="maxStepNumber"
                            :step="1"
                            :disabled="isLoading"
                            show-input
                            class="step-slider"
                        />

                        <div class="page-table-strip">
                            <div
                                v-for="row in pageTableRows"
                                :key="row.pageNumber"
                                class="page-cell"
                                :class="{
                                    resident: row.frameNumber !== null,
                                    current: row.isCurrent,
                                }"
                            >
                                <span>P{{ row.pageNumber }}</span>
                                <strong>{{ row.frameNumber === null ? "-" : `F${row.frameNumber}` }}</strong>
                            </div>
                        </div>

                        <svg class="swap-svg" viewBox="0 0 720 250" role="img" aria-label="页表和换页过程">
                            <defs>
                                <marker
                                    id="arrow"
                                    viewBox="0 0 10 10"
                                    refX="8"
                                    refY="5"
                                    markerWidth="6"
                                    markerHeight="6"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e" />
                                </marker>
                            </defs>

                            <rect x="28" y="32" width="154" height="76" rx="8" class="svg-node access" />
                            <text x="105" y="61" text-anchor="middle" class="svg-label">当前访问</text>
                            <text x="105" y="88" text-anchor="middle" class="svg-strong">
                                指令 {{ selectedStep.instruction.instructionNumber }} / 页 {{ selectedStep.pageNumber }}
                            </text>

                            <line x1="186" y1="70" x2="262" y2="70" class="svg-arrow" />

                            <rect x="270" y="22" width="184" height="96" rx="8" class="svg-node" />
                            <text x="362" y="54" text-anchor="middle" class="svg-label">4 个内存块</text>
                            <text x="362" y="82" text-anchor="middle" class="svg-strong">
                                {{ selectedStep.isPageFault ? "缺页" : "命中" }} F{{ selectedStep.memoryFrameNumber }}
                            </text>

                            <line x1="458" y1="70" x2="535" y2="70" class="svg-arrow" />

                            <rect
                                x="542"
                                y="32"
                                width="150"
                                height="76"
                                rx="8"
                                class="svg-node"
                                :class="{ swap: selectedStep.replacement !== null }"
                            />
                            <text x="617" y="61" text-anchor="middle" class="svg-label">
                                {{ selectedStep.replacement === null ? "无需换页" : "页面置换" }}
                            </text>
                            <text x="617" y="88" text-anchor="middle" class="svg-strong">
                                {{
                                    selectedStep.replacement === null
                                        ? "继续执行"
                                        : `${selectedStep.replacement.evictedPageNumber === null ? "无换出" : `出 P${selectedStep.replacement.evictedPageNumber}`} 入 P${selectedStep.replacement.loadedPageNumber}`
                                }}
                            </text>

                            <g
                                v-for="frame in currentMemoryFrames"
                                :key="frame.frameNumber"
                            >
                                <rect
                                    :x="96 + frame.frameNumber * 148"
                                    y="158"
                                    width="116"
                                    height="58"
                                    rx="8"
                                    class="svg-frame"
                                    :class="{ active: frame.frameNumber === selectedStep.memoryFrameNumber }"
                                />
                                <text
                                    :x="154 + frame.frameNumber * 148"
                                    y="182"
                                    text-anchor="middle"
                                    class="svg-label"
                                >
                                    F{{ frame.frameNumber }}
                                </text>
                                <text
                                    :x="154 + frame.frameNumber * 148"
                                    y="204"
                                    text-anchor="middle"
                                    class="svg-strong"
                                >
                                    {{ frame.pageNumber === null ? "空" : `P${frame.pageNumber}` }}
                                </text>
                            </g>
                        </svg>
                    </div>
                </section>

                <section class="step-panel">
                    <div class="section-title">
                        <span>模拟记录</span>
                        <small>全部 {{ allSteps.length }} 步，点击行查看可视化</small>
                    </div>

                    <el-table
                        v-loading="isLoading"
                        :data="allSteps"
                        class="step-table"
                        height="520"
                        highlight-current-row
                        @row-click="selectStep"
                    >
                        <el-table-column prop="step" label="#" width="72" />
                        <el-table-column
                            prop="instruction.instructionNumber"
                            label="指令"
                            width="88"
                        />
                        <el-table-column prop="pageNumber" label="页号" width="88" />
                        <el-table-column prop="pageOffset" label="页内偏移" width="110" />
                        <el-table-column prop="memoryFrameNumber" label="内存块" width="96" />
                        <el-table-column prop="physicalAddress" label="物理地址" width="110" />
                        <el-table-column label="置换" min-width="154">
                            <template #default="{ row }">
                                <span v-if="row.replacement === null">-</span>
                                <span v-else>
                                    F{{ row.replacement.frameNumber }}:
                                    {{ row.replacement.evictedPageNumber === null ? "无换出" : `P${row.replacement.evictedPageNumber}` }}
                                    -> P{{ row.replacement.loadedPageNumber }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" min-width="100">
                            <template #default="{ row }">
                                <el-tag :type="row.isPageFault ? 'danger' : 'success'" effect="plain">
                                    {{ row.isPageFault ? "缺页" : "命中" }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </section>
            </section>
        </section>
    </main>
</template>
