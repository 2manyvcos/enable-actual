const fs = require("fs");
const path = require("path");

module.exports.APP_NAME = process.env.APP_NAME ?? "Enable Actual";

module.exports.PORT = process.env.PORT ?? 3000;

module.exports.SYNC_SCHEDULE = process.env.SYNC_SCHEDULE ?? "0 0 * * *";

module.exports.SYNC_INITIAL_DAYS = Math.max(
  0,
  +process.env.SYNC_INITIAL_DAYS || 30,
);

module.exports.SYNC_OVERSCAN_DAYS = Math.max(
  0,
  +process.env.SYNC_OVERSCAN_DAYS || 7,
);

module.exports.SESSION_EXPIRY_WARNING = Math.max(
  0,
  +process.env.SESSION_EXPIRY_WARNING || 7 * 24 * 60 * 60 * 1000,
);

module.exports.DATA_DIR =
  process.env.DATA_DIR ?? path.join(__dirname, "../data");

module.exports.STATE_FILE = path.join(module.exports.DATA_DIR, "state.json");

module.exports.PUBLIC_URL = (
  process.env.PUBLIC_URL ?? `http://localhost:${module.exports.PORT}`
).replace(/\/*$/, "/");

module.exports.NTFY_URL = process.env.NTFY_URL;

module.exports.NTFY_USERNAME = process.env.NTFY_USERNAME;

module.exports.NTFY_PASSWORD = process.env.NTFY_PASSWORD;

module.exports.EB_API = process.env.EB_API ?? "https://api.enablebanking.com";

module.exports.EB_APP_ID = process.env.EB_APP_ID;
if (!module.exports.EB_APP_ID) {
  console.error(
    "Error: Enable Banking Application ID is missing, please check that EB_APP_ID is set.",
  );
  process.exit(1);
}

module.exports.EB_PRIVATE_KEY_FILE =
  process.env.EB_PRIVATE_KEY_FILE ?? path.join(__dirname, "../private.pem");
if (!fs.existsSync(module.exports.EB_PRIVATE_KEY_FILE)) {
  console.error(
    "Error: Enable Banking Private key is missing, please check that EB_PRIVATE_KEY_FILE is pointing to the location of the key you received when setting up your EnableBanking application.",
  );
  process.exit(1);
}

module.exports.EB_TOKEN_VALIDITY = Math.max(
  0,
  +process.env.EB_TOKEN_VALIDITY || 180 * 24 * 60 * 60 * 1000,
);

module.exports.EB_BANK_NAME = process.env.EB_BANK_NAME;
if (!module.exports.EB_BANK_NAME) {
  console.error(
    "Error: Enable Banking Bank Name is missing, please check that EB_BANK_NAME is set.",
  );
  process.exit(1);
}

module.exports.EB_BANK_COUNTRY = process.env.EB_BANK_COUNTRY;
if (!module.exports.EB_BANK_COUNTRY) {
  console.error(
    "Error: Enable Banking Bank Country is missing, please check that EB_BANK_COUNTRY is set.",
  );
  process.exit(1);
}

module.exports.EB_PSU_TYPE = process.env.EB_PSU_TYPE ?? "personal";

module.exports.ACTUAL_DATA_DIR = path.join(module.exports.DATA_DIR, "actual");

module.exports.ACTUAL_URL = process.env.ACTUAL_URL;
if (!module.exports.ACTUAL_URL) {
  console.error(
    "Error: Actual Budget URL is missing, please check that ACTUAL_URL is set.",
  );
  process.exit(1);
}

module.exports.ACTUAL_PASSWORD = process.env.ACTUAL_PASSWORD;

module.exports.ACTUAL_BUDGET_ID = process.env.ACTUAL_BUDGET_ID;
if (!module.exports.ACTUAL_BUDGET_ID) {
  console.error(
    "Error: Actual Budget Sync ID is missing, please check that ACTUAL_BUDGET_ID is set.",
  );
  process.exit(1);
}

module.exports.ACTUAL_BUDGET_PASSWORD = process.env.ACTUAL_BUDGET_PASSWORD;

module.exports.ACTUAL_ACCOUNT_ID = process.env.ACTUAL_ACCOUNT_ID;
if (!module.exports.ACTUAL_ACCOUNT_ID) {
  console.error(
    "Error: Actual Budget Account ID is missing, please check that ACTUAL_ACCOUNT_ID is set.",
  );
  process.exit(1);
}
