const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const {
  PUBLIC_URL,
  EB_API,
  EB_APP_ID,
  EB_PRIVATE_KEY_FILE,
  EB_TOKEN_VALIDITY,
  EB_BANK_NAME,
  EB_BANK_COUNTRY,
  EB_PSU_TYPE,
  APP_NAME,
} = require("../config");
const { putState } = require("../state");
const EBClient = require("./client");

const router = express.Router();

let activeAuth;

router.get("/auth", async (req, res) => {
  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: fs.readFileSync(EB_PRIVATE_KEY_FILE, "utf8"),
  });

  const state = crypto.randomUUID();
  console.log(`Initiating EB authorization attempt ${state}…`);
  activeAuth = await client.initAuth({
    state,
    tokenValidity: EB_TOKEN_VALIDITY,
    bankName: EB_BANK_NAME,
    bankCountry: EB_BANK_COUNTRY,
    psuType: EB_PSU_TYPE,
    redirectURL: new URL("eb/callback", PUBLIC_URL).href,
  });

  res.redirect(activeAuth.url);
});

router.get("/callback", async (req, res) => {
  const { state, code, error, error_description } = req.query;

  if (!state || !code) {
    let errorMessage = `Something went wrong`;
    if (error) errorMessage += ` (${error})`;
    if (error_description) errorMessage += ` - ${error_description}`;
    console.log(`EB callback error: ${errorMessage}`);
    res.status(500).send(errorMessage);
    return;
  }

  if (state !== activeAuth?.state) {
    res.status(400).send("Invalid or outdated request");
    return;
  }

  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: fs.readFileSync(EB_PRIVATE_KEY_FILE, "utf8"),
  });

  const { sessionID, accounts } = await client.getSession({ code });

  if (state !== activeAuth?.state) {
    res.status(400).send("Invalid or outdated request");
    return;
  }

  activeAuth.sessionID = sessionID;

  res.render("select-accounts", {
    appName: APP_NAME,

    action: new URL(`eb/select?state=${encodeURIComponent(state)}`, PUBLIC_URL)
      .href,

    accountOptions: accounts.map((account) => {
      let description = account.name ?? "";
      if (account.details) description += ` | ${account.details}`;
      if (account.account_id?.iban)
        description += ` (IBAN ${account.account_id.iban})`;
      else if (account.uid) description += ` (UID ${account.uid})`;
      return {
        value: account.uid ?? "",
        attrs: account.uid ? undefined : "disabled",
        description,
      };
    }),
  });
});

router.post("/select", (req, res) => {
  const { state } = req.query;

  if (state !== activeAuth?.state) {
    res.status(400).send("Invalid or outdated request");
    return;
  }

  const { validUntil, sessionID } = activeAuth;
  if (!validUntil || !sessionID) {
    res.status(500).send("Internal server error");
    return;
  }

  const { accounts } = req.body;
  const accountUIDs = Array.isArray(accounts)
    ? accounts
    : accounts
      ? [accounts]
      : [];
  if (!accountUIDs.length) {
    res.status(400).send("No accounts selected");
    return;
  }

  putState({
    source: {
      type: "eb",
      sessionID,
      sessionExpiry: validUntil,
      accountUIDs,
    },
  });
  activeAuth = undefined;

  res.send("Done");
});

module.exports = router;
