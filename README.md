# ZAK BOOKING ✂️ · full-stack eksamenslab

Et lille, ægte bookingsystem til en frisørsalon med **Java 21 + Spring Boot 3.5 + JPA/Hibernate + H2 på disk** og **HTML/CSS/vanilla JavaScript**. Spring Boot serverer både websiden og REST API'et på samme port. Ingen npm, React eller mock-API.

## Start på Mac (én kommando efter checkout)

```bash
git clone https://github.com/ZaksenDIku/js-fetch-test.git
cd js-fetch-test
git switch feature/zak-booking-fullstack
./mvnw spring-boot:run
```

Åbn **http://localhost:8080**. Stop med `Ctrl+C`. Kræver **Java 21** og internet ved første Maven-download. `./mvnw` bruger din eksisterende Maven, hvis den er installeret; ellers henter den Apache Maven 3.9.11 med SHA-512-kontrol. På Mac har du allerede `curl` og `shasum`. Kontrollér Java med `java -version`. Hvis du får `Permission denied`: `chmod +x mvnw`.

**Test:**

```bash
./mvnw test
node --check src/main/resources/static/app.js
```

**Husk:** Første opstart henter Spring Boot-afhængigheder. H2 gemmer databasen i `data/zakbooking.mv.db` (oprettes automatisk). Nye bookinger overlever genstart. Mappen er ignoreret af Git.

## Prøv det i denne rækkefølge

1. **Booking** – indtast navn, e-mail, behandling, dato og ledig tid. Klik **Opret booking**. Se bookinglisten; rediger eller aflys.
2. **Lær systemet** – klik gennem de 12 trin fra browser til database og tilbage. Kodeklippene er hentet fra projektets filer og viser den faktiske struktur.
3. **JSON Inspector** – sammenlign JavaScript Object, JSON String, HTTP, DTO, Entity/H2 og Response. Vælg en request for at se data.
4. **Fejlfinding** – lav en blank request (400), et ukendt ID (404) og en dobbeltbooking (409). Netværksøvelsen sender mod en utilgængelig localhost-port og giver ingen HTTP-status.
5. **JavaScript fra bunden** – vælg ét emne ad gangen; læs den korte analogi, find fejlen, og forklar kodeflowet mundtligt.

**Developer Tools:** Chrome på Mac: `⌥⌘I` → **Network** → **Fetch/XHR** → klik på en request. Under **Headers** ser du `Request Method` og `Status Code`, under **Payload** JSON, og under **Response** serverens JSON. I **Console** kan du undersøge JavaScript-fejl.

## REST API

| Metode | Endpoint | Succes | Fejl |
|---|---|---|---|
| GET | `/api/treatments` | 200 | – |
| GET | `/api/availability?treatmentId=1&date=2099-11-10` | 200 | 400, 404 |
| GET | `/api/bookings` | 200 | – |
| GET | `/api/bookings/{id}` | 200 | 404 |
| POST | `/api/bookings` | 201 + Location | 400, 404, 409 |
| PUT | `/api/bookings/{id}` | 200 | 400, 404, 409 |
| DELETE | `/api/bookings/{id}` | 204 uden body | 404 |

POST eksempel (vælg en **fremtidig** mandag–lørdag kl. 09–17 med 30-minutters start):

```bash
curl -i -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Zak","customerEmail":"zak@example.dk","treatmentId":1,"startTime":"2099-11-10T10:00:00"}'
```

`startTime` er lokal tid uden tidszone, og salonens åbningstid er mandag–lørdag 09:00–17:00. 30-minutters startintervaller. Overlappende behandlinger blokeres. DELETE er **soft delete**: status bliver `CANCELLED`, så historikken bevares.

Fejlform:

```json
{"status":400,"error":"Bad Request","message":"Kundens navn må ikke være tomt"}
```

**Ikke det samme:** HTTP 400/404/409 = serveren svarede, og `response.ok === false`; netværksfejl = intet HTTP-svar, så `fetch` afviser sin Promise og rammer `catch`.

## Læs kode i denne rækkefølge

`src/main/resources/static/index.html` → `app.js` (læs `readForm`, `api`, `saveBooking`) → `web/BookingController.java` → `dto/BookingRequest.java` → `service/BookingService.java` → `repository/BookingRepository.java` → `model/Booking.java` → `application.properties`.

Dokumentationen ligger i [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/JAVASCRIPT-GUIDE.md](docs/JAVASCRIPT-GUIDE.md), [docs/HTTP-JSON-FLOW.md](docs/HTTP-JSON-FLOW.md), [docs/EXAM-QUESTIONS.md](docs/EXAM-QUESTIONS.md) og [docs/PROJECT-BRAIN.md](docs/PROJECT-BRAIN.md).

## Referencer og afgrænsning

Referencekoden til [ZaksenDIku/electrostorage](https://github.com/ZaksenDIku/electrostorage) og [TheRealZak1/electrostorage](https://github.com/TheRealZak1/electrostorage) indeholder Spring Boot/JPA/H2/JavaScript. [ProgrammeringEK](https://github.com/ZaksenDIku/ProgrammeringEK) er også tilgængeligt. **Den oprindelige 24-timers opgavebeskrivelse blev ikke fundet og er derfor ikke genskabt eller citeret som krav.** ZAK BOOKING har et andet domæne og egen implementering.

Dette er et **eksamenslab**, ikke en produktionsklar frisørsalon: ingen login, ingen betaling, én samlet ressource (én stol), én lokal serverproces. Konfliktkontrol er ikke designet til parallelle multi-server deployments. Ingen kundeoplysninger bør bruges som rigtige følsomme data i dette læringsprojekt.
