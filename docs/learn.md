## 第一阶段：建立最小可运行后端

本阶段完成了 Node.js + TypeScript 后端项目的最小骨架。当前本机环境是 Node.js v24.14.1 和 npm 11.13.0。

`package.json` 是 Node.js 项目的入口配置文件。它记录项目名称、依赖包和常用命令。本项目当前配置了这些命令：

- `npm run dev`：使用 `tsx watch src/server.ts` 启动开发服务器。`tsx` 可以直接运行 TypeScript 文件，并在文件变化后自动重启。
- `npm run build`：使用 `tsc` 把 `src/` 中的 TypeScript 编译成 JavaScript，输出到 `dist/`。
- `npm start`：运行编译后的 `dist/server.js`。
- `npm test`：使用 Vitest 执行自动测试。

> 这里为什么只有 `npm start` 和 `npm test` 不需要加 `run`？是因为这是 npm 的历史遗留问题，其实加了 `run` 也行，但是只有这几个可以不加。

`tsconfig.json` 是 TypeScript 编译配置。当前只把 `src/**/*.ts` 放进生产编译范围，测试文件由 Vitest 直接处理，不放进 `dist/`。这样可以避免把测试代码编译进正式运行产物。

`src/app.ts` 负责创建 Express app。这里把 app 创建逻辑单独放进 `createApp()`，好处是测试可以直接导入 app，不需要真的监听端口。

`src/server.ts` 负责启动 HTTP 服务。它导入 `createApp()`，读取端口配置，然后调用 `app.listen()`。这种拆分让“创建应用”和“启动服务”分开，后续加测试、加 API 路由会更清楚。

`src/config/constants.ts` 目前先放了 `DEFAULT_PORT = 3000`。后续课程固定配置，例如 320 条指令、每页 10 条指令、32 页、4 个内存块，也会继续放在配置或常量模块里。

`GET /health` 是健康检查接口，用来确认后端服务是否正常运行。本阶段用 curl 验证过：

```bash
curl http://localhost:3000/health
```

返回结果：

```json
{"status":"ok","service":"paging-simulator"}
```

Vitest 是当前项目的自动测试工具。本阶段先写了一个最小测试，确认 `createApp()` 可以正常创建 Express 应用。后续分页算法、访问序列、页面置换逻辑都会继续用 Vitest 测试。

## `src/app.ts` 和 `src/server.ts` 代码解释

这两个文件共同完成“创建后端应用”和“启动后端服务”两件事。它们被拆开，是为了让代码更容易测试，也更容易扩展。

### `src/app.ts`

```ts
import express, { type Express } from "express";
```

这一行从 `express` 这个依赖包里导入东西。

- `express` 是一个函数，用来创建后端应用。
- `type Express` 是 TypeScript 类型，只在写代码时帮助我们检查类型，运行时不会变成真正的 JavaScript 代码。

```ts
export function createApp(): Express {
```

这一行定义了一个函数，名字叫 `createApp`。

- `export` 表示这个函数可以被别的文件导入使用。
- `(): Express` 表示这个函数返回值的类型是 Express 应用实例。
- 这个函数的职责是创建并配置一个后端应用。

```ts
const app = express();
```

这一行真正创建了 Express 应用。可以把 `app` 理解成“后端程序本体”，后续所有接口都会注册到这个对象上。

```ts
app.use(express.json());
```

这一行注册了一个中间件。它的作用是让 Express 能够解析 JSON 格式的请求体。

虽然当前的 `/health` 接口还没有用到请求体，但后续如果有接口需要接收 JSON 数据，这个配置就会用上。

```ts
app.get("/health", (_request, response) => {
```

这一行注册了一个 GET 接口，路径是 `/health`。

- `app.get` 表示处理 HTTP GET 请求。
- `"/health"` 是接口路径。
- 后面的函数会在请求到达时执行。
- `_request` 表示请求对象，因为当前暂时没用到它，所以变量名前面加 `_`。
- `response` 表示响应对象，用它给浏览器或 curl 返回数据。

```ts
response.json({
  status: "ok",
  service: "paging-simulator",
});
```

这一段返回 JSON 数据。也就是说，当访问 `http://localhost:3000/health` 时，后端会返回：

