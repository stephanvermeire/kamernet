# Kamernet-automatisering met Playwright

Een TypeScript-script dat inlogt op Kamernet, de primaire zoekopdracht opent en nieuwe kamers controleert. Reeds gecontroleerde kamerlinks worden opgeslagen in een lokale SQLite-database en bij volgende uitvoeringen overgeslagen.

## Structuur

- `src/main.ts` stuurt de automatisering aan.
- `src/steps` bevat zelfstandige browserstappen die rechtstreeks vanuit `main.ts` worden aangeroepen.
- `src/config` bevat vaste waarden en omgevingsconfiguratie.
- `src/helpers` bevat alleen gedeelde sessiedetectie.
- `src/db` bevat de databaseconnector.

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
POLL_INTERVAL_SECONDS=60
```

`.env` staat in `.gitignore`; commit dit bestand niet.

## Uitvoeren

```powershell
npm start
```

Controleer de TypeScript-code zonder de browser te starten:

```powershell
npm run typecheck
```

Bij CAPTCHA of aanvullende verificatie kun je die in het zichtbare browservenster handmatig afronden. Het script wacht maximaal twee minuten op een geslaagde terugkeer naar Kamernet. Het omzeilt zulke beveiligingsmaatregelen niet.

Het berichtformulier wordt ingevuld, maar de code die het bericht verstuurt staat bewust uitgeschakeld.

Na de eerste login controleert het script direct op nieuwe kamers. Daarna wordt de controle iedere `POLL_INTERVAL_SECONDS` seconden herhaald. Wanneer de Kamernet-sessie verloopt, logt het script opnieuw in en probeert het dezelfde controlecyclus opnieuw.

Gebruik de automatisering in overeenstemming met de voorwaarden van Kamernet. De website kan wijzigen; werk de Playwright-locators bij wanneer labels of routes veranderen.
