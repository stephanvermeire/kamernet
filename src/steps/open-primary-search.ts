import type { Page } from "playwright";

import { ALERTS_URL, STEP_DELAY_MS } from "../config/constants.js";
import { hasSessionExpired, SessionExpiredError } from "../helpers/session.js";

export async function openPrimarySearch(page: Page): Promise<void> {
  await page.goto(ALERTS_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(STEP_DELAY_MS);

  if (await hasSessionExpired(page)) {
    throw new SessionExpiredError();
  }

  await page
    .getByRole("button", { name: "Voer zoekopdracht uit", exact: true })
    .first()
    .click();
  await page.waitForTimeout(STEP_DELAY_MS);
}