```json
{"status":"ok","service":"paging-simulator"}
```

```ts
return app;
```

最后返回配置好的 Express 应用。注意这里只是“创建应用”，还没有真正启动端口监听。

### `src/server.ts`

```ts
import { createApp } from "./app.js";
import { DEFAULT_PORT } from "./config/constants.js";
```

这两行导入其他文件提供的内容。

- `createApp` 来自 `src/app.ts`，用于创建 Express 应用。
- `DEFAULT_PORT` 来自 `src/config/constants.ts`，当前值是 `3000`。
- 这里导入路径写 `.js` 是因为项目使用了 Node.js 的 ESM 模块规则。虽然源码文件是 `.ts`，但 TypeScript 编译后会变成 `.js`，所以导入路径要按运行时的 JavaScript 文件来写。

```ts
const app = createApp();
```

这一行调用 `createApp()`，得到配置好的 Express 应用。

```ts
const port = Number(process.env.PORT ?? DEFAULT_PORT);
```

这一行决定后端服务监听哪个端口。

- `process.env.PORT` 表示从环境变量里读取 `PORT`。
- `??` 表示“如果左边是 null 或 undefined，就使用右边的值”。
- 如果没有设置环境变量 `PORT`，就使用默认端口 `DEFAULT_PORT`，也就是 `3000`。
- `Number(...)` 把结果转换成数字。

```ts
app.listen(port, () => {
```

这一行让 Express 应用开始监听端口。执行到这里，后端服务才真正启动。

```ts
console.log(`paging-simulator server is running on http://localhost:${port}`);
```

这一行在服务启动成功后打印日志，告诉我们服务已经运行，以及访问地址是什么。

### 为什么要拆成两个文件

如果把所有代码都写在 `server.ts` 里，也可以运行。但拆成 `app.ts` 和 `server.ts` 有两个好处：

1. `app.ts` 只负责创建和配置应用，后续添加 API 路由会集中在这里或由这里挂载。
2. `server.ts` 只负责启动服务，测试时可以不执行 `app.listen()`，避免测试过程中真的占用端口。

所以当前结构可以理解为：

```text
src/app.ts      创建 Express 应用，注册接口
src/server.ts   调用 createApp，并启动端口监听
```

## 第二阶段：实现课程配置 API

本阶段把课程文档中的固定配置写进了代码，并提供了 `GET /api/config` 接口。

### 课程固定常量

固定配置放在 `src/config/constants.ts`：

```ts
export const DEFAULT_PORT = 3000;

export const TOTAL_INSTRUCTIONS = 320;

export const INSTRUCTIONS_PER_PAGE = 10;

export const TOTAL_PAGES = 32;

