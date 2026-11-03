"use strict";

// De små funktioner her er bevidst skrevet uden framework.
const $ = id => document.getElementById(id);
const els = {
    form: $("booking-form"), name: $("customer-name"), email: $("customer-email"),
    treatment: $("treatment"), date: $("date"), time: $("time"),
    notice: $("notice"), bookings: $("bookings"), connection: $("connection"),
    availabilityNote: $("availability-note"), save: $("save"), reset: $("reset"),
    stepCount: $("step-count"), stepFile: $("step-file"), stepName: $("step-name"),
    stepWhy: $("step-why"), stepIn: $("step-in"), stepOut: $("step-out"),
    stepCode: $("step-code"), httpResult: $("http-result"),
    scenarioHelp: $("scenario-help"), inspector: $("inspector-code"),
    inspectExplain: $("inspect-explain"), lessonSelect: $("lesson")
};

let editingId = null;
let currentBookings = [];
let lastExchange = null;
let lastSaved = null;
let currentStep = 0;
let currentInspect = "object";

function setNotice(message, kind = "") {
    els.notice.textContent = message;
    els.notice.className = "notice " + kind;
}

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function readForm() {
    return {
        customerName: els.name.value.trim(),
        customerEmail: els.email.value.trim(),
        treatmentId: Number(els.treatment.value),
        startTime: els.time.value
    };
}

// Én rigtig HTTP-funktion bruges af både booking, liste og øvelser.
async function api(url, options = {}) {
    const request = {
        method: options.method || "GET",
        url: url,
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null
    };
    try {
        const response = await fetch(url, options);
        const data = response.status === 204 ? null : await response.json();
        lastExchange = {
            request: request,
            response: {
                status: response.status,
                ok: response.ok,
                contentType: response.headers.get("Content-Type"),
                body: data
            }
        };
        renderHttp();
        renderInspector();

        if (!response.ok) {
            const error = new Error(data && data.message ? data.message : "HTTP " + response.status);
            error.status = response.status;
            throw error;
        }
        return data;
    } catch (error) {
        if (!("status" in error)) {
            lastExchange = { request: request, response: null, networkError: error.message };
            renderHttp();
            renderInspector();
        }
        throw error;
    }
}

async function loadTreatments() {
    const treatments = await api("/api/treatments");
    els.treatment.replaceChildren();
    for (const treatment of treatments) {
        const option = document.createElement("option");
        option.value = String(treatment.id);
        option.textContent = treatment.name + " · " + treatment.durationMinutes + " min · " + treatment.price + " kr.";
        els.treatment.append(option);
    }
    els.connection.textContent = "● Spring Boot online";
    els.connection.className = "connection online";
}

async function loadAvailability(keep = "") {
    if (!els.treatment.value || !els.date.value) return;
    els.time.replaceChildren();
    const wait = document.createElement("option");
    wait.value = "";
    wait.textContent = "Henter ledige tider…";
    els.time.append(wait);
    try {
        const url = "/api/availability?treatmentId=" + encodeURIComponent(els.treatment.value)
            + "&date=" + encodeURIComponent(els.date.value);
        const slots = await api(url);
        els.time.replaceChildren();
        if (keep && !slots.includes(keep)) slots.unshift(keep);
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = slots.length ? "Vælg et tidspunkt" : "Ingen ledige tider";
        els.time.append(placeholder);
        for (const slot of slots) {
            const option = document.createElement("option");
            option.value = slot;
            option.textContent = slot.slice(11, 16);
            els.time.append(option);
        }
        if (keep) els.time.value = keep;
        els.availabilityNote.textContent = slots.length + " ledige starttider · mandag–lørdag kl. 09–17";
    } catch (error) {
        els.time.replaceChildren();
        setNotice(error.message, "error");
    }
}

