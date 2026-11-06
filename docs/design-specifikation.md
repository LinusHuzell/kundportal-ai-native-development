# UI-specifikation

## Designfilosofi

Contractor Service Portal ska kännas som en modern skandinavisk B2B-applikation.

### Nyckelord

- Professionell
- Pålitlig
- Minimalistisk
- Tydlig informationshierarki
- Anpassad för kontorspersonal som hanterar serviceärenden

---

# Färgpalett

## Primär bakgrund

Mörk marinblå.

**Färgkod:**

```text
#0F1C2E
```

**Används för:**

- Navigationsfält
- Huvudsakliga innehållspaneler
- Ärendelista
- Ärendedetaljer

---

## Sekundär bakgrund

Mörkblå.

**Färgkod:**

```text
#16283D
```

**Används för:**

- Kort (Cards)
- Formulärkontroller
- Innehållssektioner

---

## Accentfärg

Turkos.

**Färgkod:**

```text
#2FB1A5
```

**Används för:**

- Call-to-action-knappar
- Länkar
- Aktiva indikatorer
- Statistik

---

## Textfärger

### Primär text

```text
#FFFFFF
```

### Sekundär text

```text
#AAB6C5
```

### Nedtonad text

```text
#7E8B9A
```

---

## Statusfärger

| Status | Färg |
|----------|----------|
| Nytt | `#2563EB` |
| Pågående | `#F59E0B` |
| Väntar på kund | `#64748B` |
| Stängt | `#16A34A` |

---

## Prioritetsfärger

| Prioritet | Färg |
|------------|----------|
| Låg | `#64748B` |
| Medel | `#F59E0B` |
| Hög | `#DC2626` |

---

# Sidlayout

Sidan består av tre huvudsektioner:

1. Övre navigationsfält
2. Sidhuvud (Header)
3. Huvudsakligt innehållsområde

---

# Övre navigationsfält

**Höjd:** cirka 60 px

### Innehåll

- Företagslogotyp
- Företagsnamn
- Räknare för aktiva ärenden
- Knapp för att skapa arbetsorder
- Användaravatar

### Bakgrund

- Mörk marinblå (`#0F1C2E`)

---

# Huvudinnehåll

- Centrerad container
- Maxbredd: cirka 1200 px
- Tvåkolumnslayout

---

# Vänster kolumn

**Bredd:** cirka 40 %

### Innehåller

- Sökruta
- Filtermeny (Dropdown)
- Ärendelista

### Beteende

- Ärendelistan ska kunna scrollas vertikalt

---

# Höger kolumn

**Bredd:** cirka 60 %

### Innehåller

- Detaljer för valt ärende
- Beskrivningskort
- Ärendemetadata
- Kundinformation

---

# Objekt i ärendelistan

Varje ärende ska visa:

- Ärendenummer
- Titel
- Kundnamn
- Kundföretag
- Prioritetsbadge
- Statusbadge
- Skapandedatum

### Markerat ärende

Valt ärende ska visas med:

- Avvikande bakgrundsfärg
- Markerad kantlinje

---

# Sökruta

Placeras ovanför ärendelistan.

### Innehåll

- Sökningsikon
- Platshållartext

### Utseende

- Rundade hörn
- Mörk bakgrund

---

# Filtermeny (Dropdown)

Placeras bredvid sökrutan.

### Användningsområde

Används för att filtrera:

- Ärendekategorier
- Ärendestatusar

---

# Statistikwidget

Placeras ovanför huvudinnehållet.

### Visar sammanfattningar för

- Totalt antal ärenden
- Nya ärenden
- Högprioriterade ärenden

### Utseende

- Horisontella statistik-kort (Cards)

---

# Kort (Cards)

Alla kort ska ha:

- Rundade hörn
- Diskreta kantlinjer
- Mjuka skuggor

### Designprincip

Undvik tunga visuella effekter.

---

# Typografi

## Typsnitt

**Inter** eller ett liknande modernt sans-serif-typsnitt.

### Rubriker

- Fet stil
- Stor storlek
- Hög kontrast

### Brödtext

- Medium tjocklek
- God läsbarhet

### Metadata

- Liten textstorlek
- Nedtonad färg

---

# Responsivitet

Designen är i första hand anpassad för desktop.

## På mindre skärmar

- Kolumnerna staplas vertikalt
- Ärendelistan visas före ärendedetaljerna
- Statistiksektionen flyttas ovanför huvudinnehållet

---

