import { createApp } from "./app.js";
import { DEFAULT_PORT } from "./config/constants.js";

const app = createApp();
const port = Number(DEFAULT_PORT);

app.listen(port, () => {
  console.log(`paging-simulator server is running on http://localhost:${port}`);
});
