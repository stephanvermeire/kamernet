import type { Page } from "playwright";

import {
  COOKIE_CONSENT_TIMEOUT_MS,
  KAMERNET_URL,
  LOGIN_TIMEOUT_MS,
  STEP_DELAY_MS,
} from "../config/constants.js";

export async function authenticate(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto(KAMERNET_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(STEP_DELAY_MS);

  const acceptButton = page.getByRole("button", { name: /alle accepteren/i });
  const cookiesAreShown = await acceptButton
    .waitFor({ state: "visible", timeout: COOKIE_CONSENT_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);

  if (cookiesAreShown) {
    await acceptButton.click();
    await page.waitForTimeout(STEP_DELAY_MS);
  }

  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForTimeout(STEP_DELAY_MS);
  await page.waitForURL((url) => url.hostname === "id.kamernet.nl");

  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.waitForTimeout(STEP_DELAY_MS);
  await page.getByLabel("Wachtwoord", { exact: true }).fill(password);
  await page.waitForTimeout(STEP_DELAY_MS);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForTimeout(STEP_DELAY_MS);

  try {
    await page.waitForURL(
      (url) => url.hostname === "kamernet.nl" || url.hostname === "www.kamernet.nl",
      { timeout: LOGIN_TIMEOUT_MS, waitUntil: "domcontentloaded" },
    );
  } catch {
    throw new Error(
      "Kamernet heeft de login niet binnen twee minuten bevestigd. Controleer je gegevens en rond een eventuele CAPTCHA of extra verificatiestap op tijd af.",
    );
  }
}
