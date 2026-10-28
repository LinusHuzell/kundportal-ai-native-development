# Docker och developer experience (DX)

Valen i `compose.yaml` och Dockerfiles handlar om hur snabbt man får feedback och hur lite man behöver veta om verktyg och operativsystem. Att köra appen i Docker är medlet, inte målet.

## Valen och deras tradeoffs

| Val | DX-vinst | Pris |
|---|---|---|
| Bind-mount av källkod + `dotnet watch`/Vite | Ändringen syns direkt, utan ombyggnad av image (sekunder i stället för minuter) | Prestanda och filhändelser på macOS/Windows |
| Anonyma volymer för `bin`/`obj`/`node_modules` | Inga OS-konflikter mellan värd och container | Dolda volymer som kan bli inaktuella |
| Polling av filändringar | Hot reload fungerar på alla OS | Lite CPU-last |
| Vite-proxy för `/api` | Ingen CORS-konfiguration, samma URL:er som i produktion | Proxylogik i frontend-konfigurationen |
| Healthcheck + `depends_on` | Inga startordningsfel som försvinner vid omstart | Några sekunders extra väntan vid start |
| Lagerordning (`restore`/`npm ci` före `COPY`) | Snabba ombyggnader | Måste hålla `.csproj` och `package.json` i synk med lagren |
| Allt via `docker compose up` | Ingen installation på värddatorn utöver Docker | Debugging och IDE-stöd blir indirekt |

## Bind-mounts (utveckling) mot multi-stage images (produktion)

### Bind-mounts i utveckling

Fördelar:
- Kodändringar slår igenom utan ombyggnad.
- `dotnet watch` och Vite HMR ger snabb feedback.
- Samma container används över tid.

Nackdelar:
- Miljön skiljer sig från produktion (SDK-image och dev-server i stället för runtime-image och statiska filer).
- Fildelning är långsam på macOS/Windows, vilket är varför polling behövs.
- Filrättigheter kan krångla på Linux (filer skapade i containern som root).
- Anonyma volymer kan bli inaktuella. När `package.json` ändras krävs `docker compose up --build -V` (`-V` = `--renew-anon-volumes`), annars ligger gamla `node_modules` kvar.
- Mer "magi" att felsöka.

### Multi-stage images

Fördelar:
- Små, reproducerbara images med samma artefakt från utveckling till produktion.
- Bygget är isolerat från värddatorn, så "fungerar på min dator" undviks.
- Det som testas är det som levereras.

Nackdelar:
- Varje kodändring kräver ombyggnad av imagen (eller minst ett lager), vilket ger långsam feedback i det dagliga arbetet.
- Ingen hot reload.
- Mer Dockerfile att underhålla (en stage för bygg, en för runtime).

## Rekommendation

- Använd bind-mounts och hot reload under utveckling, där feedbacktiden betyder mest.
- Lägg till multi-stage-Dockerfiles och en separat produktionskonfiguration (till exempel `compose.prod.yaml`) när vi närmar oss deploy. Då väger reproducerbarhet tyngre än snabbhet.
- Compose kan hantera båda, så de utesluter inte varandra.

## Praktiska råd

- Starta med `docker compose up --build`.
- Efter ändringar i beroenden: `docker compose up --build -V`.
- Hot reload fungerar, men första starten och filändringar på macOS/Windows är långsammare.
- Debugging mot containern kräver att man kopplar in sig i den (attach). Om det blir ett problem kan man köra bara backend lokalt och frontend i Docker, eller tvärtom.
