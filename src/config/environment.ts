import { config } from "dotenv";

import { DEFAULT_POLL_INTERVAL_SECONDS } from "./constants.js";

config({ quiet: true });

export interface ApplicationSettings {
  email: string;
  password: string;
  headless: boolean;
  pollIntervalSeconds: number;
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

function pollIntervalSetting(): number {
  const rawValue = process.env.POLL_INTERVAL_SECONDS?.trim();

  if (rawValue === undefined || rawValue.length === 0) {
    return DEFAULT_POLL_INTERVAL_SECONDS;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("POLL_INTERVAL_SECONDS moet een positief getal zijn.");
  }

  return value;
}

export function getApplicationSettings(): ApplicationSettings {
  const email = requiredEnvironmentVariable("KAMERNET_EMAIL").trim();

  if (email.length === 0) {
    throw new Error("KAMERNET_EMAIL mag niet leeg zijn.");
  }

  return {
    email,
    password: requiredEnvironmentVariable("KAMERNET_PASSWORD"),
    headless: headlessSetting(),
    pollIntervalSeconds: pollIntervalSetting(),
  };
}
