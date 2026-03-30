const fs = require("fs");
const { DATA_DIR, STATE_FILE } = require("./config");

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch (err) {
      console.error(`Error loading existing state: ${err.message ?? err}`);
    }
  }

  return {};
}
module.exports.loadState = loadState;

function putState(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const currentState = loadState();

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      typeof data === "function"
        ? data(currentState)
        : { ...currentState, ...data },
      null,
      2,
    ),
  );
}
module.exports.putState = putState;
