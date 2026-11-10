# Agentuppdrag: Ärendehistorik i detaljvyn (frontend)

Status: Utkast till plan  
Spec: [docs/specs/ärendehistorik-presentation-detaljvy.md](../specs/ärendehistorik-presentation-detaljvy.md)

## Mål

Implementera frontendutökningen enligt specen: visa ärendets historik på detaljsidan med laddnings-, tomt- och feltillstånd. Hämta historiken via den befintliga endpointen `GET /api/tickets/{id}/history`.

Arbetet omfattar frontendens API-klient, typer, presentation och frontendtester. Ingen backend, inget API-kontrakt, ingen `openapi.json` och ingen grundspecifikation ändras.

## Avgränsning

- Visa `Created` med svensk tidpunkt och API:ts ordning.
- Visa laddning, tom historik och fel enligt AK-6, AK-7 och AK-10–AK-12.
- Ignorera svar för föregående ärende vid navigering och hämta inte om historiken efter statusändring (D-1, D-6).
- Uppdatera befintliga mockade detaljvytester så att historikanropet mockas.
- Ingen återförsöksknapp eller historikhändelser för statusändring/redigering.
- Inga backend-, databas-, grundspecifikations- eller API-kontraktsändringar.
- Lägg inte till paket. Fråga innan filer utanför scope ändras.

## Arbetsordning

### Steg 1: Bekräfta spec och lokala mönster

