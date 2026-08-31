import type { Page } from "playwright";

import {
  CONTACT_MESSAGE,
  KAMERNET_URL,
  STEP_DELAY_MS,
} from "../config/constants.js";
import { getKamer, setKamer } from "../db/connector.js";
import { hasSessionExpired, SessionExpiredError } from "../helpers/session.js";

export async function processRoomHrefs(page: Page, roomHrefs: string[]): Promise<void> {
  for (const href of roomHrefs) {
    if (getKamer(href) !== undefined) {
      console.log(`Overgeslagen (al aanwezig): ${href}`);
      continue;
    }

    console.log(`Wordt gecontroleerd: ${href}`);

    try {
      const roomUrl = new URL(href, KAMERNET_URL);

      await page.goto(roomUrl.href, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("button", { name: "Contacteer verhuurder", exact: true })
        .first()
        .click();
      await page.locator("textarea#message").fill(CONTACT_MESSAGE);
      // await page.getByRole("button", { name: "Verstuur bericht", exact: true }).click();
      await page.waitForTimeout(STEP_DELAY_MS);
      setKamer(href);

      console.log(`Opgeslagen: ${href}`);
    } catch (error) {
      if (await hasSessionExpired(page)) {
        throw new SessionExpiredError({ cause: error });
      }

      const message = error instanceof Error ? error.message : String(error);

      console.error(`Controleren mislukt, niet opgeslagen: ${href} (${message})`);
    }
  }
}