async function refreshBookings() {
    try {
        currentBookings = await api("/api/bookings");
        els.bookings.replaceChildren();
        if (!currentBookings.length) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.textContent = "Ingen bookinger endnu. Opret den første ovenfor.";
            els.bookings.append(empty);
            return;
        }
        for (const booking of currentBookings) {
            const item = document.createElement("article");
            item.className = "booking-item" + (booking.status === "CANCELLED" ? " cancelled" : "");
            const info = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent = booking.customerName + " · " + booking.treatmentName;
            const time = document.createElement("small");
            time.textContent = booking.startTime.replace("T", " ") + " · #" + booking.id
                + " · " + (booking.status === "ACTIVE" ? "Aktiv" : "Aflyst");
            info.append(name, time);
            item.append(info);
            if (booking.status === "ACTIVE") {
                const actions = document.createElement("div");
                actions.className = "actions";
                for (const [action, label] of [["edit", "Rediger · PUT"], ["cancel", "Aflys · DELETE"]]) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.dataset.action = action;
                    button.dataset.id = String(booking.id);
                    button.textContent = label;
                    actions.append(button);
                }
                item.append(actions);
            }
            els.bookings.append(item);
        }
    } catch (error) {
        setNotice(error.message, "error");
    }
}

async function saveBooking(event) {
    event.preventDefault();
    const booking = readForm();
    const isEdit = editingId !== null;
    const url = isEdit ? "/api/bookings/" + editingId : "/api/bookings";
    const options = {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
    };
    els.save.disabled = true;
    try {
        const saved = await api(url, options);
        lastSaved = saved;
        setNotice("✅ Booking #" + saved.id + (isEdit ? " er opdateret · HTTP 200" : " er gemt · HTTP 201"), "success");
        resetEdit();
        await refreshBookings();
        await loadAvailability();
        renderInspector();
    } catch (error) {
        setNotice("❌ " + error.message + (error.status ? " · HTTP " + error.status : " · netværksfejl"), "error");
    } finally {
        els.save.disabled = false;
    }
}

function resetEdit() {
    editingId = null;
    els.save.textContent = "Opret booking · POST";
    els.reset.hidden = true;
    els.form.reset();
    els.date.value = localDate();
}

async function handleBookingAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const booking = currentBookings.find(item => item.id === id);
    if (!booking) return;
    if (button.dataset.action === "edit") {
        editingId = id;
        els.name.value = booking.customerName;
        els.email.value = booking.customerEmail;
        els.treatment.value = String(booking.treatmentId);
        els.date.value = booking.startTime.slice(0, 10);
        await loadAvailability(booking.startTime);
        els.save.textContent = "Gem ændringer · PUT";
        els.reset.hidden = false;
        els.form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (button.dataset.action === "cancel") {
        if (!window.confirm("Aflys booking #" + id + "? Den bevares i H2 med status CANCELLED.")) return;
        try {
            await api("/api/bookings/" + id, { method: "DELETE" });
            setNotice("Booking #" + id + " er aflyst · HTTP 204", "success");
            await refreshBookings();
            await loadAvailability();
        } catch (error) {
            setNotice(error.message, "error");
        }
    }
}

function nextSampleTime() {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    while (date.getDay() === 0) date.setDate(date.getDate() + 1);
    return localDate(date) + "T10:00:00";
}

async function runScenario(scenario) {
    const sample = { customerName: "Prøve", customerEmail: "prove@example.dk",
        treatmentId: Number(els.treatment.value || 1), startTime: nextSampleTime() };
    els.scenarioHelp.textContent = "Åbn Developer Tools → Network → Fetch/XHR og klik på den seneste request.";
    try {
        if (scenario === "200") await api("/api/treatments");
        if (scenario === "400") {
            sample.customerName = "";
            await api("/api/bookings", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sample)
            });
        }
        if (scenario === "404") await api("/api/bookings/999999999");
        if (scenario === "409") {
            const existing = currentBookings.find(booking => booking.status === "ACTIVE" && booking.startTime > new Date().toISOString());
            if (!existing) {
                els.scenarioHelp.textContent = "Opret først en aktiv booking i fremtiden. Klik derefter på Dobbeltbooking.";
                return;
            }
            sample.treatmentId = existing.treatmentId;
            sample.startTime = existing.startTime;
            await api("/api/bookings", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sample)
            });
        }
        if (scenario === "network") {
            await api("http://127.0.0.1:65530/api/bookings");
        }
    } catch (error) {
        els.scenarioHelp.textContent = error.status
            ? "Serveren sendte HTTP " + error.status + ": " + error.message
            : "Ingen server svarede: fetch() afviste Promise, så vi landede i catch.";
    }
    renderInspector();
}