Läs specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md` och närliggande frontendkod för API-klienten, detaljvyn, statusformuläret och Playwright-testerna.

Följ besluten D-1 till D-7. `datetime` ska motsvara `occurredAt` i ISO-format med millisekunder och `Z`; presentationstexten använder befintliga `formatCreatedAt`. Händelser med okänd `type` filtreras bort. Alla historikfel visar samma felmeddelande.

Om specifikationen och befintligt beteende motsäger varandra, eller om en nödvändig ändring utanför avgränsningen krävs, pausa och fråga om väg framåt.

Specen är uppdaterad och fastställd inför testarbete. Ändra inte grundspecifikationen.

### Steg 2: Skriv frontendtester först

Följ projektets TDD-regel: testerna ska falla på en assertion innan produktionsbeteendet implementeras. Lägg först till en `getTicketHistory`-stubbe med befintligt `notImplemented`-mönster så klienttesterna kan kompileras och falla på den förväntade 501-responsen.

Lägg till `describe('api.getTicketHistory')` i `frontend/src/api/client.test.ts`, enligt mönstret för `getTicket`:

- GET `/tickets/{id}/history` returnerar listan.
- 404 och 500 blir `ApiError` med respektive status.
- Nätverksfel blir `ApiError` med status 0.

Lägg till `frontend/e2e/ticket-history.spec.ts` för fullstackflöden. Återanvänd testdata, tidszon och hjälpare från `frontend/e2e/ticket-detail.spec.ts`. Eftersom AK-numren krockar med den befintliga detaljvyspecen ska testfilens huvudkommentar hänvisa till den här specen. Testa:

- **AK-6:** Området ”Historik” innehåller ett listobjekt med ”Ärendet registrerades”. Tidpunkten visas med `formatCreatedAt(ticket.createdAt, TIME_ZONE)` och `datetime` är `new Date(ticket.createdAt).toISOString()`.
- **D-1:** Ett okänt ticket-id visar ”Ärendet hittades inte” utan historiksektion.
- **D-6:** Registrera historikanrop, spara en ny status och kontrollera att exakt ett historikanrop gjordes.

Lägg till `frontend/e2e-mocked/ticket-history.spec.ts`. Mocka ticket-svaret och historikanropet. Typa svar med klientens typer och mocka fel som `problem+json`. Testa:

- **AK-7:** 500 och nätverksfel var för sig; felmeddelandet visas och ärendets rubrik och statusformulär fungerar.
- **D-5:** 404 ger samma felmeddelande.
- **AK-10:** `[]` visar tomtillstånd utan lista.
- **AK-11:** Fördröjt svar visar ”Laddar historik…” medan ärendets rubrik visas, och laddningstexten försvinner efter svar.
- **AK-12:** En okänd och en känd händelse ger bara det kända listobjektet.

Kör de nya testerna och bekräfta att de faller på assertions.

### Steg 3: Implementera frontendbeteendet

- Lägg till `TicketHistoryEvent` i `frontend/src/types/ticket.ts`, med `type: string` och ISO-sträng för `occurredAt`. Lägg till etikettmappningen för `Created`: ”Ärendet registrerades”.
- Ersätt stubben i `frontend/src/api/client.ts` med ett GET-anrop till `/tickets/{id}/history` och uppdatera dess API-klientkommentar.
- Skapa `frontend/src/features/ticket-detail/TicketHistory.tsx` med `ticketId` som prop. Nyckla resultatet på id och ignorera svar efter navigation/unmount.
- Rendera en `section` med `aria-labelledby`, rubriken ”Historik”, en `ul`, samt alltid monterade `status`- och `alert`-regioner.
- Filtrera händelser vars typ saknar etikett. Om listan blir tom visas tomtillståndet.
- Visa varje tidpunkt med `datetime={new Date(occurredAt).toISOString()}` och `formatCreatedAt(occurredAt)`.
- Alla fel visar ”Historiken kunde inte hämtas. Försök igen.”
- Montera `<TicketHistory ticketId={ticket.id} />` i `TicketDetails` i `TicketDetailPage.tsx`, efter den befintliga kortgridden och i full bredd.

### Steg 4: Uppdatera befintliga mockade tester

Lägg till ett framgångsrikt historiksvar `[]` i ticket-mockarna i `frontend/e2e-mocked/ticket-detail-load.spec.ts` och `frontend/e2e-mocked/ticket-detail-save.spec.ts`. När historikkomponenten renderas gör den annars ett obehindrat anrop utanför testets mockar. Ändra inte befintliga locators eller assertions.

### Steg 5: Verifiera och rapportera

Kör från `frontend/`:

- `npm run lint`
- `npm run typecheck`
- `npm test` (rapportera unit-täckningen)
- `npm run build`
- `npm run test:e2e:mocked`

Kör från repots rot:

- `docker compose -f compose.test.yaml run --build --rm e2e`
- `docker compose -f compose.test.yaml down`

Sabotagekontrollera kritiska tester separat och återställ beteendet efter varje kontroll:

- Ta tillfälligt bort filtreringen av okända typer; AK-12 ska då fallera.
- Hämta historiken igen efter en statussparning; D-6 ska då fallera.
- Ändra felhanteringen av 404; D-5 ska då fallera.

Kontrollera manuellt med skärmläsare att laddnings- och felmeddelandena läses upp. Rapportera faktisk testutskrift, unit-täckning och eventuella hinder. Ändra inte grundspecen eller backend-/API-filer.

## Filer inom scope

- `frontend/src/api/client.ts` — historikhämtning.
- `frontend/src/api/client.test.ts` — klienttester.
- `frontend/src/types/ticket.ts` — historiktyp och typetikett.
- `frontend/src/features/ticket-detail/TicketHistory.tsx` — ny historiksektion.
- `frontend/src/pages/TicketDetailPage.tsx` — montering i `TicketDetails`.
- `frontend/e2e/ticket-history.spec.ts` — fullstacktester.
- `frontend/e2e-mocked/ticket-history.spec.ts` — mockade tester.
- `frontend/e2e-mocked/ticket-detail-load.spec.ts` — mocka historiksvaret.
- `frontend/e2e-mocked/ticket-detail-save.spec.ts` — mocka historiksvaret.

Fråga innan någon fil utanför listan ändras. Lägg inte till paket utan godkännande.

## Avslut och överlämning

Det här dokumentet är en plan, inte ett godkännande att börja implementationen. Invänta klartecken efter planens granskning innan tester eller produktionskod ändras. När uppdraget är klart rapporteras ändrade filer, körda kontroller med faktisk utdata, acceptanskriteriernas testtäckning och eventuella krav som inte kunde verifieras. Gör ingen commit eller push.
