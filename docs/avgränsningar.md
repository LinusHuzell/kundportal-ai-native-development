# Avgränsning, teknikval och arbetsfördelning

## Teknikval
* **Lokal utvecklingsmiljö:** Docker
* **Databas:** Postgres
* **Backend:** .NET, Entity Framework (ORM)
* **Frontend:** React, Tailwind
* **Design:** Figma
* **Tester:** Playwright

### Motivering
* Backend, frontend och databas valdes utifrån kompetens i gruppen
* Docker valdes eftersom gruppen kör olika operativsystem
* Playwright valdes för att gruppen är nyfiken på att testa
* Figma valdes för att ha en source of truth för designval

---

## Avgränsning

### Ingår
* Registrera ärende: rubrik, beskrivning, kategori, prioritet, aktuell status och tidpunkt, namn, email, ärendenummer (id)
* Kunna redigera ett ärende
* Prioritet: Låg, Medel, Hög
* Kategorier: Beställningar/leveranser, Fakturor, Returer/reklamation, Övrigt
* Statusar: Nytt, Pågående, Väntar på kund, Avslutat
* Spara ärenden så att de finns kvar när applikationen startas om.
* Påhittade kunduppgifter
* Ändra status på ett ärende
* Visa en lista över ärenden och detaljer för ett valt ärende.
* Felhantering:
    * Obligatoriska fält (rubrik, beskrivning, kategori, prioritet, namn, email) kan inte vara tomma eller bara innehålla mellanslag
    * Email valideras mot giltigt format
    * Rubrik och beskrivning har en maxlängd (gräns ej beslutad än)
    * Vid valideringsfel sparas inget ärende, och användaren ser ett 
    begripligt felmeddelande kopplat till rätt fält
* Hantera minst ett felaktivt användningsfall med begripligt besked till användaren.
* Verifiera centrala beteenden med automatiserade tester som omfattar både happy paths och relevanta error paths.
* Ärendehistorik (kompletterande funktion)

### Ingår inte
* Produktionsdrift.
* Molninfrastruktur. 
* Inlogg.
* Att radera ärenden
* Spara utkast av ett ärende
* Versionshistorik för redigeringar (vad som ändrats och när)
* Integrationer med e-post eller andra kanaler.
* AI-funktion i produkten.

---

## Arbetsfördelning

* **Louice:** Visa lista över ärenden (dbcontext, seeddata)
* **Linus:** Visa specifikt ärende, ändra status
* **Carolina:** Registrera ärende, redigera ärende
* **Sebastian:** Docker-setup och körinstruktioner

---

## Öppna frågor
 * Vem tar ärendehistorik?
 * Längdgränser för rubrik/beskrivning?