function renderHttp() {
    const output = els.httpResult;
    output.replaceChildren();
    const chip = document.createElement("span");
    chip.className = "status-chip";
    if (!lastExchange) chip.textContent = "Ingen request endnu";
    else if (!lastExchange.response) chip.textContent = "📡 NETVÆRKSFEJL · ingen HTTP-status";
    else chip.textContent = (lastExchange.response.ok ? "🟢 " : "🟠 ")
        + "HTTP " + lastExchange.response.status + " · response.ok = " + lastExchange.response.ok;
    const pre = document.createElement("pre");
    pre.textContent = !lastExchange ? "Opret en booking eller afprøv et scenarie."
        : JSON.stringify(lastExchange, null, 2);
    output.append(chip, pre);
}

const STEPS = [
    {title:"Brugeren klikker",file:"static/index.html",why:"Formularens knap starter en handling. HTML definerer hvor vi klikker.",input:"Navn, e-mail, behandling og tid",output:"Formularens submit",code:'<button class="primary" id="save" type="submit">Opret booking · POST</button>'},
    {title:"JavaScript-event",file:"static/app.js",why:"addEventListener forbinder klikket med en funktion. preventDefault stopper almindelig sidegenindlæsning.",input:"Submit-event",output:"Kald til saveBooking(event)",code:'els.form.addEventListener("submit", saveBooking);\n// I saveBooking:\nevent.preventDefault();'},
    {title:"JavaScript-objekt",file:"static/app.js",why:"readForm() samler formularens værdier i et almindeligt JS-objekt. Det er endnu ikke JSON-tekst.",input:"Inputfelternes .value",output:"booking-objektet",code:'const booking = readForm();'},
    {title:"JSON.stringify()",file:"static/app.js",why:"HTTP sender tekst/bytes. stringify omdanner objektet til en JSON-streng.",input:"booking-objekt",output:"JSON-tekst i request body",code:'body: JSON.stringify(booking)'},
    {title:"fetch() sender HTTP",file:"static/app.js",why:"fetch er browserens bud. await venter på HTTP-svaret uden at låse hele siden.",input:"POST /api/bookings + JSON",output:"Promise → Response",code:'const response = await fetch(url, options);'},
    {title:"Spring Controller",file:"web/BookingController.java",why:"Controlleren er indgangen til HTTP-API'et. Den tager imod @RequestBody og sender videre til service.",input:"HTTP POST + JSON",output:"BookingRequest + 201 Created",code:'@PostMapping\npublic ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request) {\n    BookingResponse created = service.create(request);\n    return ResponseEntity.created(URI.create("/api/bookings/" + created.id())).body(created);\n}'},
    {title:"DTO + validering",file:"dto/BookingRequest.java",why:"Spring omdanner JSON til Java-record. @Valid tjekker felterne, inden service bliver kaldt.",input:"JSON-felter fra request",output:"Gyldig BookingRequest eller HTTP 400",code:'@NotBlank(message = "Kundens navn må ikke være tomt") String customerName,\n@NotNull(message = "Behandling mangler") @Positive(message = "Behandlings-ID skal være positivt") Long treatmentId,'},
    {title:"Service-regler",file:"service/BookingService.java",why:"Her afgør reglerne, om tidspunktet er ledigt. En dobbeltbooking bliver HTTP 409.",input:"BookingRequest",output:"Godkendt Booking-entity eller ApiException",code:'Treatment treatment = findTreatment(request.treatmentId());\ncheckSlot(request.startTime(), treatment, null);\nCustomer customer = saveCustomer(request);\nBooking booking = new Booking(customer, treatment, request.startTime());\nreturn toResponse(bookings.save(booking));'},
    {title:"JPA Repository",file:"repository/BookingRepository.java",why:"Repository er databaseadgang. Spring Data JPA genererer implementeringen af JpaRepository.",input:"Booking-entity",output:"Gemt Booking med ID",code:'public interface BookingRepository extends JpaRepository<Booking, Long> {\n    List<Booking> findAllByOrderByStartTimeAsc();\n    List<Booking> findByStatusAndStartTimeBefore(BookingStatus status, LocalDateTime before);\n}'},
    {title:"H2 file-database",file:"application.properties",why:"Hibernate/JPA omsætter entity-handlinger til SQL. H2 skriver til ./data/zakbooking.mv.db og overlever genstart.",input:"JPA INSERT/UPDATE/SELECT",output:"Gemte rækker og genererede ID'er",code:'spring.datasource.url=jdbc:h2:file:./data/zakbooking;DB_CLOSE_ON_EXIT=FALSE\nspring.jpa.hibernate.ddl-auto=update'},
    {title:"JSON-response",file:"static/app.js",why:"Serveren sender en statuskode og eventuelt JSON. HTTP 400 er et svar, ikke en netværksfejl.",input:"HTTP-status + response body",output:"JavaScript-objekt fra response.json()",code:'const data = response.status === 204 ? null : await response.json();\nif (!response.ok) {'},
    {title:"DOM opdateres",file:"static/app.js",why:"textContent ændrer det, brugeren ser. Browseren behøver ikke genindlæse hele siden.",input:"BookingResponse eller fejlsvar",output:"Status og bookingliste på skærmen",code:'els.notice.textContent = message;\nawait refreshBookings();'}
];

