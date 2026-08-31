import { config } from "dotenv";
import { chromium, type Page } from "playwright";

import { getKamer, setKamer } from "./db/connector.js";

config({ quiet: true });

const KAMERNET_URL = "https://kamernet.nl/";
const ALERTS_URL = "https://kamernet.nl/account/alerts";
const LOGIN_TIMEOUT_MS = 120_000;
const STEP_DELAY_MS = 1_000;

async function waitBetweenSteps(page: Page): Promise<void> {
  await page.waitForTimeout(STEP_DELAY_MS);
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(
      `Omgevingsvariabele ${name} ontbreekt. Kopieer .env.example naar .env en vul je gegevens in.`,
    );
  }

  return value;
}

function headlessSetting(): boolean {
  const value = process.env.HEADLESS?.trim().toLowerCase() ?? "false";

  if (value !== "true" && value !== "false") {
    throw new Error("HEADLESS moet true of false zijn.");
  }

  return value === "true";
}

async function acceptCookiesIfShown(page: Page): Promise<void> {
  const acceptButton = page.getByRole("button", { name: /alle accepteren/i });
  const isShown = await acceptButton
    .waitFor({ state: "visible", timeout: 2_500 })
    .then(() => true)
    .catch(() => false);

  if (isShown) {
    await acceptButton.click();
    await waitBetweenSteps(page);
  }
}

async function openLoginPage(page: Page): Promise<void> {
  await page.goto(KAMERNET_URL, { waitUntil: "domcontentloaded" });
  await waitBetweenSteps(page);

  await acceptCookiesIfShown(page);

  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await waitBetweenSteps(page);
  await page.waitForURL((url) => url.hostname === "id.kamernet.nl");
}

async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await waitBetweenSteps(page);

  await page.getByLabel("Wachtwoord", { exact: true }).fill(password);
  await waitBetweenSteps(page);

  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await waitBetweenSteps(page);

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

async function openPrimarySearch(page: Page): Promise<void> {
  await page.goto(ALERTS_URL, { waitUntil: "domcontentloaded" });
  await waitBetweenSteps(page);

  await page
    .getByRole("button", { name: "Voer zoekopdracht uit", exact: true })
    .first()
    .click();
  await waitBetweenSteps(page);
}

async function extractRoomHrefs(page: Page): Promise<string[]> {
  const roomLinks = page.locator('a[target="_blank"][href^="/huren/"]');

  await roomLinks.first().waitFor({ state: "attached" });

  return roomLinks.evaluateAll((links) => [
    ...new Set(
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => href !== null),
    ),
  ]);
}

async function processRoomHrefs(page: Page, roomHrefs: string[]): Promise<void> {
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
        .click();
      await page.locator("textarea#message").fill("ik ben op zoek naar een kamer.");
      // await page.getByRole("button", { name: "Verstuur bericht", exact: true }).click();
      await waitBetweenSteps(page);
      setKamer(href);

      console.log(`Opgeslagen: ${href}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(`Controleren mislukt, niet opgeslagen: ${href} (${message})`);
    }
  }
}

async function main(): Promise<void> {
  const email = requiredEnvironmentVariable("KAMERNET_EMAIL").trim();
  const password = requiredEnvironmentVariable("KAMERNET_PASSWORD");

  if (email.length === 0) {
    throw new Error("KAMERNET_EMAIL mag niet leeg zijn.");
  }

  const headless = headlessSetting();
  const browser = await chromium.launch({ headless });

  try {
    const context = await browser.newContext({ locale: "nl-NL" });
    const page = await context.newPage();

    console.log("Kamernet openen...");
    await openLoginPage(page);

    console.log("Inloggegevens invullen...");
    await logIn(page, email, password);

    console.log("Alertspagina openen en primaire zoekopdracht uitvoeren...");
    await openPrimarySearch(page);

    console.log("Kamerlinks verzamelen...");
    const roomHrefs: string[] = await extractRoomHrefs(page);

    console.log(`Gevonden kamerlinks (${roomHrefs.length}):`);
    console.log(JSON.stringify(roomHrefs, null, 2));

    console.log("Kamerlinks verwerken...");
    await processRoomHrefs(page, roomHrefs);

    console.log(`Huidige pagina: ${page.url()}`);
    console.log("De browser blijft open. Sluit de browser of druk op Ctrl+C om te stoppen.");

    await new Promise<void>((resolve) => {
      browser.once("disconnected", () => resolve());
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Inloggen mislukt: ${message}`);
  process.exitCode = 1;
});
