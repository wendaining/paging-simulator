# paging-simulator

请求调页存储管理方式模拟程序。项目用于模拟一个作业在请求调页系统中的执行过程，展示指令访问、页号转换、缺页、页面置换、内存块状态和缺页率。

## 功能

- 生成 320 条指令访问序列。
- 支持 FIFO、LRU、CLOCK 三种页面置换算法。
- 支持随机 seed，也支持手动指定 seed 复现结果。
- 提供 Express 后端 API。
- 提供 Vue + Element Plus 前端界面。
- 前端展示课程配置、缺页次数、缺页率、全部模拟记录、页表和换页过程可视化。
- 支持 Electron 客户端目录打包。

## 环境

建议使用 Node.js 24 或较新的 Node.js 20+ 版本。

安装依赖：

```bash
npm install
```

## 后端开发

启动后端服务：

```bash
npm run dev:server
```

后端默认地址：

```text
http://localhost:3000
```

保留的旧命令：

```bash
npm run dev
```

它等价于启动后端服务。

## 前端开发

启动前端开发服务：

```bash
npm run dev:web
```

前端默认地址：

```text
http://127.0.0.1:5173/
```

Vite 会把 `/api` 和 `/health` 代理到后端 `http://127.0.0.1:3000`，所以前端开发时需要同时启动后端和前端。

## API 验证

健康检查：

```bash
curl 'http://localhost:3000/health'
```

课程配置：

```bash
curl 'http://localhost:3000/api/config'
```

生成访问序列：

```bash
curl 'http://localhost:3000/api/instructions?seed=1'
```

运行模拟：

```bash
curl 'http://localhost:3000/api/simulations?algorithm=fifo&seed=1'
curl 'http://localhost:3000/api/simulations?algorithm=lru&seed=1'
curl 'http://localhost:3000/api/simulations?algorithm=clock&seed=1'
```

不传 seed 时，后端会使用当前时间生成随机 seed：

```bash
curl 'http://localhost:3000/api/simulations?algorithm=clock'
```

## 测试和构建

运行测试：

```bash
npm test
```

构建后端：

```bash
npm run build
```

构建前端：

```bash
npm run build:web
```

构建 Electron 主进程：

```bash
npm run build:electron
```

## 常用完整验证流程

```bash
npm install
npm test
npm run build
npm run build:web
npm run build:electron
npm run electron:pack
```

需要做接口联通验证时，另开两个终端：

```bash
npm run dev:server
npm run dev:web
```

然后访问：

```text
http://127.0.0.1:5173/
```

## 项目结构

```text
src/                    后端 API、分页模拟核心逻辑
src/core/algorithms/    FIFO、LRU、CLOCK 页面置换算法
frontend/src/           Vue 前端
electron/               Electron 主进程
tests/                  Vitest 测试
docs/                   课程说明、实现计划和学习笔记
```