function renderStep() {
    const step = STEPS[currentStep];
    els.stepCount.textContent = "TRIN " + (currentStep + 1) + " / " + STEPS.length;
    els.stepFile.textContent = step.file;
    els.stepName.textContent = step.title;
    els.stepWhy.textContent = step.why;
    els.stepIn.textContent = step.input;
    els.stepOut.textContent = step.output;
    els.stepCode.textContent = step.code;
    document.querySelectorAll("[data-step]").forEach(button => {
        button.classList.toggle("active", Number(button.dataset.step) === currentStep);
        button.setAttribute("aria-pressed", String(Number(button.dataset.step) === currentStep));
    });
    $("prev-step").disabled = currentStep === 0;
    $("next-step").disabled = currentStep === STEPS.length - 1;
}

function renderJsonTokens(text) {
    const node = els.inspector;
    node.replaceChildren();
    const pattern = /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?|[\[\]{}]/g;
    let last = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        node.append(document.createTextNode(text.slice(last, match.index)));
        const span = document.createElement("span");
        const token = match[0];
        if (token.startsWith('"')) {
            span.className = /^\s*:/.test(text.slice(match.index + token.length)) ? "key" : "string";
        } else if (token === "true" || token === "false") {
            span.className = "boolean";
        } else if (token === "null") {
            span.className = "null";
        } else if (/^-?\d/.test(token)) {
            span.className = "number";
        } else {
            span.className = "key";
        }
        span.textContent = token;
        node.append(span);
        last = pattern.lastIndex;
    }
    node.append(document.createTextNode(text.slice(last)));
}

function renderInspector() {
    const request = lastExchange ? lastExchange.request : null;
    const payload = request && request.body ? request.body : readForm();
    const response = lastExchange ? lastExchange.response : null;
    const labels = {
        object:"JavaScript-objektet består af nøgler og værdier i browserens RAM.",
        json:"JSON.stringify gør objektet til en streng. Tekst er ikke det samme som et JS-objekt.",
        http:"Requesten har en metode, URL, headers og body. I POST sendes JSON-tekst over HTTP.",
        dto:"@RequestBody lader Spring/Jackson omdanne JSON-felterne til BookingRequest (Java).",
        entity:"Service opretter en Booking med relationer til Customer og Treatment; JPA gemmer den i H2.",
        response:"HTTP-status og response.json() kommer tilbage til JavaScript og bliver vist i DOM."
    };
    let value;
    if (currentInspect === "object") value = payload;
    if (currentInspect === "json") value = JSON.stringify(payload);
    if (currentInspect === "http") {
        value = request ? {
            method:request.method, url:request.url,
            headers:request.headers,
            body:request.body ? JSON.stringify(request.body) : null
        } : {info:"Foretag et API-kald for at se en virkelig HTTP-request"};
    }
    if (currentInspect === "dto") value = request && request.body
        ? {javaType:"BookingRequest", fields:request.body}
        : {info:"POST/PUT med JSON bliver til en BookingRequest. GET har ikke denne body."};
    if (currentInspect === "entity") value = lastSaved
        ? {source:"Seneste bekræftede database-write (BookingResponse)", id:lastSaved.id,
            customerId:lastSaved.customerId, treatmentId:lastSaved.treatmentId,
            startTime:lastSaved.startTime, status:lastSaved.status}
        : {info:"Opret en booking, så viser vi ID og felter fra det rigtige server-svar."};
    if (currentInspect === "response") value = response || (lastExchange
        ? {networkError:lastExchange.networkError} : {info:"Intet response endnu"});
    els.inspectExplain.textContent = labels[currentInspect];
    renderJsonTokens(JSON.stringify(value, null, 2));
    document.querySelectorAll("[data-inspect]").forEach(button => {
        button.classList.toggle("selected", button.dataset.inspect === currentInspect);
        button.setAttribute("aria-pressed", String(button.dataset.inspect === currentInspect));
    });
}

