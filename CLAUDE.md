# Veliglotta, istruzioni per Claude

Dizionario velico multilingue (ENG, ESP, FRA, ITA), sito statico pubblicato con GitHub Pages dal ramo `main`. Leggi `README.md` per lo schema dei dati e il flusso di aggiornamento.

## Aggiungere o correggere voci

- Si modifica solo `data/voci.json`, rispettando lo schema del README. Ogni citazione in `fonti` ha la `sigla` di un'opera di `data/fonti.json`: una fonte nuova va aggiunta anche lì, con sigla, pesi per lingua, titolo e url.
- Veliglotta è uno strumento pratico: si registrano i termini velici in uso oggi, non sensi storici o termini tradizionali in disuso. Le note servono a chiarire il significato a chi va in barca: falsi amici, polisemie che creano errori, differenze d'uso tra paesi. Non commentano le fonti: niente "xxx viene da yyy", "poche fonti", "fonte debole", "senza fonte" o "bassa confidenza", perché si legge già dai pallini e dall'elenco delle fonti.
- Il primo termine di ogni lingua è il preferito, gli altri sono sinonimi.
- In ogni voce le chiavi delle lingue stanno in ordine alfabetico del codice: `eng`, `esp`, `fra`, `ita`. Lo stesso ordine vale nell'interfaccia. `scripts/valida.py` segnala un ordine diverso con un avviso, che non è un errore ma va corretto.
- Prima di proporre le traduzioni, cerca fonti sul web. Preferisci dizionari monolingui con marca nautica, federazioni di vela, banche terminologiche come IATE e OQLF, cataloghi dei produttori. Considera i blog e i forum come fonti deboli.
- Consulta anche i documenti nella directory `fonti locali/`, che non è pubblicata. In `fonti` citali come `{ "sigla": "RL", "termini": "termine" }`, senza URL e senza nominare il file, e nelle note chiamali referenze locali. Fa eccezione un libro pubblicato fotografato lì, come il corso dei Glénans: ha una sigla propria nel catalogo (GLN), senza URL.
- Le fonti online già citate sono copiate in `fonti scaricate/`, anch'essa non pubblicata: una cartella per sigla, con il testo estratto in un file `.txt` accanto all'originale, e l'elenco in `indice.tsv`. Cercale lì prima di riaprirle sul web. Merriam-Webster, DLE e DPD non si scaricano in automatico.
- Alcune fonti sono affidabili solo per una parte del vocabolario (per esempio UNIOVI per lo scafo, DEI per scafo e attrezzatura, DLE escluse le accezioni della nave a vele quadre): prima di citarle leggi la sezione "Fonti valide solo per una parte del vocabolario" di `FONTI.md`.
- Inserisci in `fonti` solo ciò che hai letto davvero: sigla, termini citati e, se c'è, l'URL della pagina specifica, per esempio la scheda del termine. Scrivilo relativo all'indirizzo dell'opera nel catalogo, e se è proprio quello non ripeterlo. L'elenco delle fonti già usate e di quelle consigliate, con il loro peso, è in `FONTI.md`: aggiornalo ogni volta che usi una fonte nuova.
- Nel campo `termini` vanno i termini come li scrive la fonte, per esempio `{ "sigla": "TRE", "termini": "scotta", "url": "scotta1/" }`: il punteggio di verifica li confronta con i termini della voce. `python3 scripts/valida.py --punteggi` mostra il punteggio di ogni voce.
- L'affidabilità di una voce è data solo dal punteggio di verifica (vedi `README.md`): non c'è un campo `stato`. Un sinonimo senza fonte o di bassa confidenza non va tra i termini, perché il punteggio conta qualsiasi termine della lingua: toglilo, oppure citalo nella nota.
- Definizioni e note sono scritte da zero, mai copiate dalle fonti.
- Segnala sempre nelle note i termini polisemici e i falsi amici.
- Non cambiare mai un `id` esistente. Una nuova categoria va aggiunta in `app.js` (costante `CATEGORIE`), in `scripts/valida.py` e, con il nome spagnolo, in `testi.js`.
- Per una voce nuova si usa `scripts/prepara.py` con la skill `/rivedi`, come descritto nella sezione "Script" del README. L'inserimento con `prepara.py aggiungi` spetta all'utente. Le schede stanno in `schede/`, che non è pubblicata.

