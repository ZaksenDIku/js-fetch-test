# Arkitektur – ZAK BOOKING

## Den lodrette vej

```text
Bruger / formular
  ↓ submit-event
app.js: readForm() → JSON.stringify() → fetch(POST)
  ↓ HTTP Content-Type: application/json
BookingController.create(@Valid @RequestBody BookingRequest)
  ↓ Java-record + Bean Validation
BookingService.create()
  ↓ åbningstid, fremtid, 30-min interval, overlap
BookingRepository.save(Booking)
  ↓ Spring Data JPA / Hibernate SQL
H2 file: ./data/zakbooking.mv.db
  ↑ ID og Booking-entity
BookingService.toResponse()
  ↑ BookingResponse DTO
BookingController → HTTP 201 + Location + JSON
  ↑ fetch Response, response.status, response.json()
app.js: opdatér DOM / bookingliste
```

Klikbart tilsvarende diagram er implementeret i `src/main/resources/static/index.html` og `app.js` med 12 trin.

## Hvem gør hvad?

| Lag | Kode | Ansvar |
|---|---|---|
| Browser | `static/app.js` | DOM, events, fetch, JSON, status og øvelser |
| Controller | `web/BookingController.java` | HTTP-metoder, URL, 201/200/204 |
| DTO | `dto/BookingRequest.java` | Request-felter + Bean Validation |
| Service | `service/BookingService.java` | Alle bookingregler; kontrol af overlap |
| Repository | `repository/*Repository.java` | Spring Data JPA databaseoperationer |
| Entity | `model/*.java` | JPA-tabeller, relationer, enum |
| DB | `application.properties` | Filbaseret H2 og Hibernate |

Datamodel: `Booking` har `@ManyToOne` til både `Customer` og `Treatment`, så flere bookinger kan have samme kunde/behandling. `Customer.email` er unik. `Booking.status` gemmes som streng `ACTIVE` eller `CANCELLED`. Behandlingerne seedes **kun hvis tabellen er tom**.

## Ledige tider og dobbeltbooking

En behandling varer 30, 60 eller 90 minutter. Kontrollen er et **intervaloverlap**, ikke kun samme starttid:

```text
Ny tid:        [10:30 -------- 11:00]
Eksisterende:  [10:00 ---------------- 11:00]
→ overlap → HTTP 409
```

Intervaller er halvt åbne: `[start, slut)`. En ny booking, der starter præcis hvor en anden slutter, er derfor lovlig. Tjekket ligger i `BookingService`, ikke repository. Repository leverer listen af mulige aktive overlap.

**Begrænsning:** `synchronized` hjælper lokalt, men giver ikke en garanti ved flere JVM-processer eller tværgående transaktioner. For en rigtig salon med flere servere kræves DB-baseret låsning eller en anden atomisk reservationsstrategi. Formålet her er forståelig lagarkitektur med én serverproces.

## Persistence: sammenligning

| Teknologi | Hvad er det? | Genstart |
|---|---|---|
| RAM | Arbejdshukommelse | Mister indhold |
| `ArrayList` | Java-liste i RAM | Mister indhold |
| H2 in-memory | SQL-database i RAM | Mister normalt data |
| **H2 file-based** | SQL-database på disk | **Bevarer data** |
| MySQL | Separat databaseserver | Bevarer normalt data på disk |
| JPA | Java-standard for ORM/mapping | Er ikke en database |
| Hibernate | JPA-implementering, laver SQL | Er ikke en database |
| Repository | Java-interface til dataadgang | Bruger JPA/DB |

`spring.jpa.hibernate.ddl-auto=update` er praktisk i undervisning, men produktionssystemer bør bruge kontrollerede databasemigrationer.

## Sikkerhed og enkelhed

Frontend-validering giver hurtig feedback, men kan omgås med curl/Postman. Backend gentager validering gennem `@Valid` og service-regler. HTTPS beskytter transporten; det erstatter ikke validering, adgangskontrol eller logik. H2-console er som standard deaktiveret. Ikke et produktionssystem: ingen autentifikation, tidszone-normalisering eller beskyttelse mod parallelle serverinstanser.
