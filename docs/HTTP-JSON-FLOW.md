# HTTP + JSON: se præcis hvad der sker

## Et faktisk POST-flow

I `app.js` konstrueres dette objekt fra formularfelterne:

```javascript
const booking = {
    customerName: "Zak",
    customerEmail: "zak@example.dk",
    treatmentId: 1,
    startTime: "2099-11-10T10:00:00"
};
```

**Denne datastruktur er et eksempel på en gyldig requestform – ID 1 findes kun, hvis demo-behandlingen stadig har dette ID.** I selve applikationen bruges `readForm()` med de reelle valgte ID'er og tider.

```javascript
JSON.stringify(booking)
// '{"customerName":"Zak","customerEmail":"zak@example.dk","treatmentId":1,"startTime":"2099-11-10T10:00:00"}'
```

HTTP-request:

```http
POST /api/bookings HTTP/1.1
Content-Type: application/json

{"customerName":"Zak","customerEmail":"zak@example.dk","treatmentId":1,"startTime":"2099-11-10T10:00:00"}
```

I Java:

1. `BookingController.create(@Valid @RequestBody BookingRequest request)` – Spring/Jackson omdanner JSON til en Java `BookingRequest`-record.
2. `@NotBlank`, `@Email` og `@NotNull` valideres. Ugyldigt navn → **400**.
3. `BookingService.create` finder behandling, tjekker fremtid/åbningstid/overlap. Ukendt behandling → **404**; overlap → **409**.
4. `CustomerRepository` finder/opretter kunde; `BookingRepository.save` gemmer `Booking`.
5. Hibernate bruger `@ManyToOne` relationer til kunde og behandling og skriver rækkerne til filbaseret H2.
6. Service mapper `Booking` til `BookingResponse` (inklusive oprettet `id` og `customerId`).
7. Controller returnerer **201 Created**, `Location: /api/bookings/{id}` og JSON.
8. JavaScript læser `response.status` og `await response.json()`, opdaterer DOM og henter listen igen.

### Hvad er forskellen på DTO og Entity?

**DTO** er den ydre datapakke over API'et: `BookingRequest` indeholder `customerName`, `customerEmail`, `treatmentId`, `startTime`. **Entity** er database-modellen `Booking`, som har relationer til `Customer` og `Treatment`. Du sender altså ikke hele JPA-objekter over HTTP.

## Statuskoder og data

| Kode | Typisk årsag | JSON-response |
|---|---|---|
| 🟢 200 | GET/PUT lykkes | Dataobjekt eller liste |
| 🟢 201 | POST oprettede booking | BookingResponse |
| 🟢 204 | DELETE aflyste booking | **Ingen body** |
| 🟠 400 | navn mangler eller tidspunkt er ugyldigt | `ApiError` |
| 🟠 404 | booking eller behandling findes ikke | `ApiError` |
| 🟠 409 | tiden er optaget | `ApiError` |
| 📡 Ingen status | netværket/serveren er utilgængelig | **Intet HTTP-response** |

Eksempel på HTTP-fejl fra `ApiExceptionHandler`:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Kundens navn må ikke være tomt"
}
```

### Hvorfor er HTTPS ikke nok?

HTTPS krypterer data **på vejen**. En bruger kan stadig sende `{"customerName":""}` direkte med curl. Derfor kræves validering i Java på serveren, ikke kun `required` i HTML.

## JSON Inspector i applikationen

- **JS Object** er den virkelige JS-værdi i RAM (eller den aktuelle formular før første request).
- **JSON String** er `JSON.stringify(payload)` – en tekstværdi.
- **HTTP** viser metode, URL, headers og JSON body for den seneste request.
- **Java DTO** viser felter og det Java-record, de bindes til (ved POST/PUT).
- **Entity / H2** viser ID/felter fra seneste **bekræftede booking-write**; det er ikke en uafhængig SQL-inspektion.
- **Response** viser faktisk status, `response.ok` og serverens parsed JSON.

Resultater kommer fra rigtige fetch-kald til Spring Boot.
