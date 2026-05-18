import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { COURSE_CONFIG } from "../src/config/constants.js";

describe("createApp", () => {
  it("registers the Express application", () => {
    const app = createApp();

    expect(app).toBeDefined();
  });

});

describe("COURSE_CONFIG", () => {
  it("matches the fixed course requirements", () => {
    expect(COURSE_CONFIG).toEqual({
      totalInstructions: 320,
      instructionsPerPage: 10,
      totalPages: 32,
      memoryFrameCount: 4,
    });
  });
});
