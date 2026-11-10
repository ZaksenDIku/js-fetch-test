# Mundtlige eksamensspørgsmål – ZAK BOOKING

Brug skærmen med flowdiagrammet. Besvar **ét spørgsmål ad gangen**, og vis koden, der understøtter svaret.

## Begynder

1. Hvorfor er `const booking = readForm()` et objekt og ikke JSON-tekst?
2. Hvorfor bruger vi `Number(els.treatment.value)` når vi læser et `select`?
3. Hvad betyder `event.preventDefault()`?
4. Hvorfor bruger vi `addEventListener("submit", saveBooking)` uden parenteser efter funktionsnavnet?
5. Hvad returnerer `fetch()`, og hvad gør `await`?
6. Hvad er forskellen på `JSON.stringify()` og `response.json()`?
7. Hvad fortæller `response.status` og `response.ok`?
8. Hvorfor giver HTTP 400 normalt ikke automatisk `catch` i `fetch()`?

## Arkitektur

9. Følg oprettelsen af én booking fra knap til H2 og tilbage til DOM. Navngiv alle lag.
10. Hvorfor validerer vi i DTO/controller **og** i service, når HTML allerede har `required`?
11. Hvad er forskellen på `BookingRequest` DTO, `Booking` entity og `BookingRepository`?
12. Hvorfor er `@ManyToOne` passende fra Booking til Customer og Treatment?
13. Hvorfor må overlaptjekket ligge i service i stedet for repository?
14. Hvad betyder `@Transactional` på en service-metode?

## REST, fejl og persistence

15. Hvornår returnerer vi 200, 201, 204, 400, 404 og 409?
16. Hvorfor skal vi **ikke** kalde `response.json()` ved HTTP 204?
17. Hvad betyder 409 ved overlappende 60- og 30-minutters behandlinger?
18. Hvorfor overlever H2 file-based en genstart, mens en ArrayList og H2 in-memory normalt ikke gør?
19. Hvad er JPA, hvad er Hibernate, og hvilken del er faktisk databasen?
20. Hvorfor er HTTPS ikke erstatning for Bean Validation?
21. Kan to samtidige serverinstanser overskride vores overlapkontrol? Hvordan kunne du gøre det robust i produktion?

## Praktisk demonstration

- Opret en booking og vis POST, JSON-payload og 201 i Network.
- Hent den samme booking med GET og forklar 200.
- Send tomt navn i øvelsen og vis 400 med JSON-besked.
- Send ukendt ID og vis 404.
- Forsøg samme tidspunkt og vis 409.
- Aflys booking og forklar hvorfor HTTP 204 ikke har en JSON-body.
- Luk og genstart appen og vis, at bookingen stadig findes.

**Kort facitidé:** Klik → submit event → `readForm` → `JSON.stringify` → `fetch` → Spring controller/`@Valid` DTO → service → JPA repository → H2 → BookingResponse → `response.json()` → DOM.
