import type { Page } from "playwright";

export async function extractRoomHrefs(page: Page): Promise<string[]> {
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