const LESSONS = [
    {title:"1. let og const",what:"Variabler er navngivne steder til værdier. const kan ikke ombindes; let kan.",why:"Vi skal huske, hvilken booking vi redigerer.",analogy:"En post-it (let) kan skiftes; en låst etiket (const) peger altid på samme æske.",diagram:"Værdi → variabel → bruges senere",code:"let editingId = null;\nconst booking = readForm();",try:"Find editingId i app.js. Hvornår får den en værdi?",bug:"Hvorfor kan vi ikke skrive booking = 42 bagefter?",question:"Hvornår vælger du let frem for const?"},
    {title:"2. Datatyper og objekt",what:"String, number, boolean, array, object og null er forskellige typer.",why:"Et booking-objekt samler data fra flere felter.",analogy:"En bookingblanket har tekstfelter, talfelter og ja/nej.",diagram:"Inputfelter → { nøgler: værdier }",code:"const booking = readForm();\n// customerName: string, treatmentId: number",try:"Sammenlign Number(els.treatment.value) med .value.",bug:"Hvad er galt med treatmentId: '1', hvis du forventer et tal?",question:"Hvorfor er JSON-tekst ikke et JavaScript-objekt?"},
    {title:"3. Funktion og return",what:"En funktion er genbrugelig kode, der kan tage parametre og returnere en værdi.",why:"Vi samler formularen ét sted, så den kan bruges igen.",analogy:"En opskrift tager ingredienser og giver en ret tilbage.",diagram:"Input → funktion → return-værdi",code:"function readForm() {\n    return {\n        customerName: els.name.value.trim(),\n        customerEmail: els.email.value.trim(),\n        treatmentId: Number(els.treatment.value),\n        startTime: els.time.value\n    };\n}",try:"Find readForm() og forklar hver return-værdi.",bug:"Hvad sker der, hvis du glemmer return?",question:"Hvad er forskellen på en parameter og en return-værdi?"},
    {title:"4. DOM og events",what:"DOM er browserens træ af HTML-elementer; events er handlinger såsom klik.",why:"Vi reagerer på formularen uden at genindlæse siden.",analogy:"En dørklokke (event) fortæller dig, at nogen står ved døren.",diagram:"Submit → event listener → saveBooking",code:'els.form.addEventListener("submit", saveBooking);\n// Inde i funktionen:\nevent.preventDefault();',try:"Tryk 'Opret booking' og se effekten i Network.",bug:"Hvorfor er addEventListener('submit', saveBooking()) forkert her?",question:"Hvad gør preventDefault()?"},
    {title:"5. JSON.stringify",what:"JSON er et tekstformat til udveksling af data.",why:"Java skal kunne læse felterne i vores HTTP-body.",analogy:"Et objekt er tingene i kassen; JSON er pakkelisten på papir.",diagram:"JS Object → JSON String → HTTP body",code:"body: JSON.stringify(booking)",try:"Åbn JSON Inspector og sammenlign første og anden fane.",bug:"Hvad sker der, hvis du sender et objekt direkte som body?",question:"Hvad er forskellen på JSON.stringify og response.json?"},
    {title:"6. fetch og async/await",what:"fetch sender en HTTP-request og giver en Promise; await venter på svar.",why:"Vi kan hente data uden at genindlæse hele siden.",analogy:"Du bestiller kaffe (request), får en kvittering (Promise) og venter på kaffen (response).",diagram:"fetch() → Promise → await → Response",code:"const response = await fetch(url, options);",try:"Vælg HTTP 200-øvelsen og find /api/treatments i Network.",bug:"Hvad sker der, hvis du glemmer await før fetch?",question:"Hvad er en Promise?"},
    {title:"7. HTTP-status og JSON",what:"response.status er tallet; response.ok er true ved 200-299.",why:"HTTP 400, 404 og 409 er svar, vi skal håndtere.",analogy:"Postbuddet kom frem, men ordren blev afvist – ikke en ødelagt vej.",diagram:"Response → status/ok → response.json()",code:"const data = response.status === 204 ? null : await response.json();\nif (!response.ok) {",try:"Klik 'Manglende navn' og find status 400 i Network.",bug:"Hvorfor går fetch ikke automatisk i catch ved HTTP 400?",question:"Hvad betyder status 204 for response.json()?"},
    {title:"8. try/catch og fejl",what:"try/catch fanger fejl og afviste Promises.",why:"Netværksfejl og HTTP-fejl skal behandles forskelligt.",analogy:"Ved en afvist bestilling får du et nej; ved strømsvigt kommer der slet intet svar.",diagram:"try → HTTP-svar eller catch → fejlbesked",code:'const error = new Error(data && data.message ? data.message : "HTTP " + response.status);\nerror.status = response.status;\nthrow error;',try:"Sammenlign øvelserne HTTP 400 og Netværksfejl.",bug:"Hvorfor kan du ikke læse response.status ved en netværksfejl?",question:"Hvad er forskellen på throw og return?"}
];

