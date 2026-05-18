import { app as electronApp, BrowserWindow } from "electron";
import express from "express";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../src/app.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDirectory, "..", "..");
const webDistDirectory = path.join(projectRoot, "dist-web");

let backendServer: Server | null = null;

/**
 * 启动 Electron 内置的 Express 服务。
 *
 * @returns 本地服务访问地址。
 */
async function startEmbeddedServer(): Promise<string> {
    const expressApp = createApp();

    expressApp.use(express.static(webDistDirectory));
    expressApp.use((_request, response) => {
        response.sendFile(path.join(webDistDirectory, "index.html"));
    });

    backendServer = createServer(expressApp);

    await new Promise<void>((resolve, reject) => {
        backendServer?.once("error", reject);
        backendServer?.listen(0, "127.0.0.1", () => resolve());
    });

    const address = backendServer.address();

    if (address === null || typeof address === "string") {
        throw new Error("Electron 内置服务启动失败，未获得端口");
    }

    return `http://127.0.0.1:${address.port}`;
}

/**
 * 创建 Electron 主窗口。
 *
 * @param serverUrl 内置 Express 服务地址。
 */
async function createMainWindow(serverUrl: string): Promise<void> {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1024,
        minHeight: 720,
        title: "Paging Simulator",
        backgroundColor: "#f3efe4",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    await mainWindow.loadURL(serverUrl);
}

/**
 * 停止 Electron 内置的 Express 服务。
 */
function stopEmbeddedServer(): void {
    backendServer?.close();
    backendServer = null;
}

electronApp.whenReady().then(async () => {
    const serverUrl = await startEmbeddedServer();

    await createMainWindow(serverUrl);

    electronApp.on("activate", async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow(serverUrl);
        }
    });
});

electronApp.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electronApp.quit();
    }
});

electronApp.on("before-quit", () => {
    stopEmbeddedServer();
});
