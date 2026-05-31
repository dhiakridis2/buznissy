import { createApiServer } from "./server.js";

const port = Number.parseInt(process.env.API_PORT || "4000", 10);
const host = process.env.API_HOST || "127.0.0.1";

const server = createApiServer();

server.listen(port, host, () => {
  console.log(`Buznissy API listening on http://${host}:${port}`);
});
