<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
    Cpu,
    DataAnalysis,
    Grid,
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
const seedText = ref("1");
const config = ref<CourseConfig | null>(null);
const simulation = ref<SimulationResult | null>(null);
const isLoading = ref(false);

const pageFaultRateText = computed(() => {
    if (simulation.value === null) {
        return "--";
    }

    return `${(simulation.value.pageFaultRate * 100).toFixed(2)}%`;
});

const recentSteps = computed(() => simulation.value?.steps.slice(0, 8) ?? []);

/**
 * 运行一次完整模拟并刷新页面状态。
 */
async function runSimulation(): Promise<void> {
    isLoading.value = true;

    try {
        const result = await fetchSimulation(selectedAlgorithm.value, seedText.value);

        simulation.value = result;
        seedText.value = String(result.seed);
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
            fetchSimulation(selectedAlgorithm.value, seedText.value),
        ]);

        config.value = loadedConfig;
        simulation.value = result;
        seedText.value = String(result.seed);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "页面初始化失败");
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => {
    void initializePage();
});
</script>

<template>
    <main class="shell">
        <section class="masthead">
            <div>
                <p class="eyebrow">Paging Simulator</p>
                <h1>请求调页存储管理模拟器</h1>
            </div>
            <div class="run-state">
                <span class="pulse" />
                <span>{{ simulation?.algorithm.toUpperCase() ?? "READY" }}</span>
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
                        <el-input
                            v-model="seedText"
                            class="control-input"
                            placeholder="留空则使用当前时间"
                            :disabled="isLoading"
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
                        <strong>{{ simulation.seed }}</strong>
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

                <section class="step-panel">
                    <div class="section-title">
                        <span>步骤预览</span>
                        <small>前 8 步</small>
                    </div>

                    <el-table
                        v-loading="isLoading"
                        :data="recentSteps"
                        class="step-table"
                        height="360"
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
