# PROJECT-BRAIN – kilde, status og tekniske beslutninger

## Formål

ZAK BOOKING er en læringsapplikation til datamatikerprogrammering, bygget i `ZaksenDIku/js-fetch-test`. Krav fra bruger: Java 21, Spring Boot 3.x, Maven, Spring Data JPA, H2 på disk, Bean Validation, HTML/CSS/vanilla JS, reelle REST-svar, interaktivt lagdiagram, JSON Inspector, fejløvelser og begyndervenlig progression.

## Referencer

- `ZaksenDIku/electrostorage` (default branch `final-submission`): verificeret `README.md`, `pom.xml`. Spring Boot 3.3.5, Java 21, Spring Web, Data JPA, H2 og tests.
- `TheRealZak1/electrostorage` (default branch `final-submission`): verificeret `README.md`, `pom.xml`; beskriver Spring Boot/JPA/H2 og JavaScript-lag.
- `ZaksenDIku/ProgrammeringEK`: repo eksisterer og er tilgængeligt, men den oprindelige ElektroStorage-opgavebeskrivelse blev **ikke identificeret**.
- **Oprindelig 24-timers eksamensopgave: IKKE FUNDET.** Ingen ekstra formelle eksamenskrav er antaget.

## Arkitektur / beslutninger

- Én Spring Boot JVM på port 8080 serverer `static/index.html` og `/api/*`.
- `@RestController` tager mod HTTP; `@RestControllerAdvice` bygger fejl-JSON.
- `BookingRequest` og `BookingResponse` record-DTO'er. Bean Validation kører ved `@Valid`.
- `BookingService` ejer regler; repository ejer kun JPA-operationer.
- 30-minutters tidsstart, åben mandag-lørdag 09-17, inkl. fuld behandlingstid.
- Kun én stol/reservation ad gangen. Forhindrer intervaloverlap, ikke bare samme klokkeslæt.
- DELETE er aflysning ved `CANCELLED` (historik beholdes). Aflyste bookinger blokerer ikke nye tider.
- Kunder genbruges ved normaliseret e-mailadresse.
- File-based H2 `./data/zakbooking.mv.db` og seed af 4 behandlinger ved første opstart.
- UI Bordeaux-farver og to hovedområder. Laboratoriet og booking er synlige sammen på desktop.
- JSON Inspector anvender den seneste reelle request/response. Entity-fanen viser kun seneste bekræftede write, ikke en opdigtet SQL-forespørgsel.
- Selvstudie med 8 emner, én kort øvelse pr. emne.
- Ingen login, npm, React, TypeScript eller ekstern API.

## Tests og kontrol

Automatiseret workflow `.github/workflows/ci.yml`:
- `node --check src/main/resources/static/app.js`
- `./mvnw test`
- `BookingApiIntegrationTest`: 200/201/204/400/404/409, CRUD, validering, overlap, availability.
- `FilePersistenceTest`: luk Spring-kontekst og åbn igen med samme H2-fil, verificér ID.
- **Resultat skal aflæses i GitHub Actions**. Dokumentet må ikke opfattes som bevis for et bestået test-run, før workflowet er grønt.

## Udeståender / afgrænsning

- Ikke produktionsklart: ingen auth, roller, personlig databeskyttelse, betaling eller distribueret DB-lock.
- Validering er serverbaseret; frontend required er kun hjælp.
- Tider er lokale `LocalDateTime` uden eksplicit timezone/offset; ved produktion bør tidszoner modelleres tydeligt.
- Flowets kodeuddrag er korte citater fra projektets tilsvarende filer. Ved senere refactoring skal de synkroniseres.
- En rigtig e2e-browsertest med live backend er nyttig, men er ikke del af det automatiske Java/JUnit-workflow.
- Database-skema med `ddl-auto=update` er egnet til øvelser, ikke til produktionsmigration.
