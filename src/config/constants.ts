// export 表示把这个变量提供给其他文件使用
export const DEFAULT_PORT = 3000;

export const TOTAL_INSTRUCTIONS = 320;

export const INSTRUCTIONS_PER_PAGE = 10;

export const TOTAL_PAGES = 32;

export const MEMORY_FRAME_COUNT = 4;

export const COURSE_CONFIG = {
    totalInstructions: TOTAL_INSTRUCTIONS,
    instructionsPerPage: INSTRUCTIONS_PER_PAGE,
    totalPages: TOTAL_PAGES,
    memoryFrameCount: MEMORY_FRAME_COUNT,
} as const;
