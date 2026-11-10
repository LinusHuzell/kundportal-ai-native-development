# Arbetssätt: spec-driven development

Varje funktion eller ändring börjar med en spec utifrån [mallen](specs/_mall.md). Testerna skrivs från acceptanskriterierna och koden skrivs sist. Se [teststrategi](teststrategi.md) för testnivåer.

```mermaid
flowchart TD
    A[Behov eller problem] --> B[Skriv spec från mallen]
    B --> C{Öppna frågor eller antaganden?}
    C -- Ja --> D[Besluta och uppdatera spec]
    D --> C
    C -- Nej --> E[Granska och godkänn spec]
    E --> F[Skriv tester från acceptanskriterier]
    F --> G[Se testerna fallera - röd]
    G --> H[Implementera tills testerna går igenom]
    H --> I{Alla AK verifierade?}
    I -- Nej --> H
    I -- Ja --> J[Uppdatera API-kontrakt och ändringshistorik]
    J --> K[Klart]
    H -. beteende saknas i spec .-> L[Föreslå specändring]
    L --> B
```