function renderLesson() {
    const lesson = LESSONS[Number(els.lessonSelect.value)];
    $("lesson-title").textContent = lesson.title;
    $("lesson-what").textContent = "Hvad? " + lesson.what;
    $("lesson-why").textContent = "Hvorfor? " + lesson.why;
    $("lesson-analogy").textContent = "💡 " + lesson.analogy;
    $("lesson-diagram").textContent = lesson.diagram;
    $("lesson-code").textContent = lesson.code;
    $("lesson-try").textContent = lesson.try;
    $("lesson-bug").textContent = lesson.bug;
    $("lesson-question").textContent = lesson.question;
}

async function start() {
    els.date.min = localDate();
    els.date.value = localDate();
    els.form.addEventListener("submit", saveBooking);
    els.bookings.addEventListener("click", handleBookingAction);
    els.treatment.addEventListener("change", () => loadAvailability());
    els.date.addEventListener("change", () => loadAvailability());
    $("refresh").addEventListener("click", refreshBookings);
    els.reset.addEventListener("click", () => { resetEdit(); loadAvailability(); });
    document.querySelectorAll("[data-step]").forEach(button =>
        button.addEventListener("click", () => { currentStep = Number(button.dataset.step); renderStep(); }));
    $("prev-step").addEventListener("click", () => { currentStep--; renderStep(); });
    $("next-step").addEventListener("click", () => { currentStep++; renderStep(); });
    document.querySelectorAll("[data-inspect]").forEach(button =>
        button.addEventListener("click", () => { currentInspect = button.dataset.inspect; renderInspector(); }));
    document.querySelectorAll("[data-scenario]").forEach(button =>
        button.addEventListener("click", () => runScenario(button.dataset.scenario)));
    LESSONS.forEach((lesson, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = lesson.title;
        els.lessonSelect.append(option);
    });
    els.lessonSelect.addEventListener("change", renderLesson);
    renderStep();
    renderLesson();
    renderHttp();
    renderInspector();
    try {
        await loadTreatments();
        await loadAvailability();
        await refreshBookings();
        setNotice("Backend er online. Vælg en ledig tid og opret din første booking.");
    } catch (error) {
        els.connection.textContent = "● Backend ikke tilgængelig";
        els.connection.className = "connection offline";
        setNotice("Kunne ikke forbinde til Spring Boot: " + error.message, "error");
    }
}

start();
