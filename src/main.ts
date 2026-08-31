import { chromium } from "playwright";

import { getApplicationSettings } from "./config/environment.js";
import { hasSessionExpired, SessionExpiredError } from "./helpers/session.js";
import { authenticate } from "./steps/authenticate.js";
import { extractRoomHrefs } from "./steps/extract-room-hrefs.js";
import { openPrimarySearch } from "./steps/open-primary-search.js";
import { processRoomHrefs } from "./steps/process-room-hrefs.js";

async function main(): Promise<void> {
  const { email, password, headless, pollIntervalSeconds } = getApplicationSettings();
  const browser = await chromium.launch({ headless });

  try {
    const context = await browser.newContext({ locale: "nl-NL" });
    const page = await context.newPage();

    console.log("Kamernet openen, cookies accepteren en inloggen...");
    await authenticate(page, email, password);
    console.log(`Continue controle gestart (iedere ${pollIntervalSeconds} seconden).`);

    while (browser.isConnected()) {
      let cycleFinished = false;

      while (!cycleFinished && browser.isConnected()) {
        try {
          console.log("Alertspagina openen en primaire zoekopdracht uitvoeren...");
          await openPrimarySearch(page);

          console.log("Kamerlinks verzamelen...");
          const roomHrefs = await extractRoomHrefs(page);

          console.log(`Gevonden kamerlinks (${roomHrefs.length}):`);
          console.log(JSON.stringify(roomHrefs, null, 2));

          console.log("Kamerlinks verwerken...");
          await processRoomHrefs(page, roomHrefs);
          cycleFinished = true;
        } catch (error) {
          if (!browser.isConnected()) {
            break;
          }

          const sessionExpired =
            error instanceof SessionExpiredError || (await hasSessionExpired(page));

          if (sessionExpired) {
            console.log("Sessie verlopen. Opnieuw inloggen...");
            await authenticate(page, email, password);
            continue;
          }

          const message = error instanceof Error ? error.message : String(error);
          console.error(`Kamercyclus mislukt: ${message}`);
          cycleFinished = true;
        }
      }

      if (!browser.isConnected()) {
        break;
      }

      console.log(`Volgende controle over ${pollIntervalSeconds} seconden...`);
      await page.waitForTimeout(pollIntervalSeconds * 1_000);
    }
  } finally {
    if (browser.isConnected()) {
      await browser.close();
    }
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Automatisering mislukt: ${message}`);
  process.exitCode = 1;
}
