# Kamernet-login met Playwright

Een minimale TypeScript-opzet die Kamernet in Chromium opent en inlogt met gegevens uit een lokaal `.env`-bestand. De browser opent standaard zichtbaar en de sessie wordt niet opgeslagen.

## Installeren

Vereisten: Node.js 20 of nieuwer.

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

Vul daarna in `.env` je eigen gegevens in:

```dotenv
KAMERNET_EMAIL=naam@example.com
KAMERNET_PASSWORD=jouw-wachtwoord
HEADLESS=false
```

`.env` staat in `.gitignore`; commit dit bestand niet.

## Uitvoeren

```powershell
npm run login
```

Controleer de TypeScript-code zonder de browser te starten:

```powershell
npm run typecheck
```

Bij CAPTCHA of aanvullende verificatie kun je die in het zichtbare browservenster handmatig afronden. Het script wacht maximaal twee minuten op een geslaagde terugkeer naar Kamernet. Het omzeilt zulke beveiligingsmaatregelen niet.

Gebruik de automatisering in overeenstemming met de voorwaarden van Kamernet. De website kan wijzigen; werk de Playwright-locators bij wanneer labels of de inlogroute veranderen.
