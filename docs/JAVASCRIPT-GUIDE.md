# JavaScript-guide – begynd med én funktion

**Start i `src/main/resources/static/app.js`.** Læs i denne rækkefølge:
`readForm()` → `saveBooking(event)` → `api(url, options)` → `renderHttp()` → `refreshBookings()`.
Lad resten ligge, til du forstår denne vej.

## 1. let / const og typer

```javascript
let editingId = null;       // ændres senere, når en booking redigeres
const booking = readForm();  // selve variablen bliver ikke ombundet
```

- **String:** `"Zak"` eller `"2026-11-10T14:00:00"`.
- **Number:** `Number(els.treatment.value)` – vælgerens value er ellers tekst.
- **Boolean:** `response.ok` er `true` eller `false`.
- **Array:** listen fra `GET /api/bookings`.
- **Object:** `{ customerName: "Zak", treatmentId: 1 }`.
- **Null:** `editingId = null` når der ikke redigeres.

Tænk på et objekt som en formular med navngivne felter og et array som en liste med formularer.

## 2. Funktion, parametre og return

Fra den rigtige kode:

```javascript
function readForm() {
    return {
        customerName: els.name.value.trim(),
        customerEmail: els.email.value.trim(),
        treatmentId: Number(els.treatment.value),
        startTime: els.time.value
    };
}
```

Funktionen **returnerer** ét JS-objekt; den sender endnu ikke noget til Java. `api(url, options)` modtager derimod **parametre**.

## 3. Events og DOM

```javascript
els.form.addEventListener("submit", saveBooking);
```

Browseren kalder `saveBooking(event)`, når formularen submitter. `event.preventDefault()` forhindrer en normal sidegenindlæsning. `els.notice.textContent = message` opdaterer et HTML-element sikkert.

## 4. Objekt → JSON → HTTP

```javascript
const booking = readForm();
const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking)
};
```

`booking` er en **object-værdi** i JavaScript. `JSON.stringify(booking)` laver en **string** med JSON-tekst, som sendes som HTTP-request body. Du kan se forskellen i JSON Inspector.

## 5. async / await / Promise

```javascript
const response = await fetch(url, options);
const data = response.status === 204 ? null : await response.json();
```

`fetch()` returnerer en **Promise**. `await` venter på resultatet inde i en `async` funktion. `response.json()` læser JSON-tekst fra svaret og konverterer det til en JS-værdi; det er det modsatte led af `JSON.stringify` i dataflowet.

## 6. response.ok / status / try-catch

```javascript
if (!response.ok) {
    const error = new Error(data && data.message ? data.message : "HTTP " + response.status);
    error.status = response.status;
    throw error;
}
```

- 200, 201 og 204 → `response.ok === true`.
- 400, 404 og 409 → `response.ok === false`. **fetch afviser ikke automatisk Promisen**, så vi kaster selv fejl med `throw`.
- Netværksfejl → ingen HTTP-response, og `fetch()` kan afvise direkte; `catch` håndterer den.
- 204 betyder **ingen body**. Kald ikke `response.json()` på den tomme body.

## 7. Network-fanen trin for trin

1. Åbn `http://localhost:8080`.
2. Tryk `⌥⌘I` → **Network** → **Fetch/XHR**.
3. Klik **Manglende navn · 400**.
4. Klik `bookings`-requesten og læs **Headers**, **Payload**, **Response**.
5. Fortæl med egne ord: *Hvorfor svarer controller/validering 400? Hvorfor lander det i JavaScripts fejlhåndtering?*

## 8. Miniøvelse: én ting ad gangen

I appen under **JavaScript fra bunden** kan du vælge ét af otte emner. Hvert emne viser: hvad, hvorfor, analogi, lille diagram, faktisk kodeeksempel, prøv selv, find fejlen og et mundtligt eksamensspørgsmål.

**Huskeregel:** Klik → event → objekt → JSON → fetch → controller → service → database → JSON-svar → DOM.