## Velisario

Questo repository è Velisario, un adattamento in spagnolo di Veliglotta (https://github.com/gissimo/veliglotta, di Giorgio Stampa), collegato come remoto `upstream`. Il lettore di riferimento è di madrelingua spagnola, con lo spagnolo di Spagna.

- I testi dell'interfaccia stanno in `testi.js`: ogni testo nuovo va aggiunto sia in `TESTI.es` sia in `TESTI.it`, mai scritto direttamente in `app.js` o `index.html`.
- L'attribuzione a Veliglotta e al suo autore (piè di pagina, `README.md`, `LICENSE`, `LICENSE-DATA.md`) non va mai tolta. Quando cambia ciò che Velisario modifica rispetto all'originale, aggiorna la frase "Cambios respecto al original" in `testi.js`, `index.html` e `LICENSE-DATA.md`.
- Per restare allineati con `upstream`, non modificare il testo italiano di `data/voci.json`.
- Definizioni e note in spagnolo stanno in `data/voci-es.json`, per id. Non sono una traduzione letterale: sono scritte per un lettore spagnolo, quindi i falsi amici si spiegano dal suo punto di vista (per esempio l'italiano orza o deriva), i rimandi usano il termine spagnolo preferito ("véase escota") e i termini italiani si presentano come tali ("en italiano…"). Valgono le stesse regole delle note italiane.
- Quando il primo termine spagnolo è uguale in più voci, ognuna ha in `voci-es.json` un `titolo`: un termine spagnolo della voce, con un qualificatore tra parentesi se serve. I rimandi usano quel titolo e stanno fuori dalle parentesi («…; véase través (rumbo).»). `valida_es.py` segnala titoli uguali e rimandi che non corrispondono a nessun titolo.
- I termini catalani stanno in `data/voci-cat.json`, separati da `voci.json`: per id, `cat` (lista di `{ t, g }` come le altre lingue, con il genere) e `fonti` (citazioni che si aggiungono a quelle della voce). Le opere che contano per il catalano sono elencate all'inizio del file con il loro peso per `cat`; un'opera nuova ci va con titolo e url. La lingua `cat` precede `eng` nell'interfaccia, in ordine alfabetico. Valgono le regole di `FONTI.md`, sezione "Fonti per il catalano": si cita solo ciò che si è letto, e un termine senza fonte non va tra i termini. `python3 scripts/valida_cat.py --punteggi` mostra il livello di ogni voce. Si preferiscono le forme del catalano centrale a quelle valenciane: l'AVL conferma, ma se una fonte catalana dà un'altra forma (per esempio *matafió* invece di *badafió*) si usa quella. Per le voci che le fonti A e B non coprono si accettano fonti C (vedi `FONTI.md`).
- Ogni traduzione porta l'impronta del testo italiano da cui viene. Dopo un aggiornamento da `upstream`, o quando si aggiunge una voce, esegui `python3 scripts/valida_es.py`: segnala le voci senza traduzione e quelle il cui testo italiano è cambiato. Scrivi o rivedi la traduzione, poi `python3 scripts/valida_es.py --firma ID`.

## Controlli prima di ogni commit

```
python3 scripts/valida.py
python3 scripts/valida_es.py
python3 scripts/valida_cat.py
```

Devono terminare senza errori. Lo stesso controllo gira su GitHub a ogni push che tocca `data/` o `scripts/`, ma non blocca la pubblicazione di Pages: un errore va corretto subito.

Se si aggiunge o si rimuove un file elencato in `SHELL` dentro `sw.js`, incrementare la costante `CACHE`.

## Prova in locale

```
python3 -m http.server
```

Poi aprire `http://localhost:8000`. Aprendo `index.html` direttamente i dati non si caricano.
