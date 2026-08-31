import type { Page } from "playwright";

export class SessionExpiredError extends Error {
  constructor(options?: ErrorOptions) {
    super("De Kamernet-sessie is verlopen.", options);
    this.name = "SessionExpiredError";
  }
}

export async function hasSessionExpired(page: Page): Promise<boolean> {
  if (new URL(page.url()).hostname === "id.kamernet.nl") {
    return true;
  }

  return page
    .getByRole("button", { name: "Inloggen", exact: true })
    .first()
    .isVisible()
    .catch(() => false);
}
