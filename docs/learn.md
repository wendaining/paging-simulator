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
