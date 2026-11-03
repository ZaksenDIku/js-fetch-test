# Fetch-lab: forstå HTTP 400

Et lille JavaScript-program til begyndere. **To knapper, én opgave, ingen frameworks eller eksterne API'er.**

## Start lokalt

Åbn Terminal på din Mac:

```bash
git clone https://github.com/ZaksenDIku/js-fetch-test.git
cd js-fetch-test
git switch feature/fetch-400-mini-lab
python3 -m http.server 8000
```

Åbn **http://localhost:8000** i Chrome. Stop serveren med `Ctrl+C`.

> Python bruges kun til at vise de statiske filer lokalt. Selve appen består udelukkende af HTML, CSS og vanilla JavaScript. Intet skal installeres med npm.
>
> Siden skal åbnes via `http://localhost:8000`, **ikke** ved at dobbeltklikke på `index.html` (`file://`). Service Workers kræver localhost eller HTTPS.

Hvis port 8000 er optaget, kan du bruge `python3 -m http.server 8001` og åbne `http://localhost:8001`.

## Prøv begge knapper

1. **Send korrekt request** sender `{"name":"Zak"}`. Du får **HTTP 200** og `response.ok = true`.
2. **Send forkert request** sender `{"name":""}`. Du får **HTTP 400** og `response.ok = false`.
3. Læs det JSON-svar og den forklaring, der vises på siden. Kun én request behandles ad gangen.

**Vigtigt:** En HTTP 400-status er *ikke* en netværksfejl. `fetch()` modtager et svar og fortsætter inde i `try`. Kun når requesten ikke kan få et HTTP-svar, går den normalt i `catch`.

## Se fejlen i Developer Tools

1. Åbn Developer Tools: `⌥⌘I` på Mac (eller `F12`).
2. Gå til **Network**, og klik på **Send forkert request**.
3. Find **api/tjek** i listen (du kan vælge filteret **Fetch/XHR**).
4. Se **Headers → Status Code: 400**, **Payload → name: ""** og **Response → fejl**.
5. Prøv den korrekte knap og sammenlign status **200** og JSON-svaret.

Network kan markere svaret som leveret af **ServiceWorker**, fordi vi simulerer API'et lokalt i browseren.

## Simulér en netværksfejl (anden slags fejl)

Hvis du vil se `catch` i praksis i Chrome:

1. Lad siden være åben. Gå til Developer Tools → **Application → Service Workers**, og slå **Bypass for network** til.
2. Gå til **Network**, og vælg **Offline** i forbindelsesmenuen.
3. Klik på en af knapperne. Der vises nu **Netværksfejl · ingen HTTP-status**. Det er forskelligt fra HTTP 400.
4. Skift tilbage til **Online**, slå **Bypass for network** fra, og genindlæs siden.

## Læs filerne i denne rækkefølge

1. `index.html` – knapperne og de steder, vi viser resultatet.
2. `script.js` – læs først `sendRequest()` for `fetch`, `response.status`, `response.ok` og `catch`. Se derefter `start()`.
3. `mock-api.js` – vores minimale lokale API, der vælger mellem 200 og 400.
4. `style.css` – kun udseendet (bordeauxfarvet).

## Sådan fungerer mock-API'et

`mock-api.js` er en **Service Worker**: et lille JavaScript-script, der kan opfange `fetch()`-requests fra denne side og returnere et `Response`-objekt med status 200 eller 400. Det er derfor **en simulation i browseren, ikke en selvstændig backend**. `curl` eller Postman får ikke disse mock-svar fra Python-serveren.

## Hurtig kontrol

- [ ] Første besøg: knapperne aktiveres, når mock-API'et er klar.
- [ ] Korrekt request: 200, `response.ok = true`, en `besked` i JSON.
- [ ] Forkert request: 400, `response.ok = false`, en `fejl` i JSON.
- [ ] Developer Tools → Network viser request, payload og status.
- [ ] Offline + Bypass for network viser netværksfejl uden HTTP-status.
