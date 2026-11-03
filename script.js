// HTML-elementerne, som vi skal opdatere.
const correctButton = document.querySelector("#correct");
const wrongButton = document.querySelector("#wrong");
const statusText = document.querySelector("#status");
const serverText = document.querySelector("#server");
const whyText = document.querySelector("#why");
const readyText = document.querySelector("#ready");

// Begge knapper bruger samme funktion, men sender forskellige navne.
async function sendRequest(name) {
  correctButton.disabled = true;
  wrongButton.disabled = true;
  statusText.textContent = "Sender…";

  try {
    const response = await fetch("./api/tjek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name })
    });

    const data = await response.json();
    statusText.textContent = `HTTP ${response.status} · response.ok = ${response.ok}`;
    serverText.textContent = JSON.stringify(data, null, 2);
    whyText.textContent = response.ok
      ? "HTTP 200: Serveren fik et navn og accepterede requesten."
      : "HTTP 400: Serveren svarede, men navnet mangler. fetch() går IKKE i catch ved 400.";
  } catch (error) {
    statusText.textContent = "Netværksfejl · ingen HTTP-status";
    serverText.textContent = error.message;
    whyText.textContent = "Her kom der intet HTTP-svar. Derfor havner fetch() i catch — i modsætning til HTTP 400.";
  } finally {
    correctButton.disabled = false;
    wrongButton.disabled = false;
  }
}

// En Service Worker lader os få rigtige 200/400-statusser uden ekstern server.
async function start() {
  if (!("serviceWorker" in navigator)) {
    readyText.textContent = "Denne browser understøtter ikke Service Workers. Prøv Chrome.";
    return;
  }

  try {
    await navigator.serviceWorker.register("./mock-api.js");
    await navigator.serviceWorker.ready;

    // Første gang skal fanen være styret af vores lokale mock-API.
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
      });
    }

    readyText.textContent = "Lokalt mock-API klar · ingen ekstern tjeneste";
    correctButton.disabled = false;
    wrongButton.disabled = false;
  } catch (error) {
    readyText.textContent = "Kunne ikke starte mock-API. Åbn siden via http://localhost:8000 (ikke file://).";
  }
}

correctButton.addEventListener("click", () => sendRequest("Zak"));
wrongButton.addEventListener("click", () => sendRequest(""));
start();
