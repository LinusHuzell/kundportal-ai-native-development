# Kundserviceportalen

Här samlar ni teamets arbete med Kundserviceportalen i kursen AI Native Development. Ni väljer teknik och bygger en mindre fullstacklösning med AI-stöd. Använd bara påhittade kunduppgifter.

**Uppgift, betygskriterier, veckoförväntningar och deadline finns under Kursexamination i Disco.** Börja där och återvänd dit under arbetet.
[Länk till Disco](https://technigo.disco.co/p/fall-2026-ai-native-development/collection/Q29sbGVjdGlvbjozNzg3Ng==?u=25dab1f8-7abb-463e-a19e-d379efb7caae&drawerTab=comments)

## Kom igång

Projektarbetet börjar vecka 5. Ni får börja frivilligt vecka 4; den veckans fristående kodövning finns kvar.

1. Läs uppgiften och veckans förväntningar i Disco.
2. **En person i teamet skapar en publik fork** från [kursens repository](https://github.com/Technigo/kundportal-ai-native-development) på sitt GitHub-konto. Den personen bjuder in övriga teammedlemmar som **collaborators** via **Settings -> Collaborators -> Add people**. Alla accepterar sin inbjudan och kontrollerar att de kan pusha till teamets fork. Vi kan läsa koden och underlagen i den publika forken utan en separat inbjudan.
3. Klona teamets fork till era datorer.
4. Gör en första förändring: beskriv teamet och er första plan i er dokumentation. Committa och pusha förändringen till `main` i teamets fork. Körbar kod behövs inte för att öppna PR:n.
5. Öppna teamets löpande PR enligt nästa avsnitt.
6. Fortsätt med projektarbetet enligt vecka 5 i Disco.

Ni arbetar i **samma fork** under projektet. Det räcker att en person skapar den. Se [GitHubs instruktion för att bjuda in collaborators](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository) om ni behöver hjälp.

## Branches och pull requests

Teamets löpande PR går **från `main` i teamets fork till `main` i kursens repository**.

| Val i GitHub | Ange |
|---|---|
| Base repository | `Technigo/kundportal-ai-native-development` |
| Base | `main` |
| Head repository | Teamets fork |
| Compare | `main` |

Välj **compare across forks** om båda repositories inte visas. Använd teamets namn i PR-rubriken. Kopiera innehållet i [PR-mallen för teamets projekt](.github/PULL_REQUEST_TEMPLATE/teamets-projekt.md) till beskrivningen och fyll i det som finns vid starten. Resten växer fram under projektet.

Håll samma PR öppen under projektperioden. Den används för uppföljning och inlämning och ska inte mergas till kursens repository under arbetet. Nya commits på teamets `main` syns i samma PR.

Inom teamets fork kan ni använda separata branches för mindre uppgifter och granska dem i interna PR:er till **teamets egen `main`**. Kontrollera vilket repository som är mål innan ni öppnar en intern PR. Gör granskningen spårbar: vem granskade, vad kontrollerades och vad ledde återkopplingen till?

[GitHubs guide för PR från en fork](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork) beskriver valen i gränssnittet.

## Er dokumentation

Ni utformar själva dokumentationen och styrningen av era AI-verktyg utifrån uppgiften i Disco. Länka till teamets gemensamma underlag från den löpande PR:n, så att vi kan följa ert arbete.

## Slutversion och inlämning

När gruppens kod, tester och gemensamma dokumentation är pushade kopierar ni länken till den commit som innehåller slutversionen. Lägg länken överst i teamets löpande PR-beskrivning under **Slutversion för examination**. Kontrollera att länkarna till underlagen visar den inlämnade versionen i teamets fork.

Varje student lämnar sin individuella redovisning som en **Markdown-fil (.md) i sin egen inlämning i Disco**. Märk dokumentet med ditt namn och länka till teamets fork, löpande PR, markerade slutversion och det arbete som visar ditt eget bidrag.

Den individuella redovisningen ska inte läggas i teamets repository eller länkas från teamets PR. Du behöver inte dela dokumentet med dina klasskamrater. Gruppens kod, tester och gemensamma dokumentation finns fortsatt på GitHub.

Följ den aktuella instruktionen och deadlinen i Disco.