export const MEMORY_FRAME_COUNT = 4;
```

这些值来自课程要求：

- 作业共有 320 条指令。
- 每个页面存放 10 条指令。
- 地址空间一共有 32 页。
- 主存最多同时放 4 个页面。

把这些值定义成常量的好处是：后续地址转换、访问序列生成、页面置换算法都可以复用同一份配置，避免在多个文件里重复写 `320`、`10`、`32`、`4` 这些数字。

### `export` 是什么

`export` 表示“把这个变量提供给其他文件使用”。例如：

```ts
export const TOTAL_INSTRUCTIONS = 320;
```

这样其他文件就可以通过 `import` 导入它：

```ts
import { TOTAL_INSTRUCTIONS } from "./config/constants.js";
```

如果没有 `export`，这个常量就只能在当前文件内部使用。

### `COURSE_CONFIG`

代码里还定义了一个对象：

```ts
export const COURSE_CONFIG = {
    totalInstructions: TOTAL_INSTRUCTIONS,
    instructionsPerPage: INSTRUCTIONS_PER_PAGE,
    totalPages: TOTAL_PAGES,
    memoryFrameCount: MEMORY_FRAME_COUNT,
} as const;
```

这个对象把几个分散的常量组合成一个整体，方便 API 一次性返回给前端或 curl。

`as const` 是 TypeScript 语法，表示这个对象里的值是固定的，不希望后续代码随便修改它。

### `/api/config` 接口

在 `src/app.ts` 中新增了：

```ts
app.get("/api/config", (_request, response) => {
    console.log("[GET /api/config] 返回课程固定配置");

    response.json(COURSE_CONFIG);
});
```

这段代码的意思是：

1. 当收到 `GET /api/config` 请求时，执行后面的函数。
2. 先用 `console.log` 打印一条日志，方便运行后端时观察请求是否进入接口。
3. 用 `response.json(COURSE_CONFIG)` 把课程配置以 JSON 格式返回。

用 curl 验证：

```bash
curl http://localhost:3000/api/config
```

返回结果：

```json
{"totalInstructions":320,"instructionsPerPage":10,"totalPages":32,"memoryFrameCount":4}
```

后端日志会打印：

```text
[GET /api/config] 返回课程固定配置
```

### 本阶段测试

本阶段用 Vitest 测试了 `COURSE_CONFIG` 的值，确认它和课程要求一致。

当前测试没有在测试进程里启动真实端口，因为当前运行环境不允许测试进程临时监听端口。真实 HTTP 接口已经通过 `npm run dev` 加 curl 的方式验证。

## 第三阶段：实现地址转换逻辑

本阶段实现了分页系统里最基础的地址转换逻辑。代码主要放在两个文件中：

- `src/types/address.ts`：定义地址相关类型。
- `src/core/address.ts`：实现地址转换函数。

### 为什么先定义类型

`src/types/address.ts` 里定义了这些类型：

```ts
export type InstructionNumber = number;
export type PageNumber = number;
export type PageOffset = number;
export type MemoryFrameNumber = number;
export type PhysicalAddress = number;
```

它们底层都是 `number`，但是名字不同，表达的含义不同。

例如 `InstructionNumber` 表示指令号，`PageNumber` 表示页号，`PhysicalAddress` 表示物理地址。这样写代码时更容易看懂函数参数和返回值的含义。

### 指令号转页号

课程规定每页存放 10 条指令，所以页号公式是：

```text
页号 = Math.floor(指令号 / 每页指令数)
```

例如：

- 指令 `0` 到 `9` 都在第 `0` 页。
- 指令 `10` 到 `19` 都在第 `1` 页。
- 指令 `319` 在第 `31` 页。

代码中对应函数是：

```ts
export function getPageNumber(instructionNumber: InstructionNumber): PageNumber
```

### 指令号转页内偏移

页内偏移表示“这条指令在当前页面里的第几个位置”。公式是：

```text
页内偏移 = 指令号 % 每页指令数
```

例如：

- 指令 `0` 的页内偏移是 `0`。
- 指令 `9` 的页内偏移是 `9`。
- 指令 `10` 的页内偏移又回到 `0`。
- 指令 `319` 的页内偏移是 `9`。

代码中对应函数是：

```ts
export function getPageOffset(instructionNumber: InstructionNumber): PageOffset
```

### 内存块号和页内偏移转物理地址

当某个页面被装入主存的某个内存块后，物理地址由“内存块起始位置 + 页内偏移”组成。

因为每个内存块也能放 10 条指令，所以公式是：

```text
物理地址 = 内存块号 * 每页指令数 + 页内偏移
```

例如：

- 内存块 `0`、页内偏移 `0`，物理地址是 `0`。
- 内存块 `2`、页内偏移 `5`，物理地址是 `25`。
- 内存块 `3`、页内偏移 `9`，物理地址是 `39`。

代码中对应函数是：

```ts
export function getPhysicalAddress(
    memoryFrameNumber: MemoryFrameNumber,
    pageOffset: PageOffset,
): PhysicalAddress
```

### 为什么要校验参数

地址转换函数里还写了参数校验，例如：

- 指令号必须是 `0..319` 之间的整数。
- 页内偏移必须是 `0..9` 之间的整数。
- 内存块号必须是 `0..3` 之间的整数。

如果传入非法值，函数会抛出 `RangeError`。这样可以尽早发现错误，避免后续模拟器拿着错误地址继续计算。

### 本阶段测试

本阶段新增了 `tests/address.test.ts`，覆盖了：

- 典型指令号，例如 `25`、`137`。
- 边界指令号，例如 `0`、`9`、`10`、`319`。
- 物理地址计算，例如内存块 `2` 加页内偏移 `5` 得到物理地址 `25`。
- 非法输入，例如 `-1`、`320`、非整数、非法内存块号、非法页内偏移。

当前 `npm test` 已通过，说明地址转换逻辑符合课程设定。

## 第四阶段：实现访问序列生成 API

本阶段实现了课程要求中的指令访问序列生成，并提供了 `GET /api/instructions` 接口。

### 访问记录的数据结构

访问序列中的每一项长这样：

```ts
export interface InstructionAccess {
    step: number;
    instructionNumber: InstructionNumber;
    source: InstructionSource;
}
```

字段含义：

- `step`：第几步执行，从 `1` 开始。
- `instructionNumber`：本次访问的指令号，范围是 `0..319`。
- `source`：这条指令的来源类型。

`source` 当前有四种：

```ts
export type InstructionSource = "start" | "sequential" | "frontJump" | "backJump";
```

- `start`：随机起始指令。
- `sequential`：顺序执行的下一条指令。
- `frontJump`：跳转到前地址部分的指令。
- `backJump`：跳转到后地址部分的指令。

### 为什么要用 seed

普通随机数每次运行结果都可能不同，不方便测试。比如今天生成的序列和明天生成的序列不一样，就很难判断是代码改坏了，还是随机数本来就不同。

所以本项目支持 `seed`。同一个 seed 会生成同一条访问序列，例如：

```bash
curl 'http://localhost:3000/api/instructions?seed=1'
```

只要 seed 还是 `1`，生成结果就稳定，方便调试、写测试和对比算法结果。

### 伪随机数生成器

代码里没有直接使用 `Math.random()`，而是在 `src/core/random.ts` 中实现了一个简单的线性同余随机数生成器：

```ts
state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
```

这个公式会根据上一次的 `state` 算出下一次的 `state`。只要初始 seed 相同，后续生成出来的随机数序列就相同。

这类随机数叫“伪随机数”：看起来像随机，但其实是可复现的计算结果。

### 访问序列生成规则

核心函数是：

```ts
export function generateInstructionSequence(seed = DEFAULT_SEED): InstructionAccess[]
```

它会生成 320 条访问记录，大体过程是：

1. 先随机选择一个起始指令，标记为 `start`。
2. 顺序执行下一条指令，标记为 `sequential`。
3. 跳转到当前指令前面的地址部分，标记为 `frontJump`。
4. 再顺序执行下一条，标记为 `sequential`。
5. 跳转到后地址部分，标记为 `backJump`。
6. 再顺序执行下一条，标记为 `sequential`。
7. 重复这个过程，直到生成 320 条访问记录。

实现时还处理了边界情况，保证所有指令号都在 `0..319` 范围内，不会出现负数或超过 `319` 的指令号。

### `/api/instructions` 接口

在 `src/app.ts` 中新增了：

```ts
app.get("/api/instructions", (request, response) => {
    // ...
});
```

它会读取查询参数里的 `seed`：

```ts
const seed = parseSeed(request.query.seed);
```

然后生成访问序列：

```ts
const instructions = generateInstructionSequence(seed);
```

最后返回 JSON：

```json
{
  "seed": 1,
  "length": 320,
  "instructions": []
}
```

这里的 `instructions` 实际会包含 320 条访问记录。

### curl 验证

因为 URL 里有 `?`，在 zsh 中需要给 URL 加引号，否则 shell 可能会把 `?` 当作通配符：

```bash
curl 'http://localhost:3000/api/instructions?seed=1'
```

本阶段验证时返回了：

- `seed` 为 `1`。
- `length` 为 `320`。
- `instructions` 中包含 320 条访问记录。

后端日志会输出 seed、序列长度和前几条记录预览，例如：

```text
[GET /api/instructions] seed=1 length=320 preview=[...]
```

### 本阶段测试

本阶段新增了 `tests/instructions.test.ts`，覆盖了：

- 访问序列长度必须是 `320`。
- 所有指令号都必须在 `0..319`。
- 同一个 seed 生成的序列必须完全一致。
- `step` 从 `1` 到 `320`。
- 来源类型包含 `sequential`、`frontJump`、`backJump`。
- 非法 seed 会抛出错误。

当前 `npm test` 已通过，说明访问序列生成逻辑满足本阶段要求。

## 第五阶段：实现模拟器基础流程

本阶段实现了最小可运行的分页模拟器流程，并提供了 `GET /api/simulations?algorithm=fifo&seed=1` 接口。

### 模拟器状态

模拟器状态定义在 `src/types/simulation.ts` 中：

```ts
export interface SimulationState {
    memoryFrames: MemoryFrameSnapshot[];
    fifoQueue: MemoryFrameNumber[];
    pageFaultCount: number;
}
```

它包含三部分：

- `memoryFrames`：当前主存中的 4 个内存块。
- `fifoQueue`：FIFO 使用的队列，记录页面进入内存块的先后顺序。
- `pageFaultCount`：当前累计缺页次数。

初始状态由 `createInitialSimulationState()` 创建：

```ts
memoryFrames: [
  { frameNumber: 0, pageNumber: null },
  { frameNumber: 1, pageNumber: null },
  { frameNumber: 2, pageNumber: null },
  { frameNumber: 3, pageNumber: null }
]
```

这里的 `pageNumber: null` 表示这个内存块暂时没有装入任何页面。

### 单步执行逻辑

单步执行函数是：

```ts
export function executeFifoStep(
    state: SimulationState,
    instruction: InstructionAccess,
): SimulationStep
```

它的流程是：

1. 根据指令号计算页号。
2. 根据指令号计算页内偏移。
3. 检查这个页号是否已经在内存块中。
4. 如果已经在内存中，就是命中，不增加缺页次数。
5. 如果不在内存中，就是缺页，缺页次数加 1。
6. 缺页时，如果还有空闲内存块，就直接装入。
7. 缺页时，如果内存块已满，就按 FIFO 队列替换最早进入的内存块。
8. 根据内存块号和页内偏移计算物理地址。
9. 返回本步骤的执行结果和内存快照。

### 单步结果

每一步模拟结果包含：

```ts
export interface SimulationStep {
    step: number;
    instruction: InstructionAccess;
    pageNumber: PageNumber;
    pageOffset: PageOffset;
    memoryFrameNumber: MemoryFrameNumber;
    physicalAddress: PhysicalAddress;
    isPageFault: boolean;
    pageFaultCount: number;
    memoryFrames: MemoryFrameSnapshot[];
}
```

其中：

- `pageNumber`：当前指令对应的页号。
- `pageOffset`：当前指令在页内的偏移。
- `memoryFrameNumber`：当前页所在的内存块号。
- `physicalAddress`：当前指令对应的物理地址。
- `isPageFault`：本次访问是否发生缺页。
- `pageFaultCount`：执行到当前步骤时的累计缺页次数。
- `memoryFrames`：执行完当前步骤后的内存块快照。

### FIFO 骨架

当前阶段的 FIFO 已经能完成基础置换：

- 内存未满时，页面直接装入第一个空闲内存块。
- 内存已满时，替换 FIFO 队列中最早进入的内存块。

第 6 阶段还会继续完善 FIFO 的置换信息，例如显式记录“被换出的页号”“被装入的页号”“替换发生在哪个内存块”。

### 模拟接口

新增接口：

```bash
curl 'http://localhost:3000/api/simulations?algorithm=fifo&seed=1'
```

返回结果包含：

- `algorithm`：当前使用的算法，现阶段是 `fifo`。
- `seed`：生成访问序列使用的 seed。
- `pageFaultCount`：总缺页次数。
- `steps`：320 步完整模拟结果。

本阶段验证时，`seed=1` 的结果包含 320 步，缺页次数为 `146`。

后端日志会输出：

```text
[GET /api/simulations] algorithm=fifo seed=1 steps=320 pageFaults=146
```

### 本阶段测试

本阶段新增了 `tests/simulator.test.ts`，覆盖了：

- 初始内存为空，缺页次数为 0。
- 首次访问某页一定缺页。
- 重复访问已在内存中的同一页不会缺页。
- 自定义短序列可以跑出预期缺页次数。
- 使用 seed 生成的完整访问序列可以跑出 320 步模拟结果。

当前 `npm test` 已通过，说明基础模拟流程已经跑通。

## 第六阶段：实现 FIFO 页面置换

本阶段把 FIFO 页面置换信息补完整了。上一阶段已经能完成基础替换，但结果里还没有明确记录“换出了谁、装入了谁、发生在哪个内存块”。这一阶段补上了这些字段和测试。

### FIFO 的核心思想

FIFO 是 First In, First Out，也就是“先进先出”。

在页面置换里，它的意思是：

```text
最早进入内存的页面，最先被换出。
```

本项目用 `fifoQueue` 保存内存块进入使用状态的顺序。队列里存的是内存块号，不是页号。

例如主存有 4 个内存块，依次装入页面后：

```text
fifoQueue = [0, 1, 2, 3]
```

这表示：

- 内存块 `0` 最早被使用。
- 内存块 `1` 第二个被使用。
- 内存块 `2` 第三个被使用。
- 内存块 `3` 最晚被使用。

如果这时又发生缺页，并且内存已满，就取出队头 `0`，替换内存块 `0` 中的页面，再把 `0` 放回队尾：

```text
fifoQueue = [1, 2, 3, 0]
```

### 为什么队列里存内存块号

页面置换真正要修改的是某个内存块里的页面。

比如内存块 `0` 原来放的是页面 `7`，现在要装入页面 `13`，那么变化是：

```text
frameNumber: 0
evictedPageNumber: 7
loadedPageNumber: 13
```

所以 FIFO 队列保存内存块号很直接：队头告诉我们下一次应该替换哪个内存块。

### 新增 replacement 字段

现在每一步模拟结果里新增了：

```ts
export interface PageReplacement {
    frameNumber: MemoryFrameNumber;
    loadedPageNumber: PageNumber;
    evictedPageNumber: PageNumber | null;
}
```

它表示本次访问如果发生缺页，页面装入或置换的细节。

字段含义：

- `frameNumber`：发生装入或置换的内存块号。
- `loadedPageNumber`：新装入的页号。
- `evictedPageNumber`：被换出的页号。如果内存还没满，只是装入空闲块，这里就是 `null`。

如果本次访问命中内存，没有发生缺页，那么 `replacement` 是 `null`。

### 状态变化示例

第一次访问指令 `25`：

- 指令 `25` 属于页面 `2`。
- 页面 `2` 不在内存中，所以发生缺页。
- 内存块 `0` 是空闲的，所以页面 `2` 装入内存块 `0`。

对应的 `replacement` 是：

```json
{
  "frameNumber": 0,
  "loadedPageNumber": 2,
  "evictedPageNumber": null
}
```

当内存已经满了以后，如果 FIFO 队头是内存块 `0`，内存块 `0` 原来放页面 `7`，现在装入页面 `13`，则：

```json
{
  "frameNumber": 0,
  "loadedPageNumber": 13,
  "evictedPageNumber": 7
}
```

### 命中不会改变 FIFO 队列

FIFO 只关心页面进入内存的先后顺序，不关心页面最近有没有被访问。

所以如果某次访问命中了已经在内存中的页面：

- 不增加缺页次数。
- 不替换页面。
- 不改变 `fifoQueue` 顺序。
- `replacement` 为 `null`。

这点和后面要实现的 LRU 不一样。LRU 会在命中时更新“最近使用”状态。

### curl 验证

为了避免终端输出完整 320 步 JSON，本阶段验证时把响应写入了 `/tmp/paging-simulation.json`：

```bash
curl -s -o /tmp/paging-simulation.json -w '%{http_code} %{size_download}\n' 'http://localhost:3000/api/simulations?algorithm=fifo&seed=1'
```

返回状态码是 `200`，说明接口正常。

随后读取 JSON 的关键信息，确认：

```json
{
  "algorithm": "fifo",
  "seed": 1,
  "steps": 320,
  "pageFaultCount": 146,
  "firstReplacement": {
    "frameNumber": 0,
    "loadedPageNumber": 13,
    "evictedPageNumber": 7
  }
}
```

这说明完整模拟能跑 320 步，并且已经记录了真实页面置换信息。

### 本阶段测试

本阶段继续扩展了 `tests/simulator.test.ts`：

- 验证内存未满时，缺页会装入空闲内存块。
- 验证内存已满时，FIFO 会替换最早进入的内存块。
- 验证命中页面时不会改变 FIFO 队列顺序。
- 验证完整模拟仍然能生成 320 步。

当前 `npm test` 已通过，说明 FIFO 页面置换行为符合当前阶段要求。

## 第七阶段：实现 LRU 页面置换

本阶段实现了 LRU 页面置换算法，并让模拟接口支持：

```bash
curl 'http://localhost:3000/api/simulations?algorithm=lru&seed=1'
```

### LRU 的核心思想

LRU 是 Least Recently Used，意思是“最近最少使用”。

在页面置换里，它的规则是：

```text
当内存已满并发生缺页时，换出最久没有被访问过的页面。
```

这和 FIFO 不同：

- FIFO 只关心页面进入内存的时间。
- LRU 关心页面最近一次被访问的时间。

### LRU 队列

本项目在模拟器状态中新增了：

```ts
lruQueue: MemoryFrameNumber[]
```

它保存内存块的最近使用顺序：

- 队头：最久未使用的内存块。
- 队尾：最近使用过的内存块。

例如：

```text
lruQueue = [1, 2, 3, 0]
```

表示内存块 `1` 最久没有被访问，内存块 `0` 最近刚被访问。

### 命中时为什么要更新顺序

LRU 和 FIFO 最大的区别在“命中”时。

如果访问的页面已经在内存中：

- FIFO 不改变队列。
- LRU 要把这个页面所在的内存块移动到队尾。

代码中对应函数是：

```ts
export function markLruFrameAsUsed(
    state: SimulationState,
    frameNumber: MemoryFrameNumber,
): void
```

它会先从 `lruQueue` 中移除这个内存块号，再把它放到队尾。

### 缺页时如何替换

LRU 缺页处理在 `src/core/algorithms/lru.ts` 中：

```ts
export function handleLruPageFault(
    state: SimulationState,
    pageNumber: PageNumber,
): PageReplacement
```

处理规则：

1. 缺页次数加 1。
2. 如果还有空闲内存块，就直接装入页面，并把这个内存块标记为最近使用。
3. 如果内存已满，就从 `lruQueue` 队头取出最久未使用的内存块。
4. 换出该内存块里的旧页面。
5. 装入新页面。
6. 把该内存块移动到 `lruQueue` 队尾。

### 返回结构保持一致

LRU 和 FIFO 使用相同的单步返回结构，所以前端之后展示时不用为不同算法做两套表格。

例如一次真实置换仍然会返回：

```json
{
  "frameNumber": 1,
  "loadedPageNumber": 4,
  "evictedPageNumber": 1
}
```

含义是：在内存块 `1` 中，换出页面 `1`，装入页面 `4`。

### 和 FIFO 的结果差异

本阶段用同一个访问序列 `seed=1` 验证：

- FIFO 缺页次数是 `146`。
- LRU 缺页次数是 `145`。

这说明两个算法确实走了不同的置换路径。

### curl 验证

本阶段验证 LRU 接口时，把完整响应写入 `/tmp/paging-lru.json`，再读取关键字段：

```bash
curl -s -o /tmp/paging-lru.json -w '%{http_code} %{size_download}\n' 'http://localhost:3000/api/simulations?algorithm=lru&seed=1'
```

关键结果：

```json
{
  "algorithm": "lru",
  "seed": 1,
  "steps": 320,
  "pageFaultCount": 145,
  "firstReplacement": {
    "frameNumber": 0,
    "loadedPageNumber": 13,
    "evictedPageNumber": 7
  }
}
```

后端日志也会输出：

```text
[GET /api/simulations] algorithm=lru seed=1 steps=320 pageFaults=145
```

### 本阶段测试

本阶段新增了 `tests/lru.test.ts`，覆盖了：

- 命中页面时会更新最近使用顺序。
- 缺页且内存满时会替换最久未使用页面。
- 同一 seed 下 LRU 和 FIFO 可以产生不同缺页次数。

同时扩展了模拟器测试，确认 LRU 单步访问也能返回和 FIFO 一致的结果结构。
