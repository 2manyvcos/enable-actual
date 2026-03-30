const { default: fetch } = require("node-fetch");
const {
  NTFY_URL,
  NTFY_USERNAME,
  NTFY_PASSWORD,
  APP_NAME,
  PUBLIC_URL,
} = require("./config");

function notify(message, url) {
  console.log(`\n\n! ${message}${url ? ` - ${url}` : ""}\n\n`);

  if (NTFY_URL) {
    const headers = new Headers({
      Title: APP_NAME,
      Click: url ?? PUBLIC_URL,
    });

    if (NTFY_USERNAME && NTFY_PASSWORD) {
      headers.set(
        "Authorization",
        `Basic ${Buffer.from(`${NTFY_USERNAME}:${NTFY_PASSWORD}`).toString("base64")}`,
      );
    }

    fetch(NTFY_URL, {
      method: "POST",
      headers,
      body: message,
    });
  }
}

module.exports = notify;
