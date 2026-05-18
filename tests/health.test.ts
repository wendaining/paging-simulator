import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("createApp", () => {
  it("registers the Express application", () => {
    const app = createApp();

    expect(app).toBeDefined();
  });
});
