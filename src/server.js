const path = require("path");
const express = require("express");
const { engine } = require("express-handlebars");
const cron = require("node-cron");
const { PORT, PUBLIC_URL, SYNC_SCHEDULE, APP_NAME } = require("./config");
const sync = require("./sync");
const ebRouter = require("./eb/router");

console.log(`Starting sync scheduler for ${SYNC_SCHEDULE}…`);
cron.schedule(SYNC_SCHEDULE, sync);

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "./views"));
app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.send(`Hello from ${APP_NAME}`);
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/auth", (req, res) => {
  res.redirect(new URL("eb/auth", PUBLIC_URL).href);
});

app.use("/eb", ebRouter);

app.all("{*splat}", (req, res) => {
  res.status(404).send("Page not found");
});

app.use((error, req, res, next) => {
  console.error(`Error: ${error.message ?? error}`);
  res.status(500).send("Internal server error");
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
