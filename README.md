# Velisario

Velisario es una adaptación al español de [Veliglotta](https://github.com/gissimo/veliglotta), el diccionario de vela multilingüe creado por Giorgio Stampa (gissimo). Conserva los términos, las fuentes y el sistema de verificación del original. La interfaz está en español y se puede cambiar al italiano. Las definiciones y notas están traducidas al español de España y adaptadas para lectores hispanohablantes en `data/voci-es.json`; con la interfaz en italiano se muestran las originales. Además, cada ficha tiene una columna CAT con el término catalán y sus fuentes (TERMCAT, Acadèmia Valenciana de la Llengua, DIEC2), en `data/voci-cat.json`.

Los datos se publican con licencia CC BY-SA 4.0, como los originales (ver `LICENSE-DATA.md`); el código, con licencia MIT (ver `LICENSE`). La documentación técnica que sigue es la del proyecto original, en italiano.

---

# Veliglotta

Dizionario di termini velici in inglese, italiano, francese e spagnolo. Sito statico, senza backend, consultabile anche offline una volta visitato.

## Come è fatto

- `data/voci.json`: unica fonte di verità, un oggetto per concetto.
- `data/fonti.json`: catalogo delle fonti citate, una riga per opera.
- `data/voci-cat.json`: termini catalani per id, con le citazioni e i pesi per il catalano delle fonti, controllati da `scripts/valida_cat.py`.
- `data/voci-es.json`: definizioni e note in spagnolo per id, controllate da `scripts/valida_es.py`. Il campo facoltativo `titolo` distingue le schede il cui primo termine spagnolo è uguale, come «través (costado)» e «través (rumbo)».
- `index.html`, `app.js`, `style.css`: interfaccia e ricerca, senza dipendenze.
- `testi.js`: testi dell'interfaccia in spagnolo (predefinito) e italiano.
- `sw.js`, `manifest.webmanifest`, icone: uso offline e installazione sul telefono.

Per provarlo in locale serve un server http, perché aprendo il file direttamente il browser blocca la lettura dei dati:

```
python3 -m http.server
```

## Schema di una voce

Ogni voce è un concetto, non una coppia di parole. Ogni lingua ha una lista di termini, perché sinonimi e varianti sono frequenti.

```
id            slug stabile e univoco, in minuscolo, senza spazi (es. "bozzello")
categoria     scafo | coperta | attrezzatura | vele | manovre | navigazione | meteo | equipaggio
eng, esp, fra, ita  lista di { t: termine, g: "m" | "f" | "loc" | "v" (omesso in inglese tranne "v"; "loc" per le locuzioni senza genere, come au vent; "v" per i verbi, anche in inglese) }
definizione   frase breve in italiano, scritta in modo originale
nota          facoltativa: falsi amici, varianti regionali, differenze d'uso
fonti         lista di { sigla, termini, url }: sigla dell'opera nel catalogo, termini citati dalla fonte, url solo se è una pagina specifica, scritto relativo all'indirizzo dell'opera nel catalogo (per esempio "scafo/" su https://www.treccani.it/vocabolario/)
```

## Catalogo delle fonti

`data/fonti.json` elenca ogni opera citata una sola volta:

```
sigla         abbreviazione univoca, per esempio "TRE" o "WS-ERS"
pesi          peso per ogni lingua coperta dalla fonte, "A" | "B" | "C" come in FONTI.md, per esempio { "fra": "A", "eng": "B" }
titolo        titolo completo dell'opera
url           facoltativo: indirizzo generale dell'opera
link          facoltativo, al posto di url quando l'opera ha più documenti: lista di { testo, url }
```

Gli url relativi delle citazioni si risolvono come i link relativi del web, a partire da `url` o dal primo di `link`. Per questo un indirizzo del catalogo usato come base deve finire con `/` o con il nome di un file: `valida.py` lo controlla.

Nelle schede l'interfaccia mostra solo le sigle, una per opera e in ordine di peso. Il clic apre la pagina specifica della citazione, o in mancanza quella dell'opera, e passando sopra la sigla compaiono i termini citati. Le opere con una versione per lingua (costante `VERSIONI` in `app.js`) mostrano un link per ogni versione citata, per esempio `USCG (ESP, FRA, ITA)`. L'elenco delle sigle con il titolo dell'opera è in fondo alla pagina.

## Punteggio di verifica

Per ogni lingua di ogni voce si calcola un livello da 0 a 3:

- 0: nessuna fonte;
- 1: solo fonti di peso C;
- 2: almeno una fonte B, oppure una A senza secondo riscontro;
- 3: una fonte A e un secondo riscontro A o B di un'altra opera.

Due opere dello stesso ente contano come riscontri distinti se i testi sono diversi. Un'opera che riproduce il testo di un'altra nella stessa lingua (copia, ristampa, versione successiva, traduzione che riporta l'originale) non è un secondo riscontro: in `data/fonti.json` non ha peso per quella lingua, oppure la regola è indicata in `FONTI.md`.

Una citazione conta per una lingua se la fonte copre quella lingua nel catalogo e se il suo campo `termini` contiene uno dei termini della lingua. Nella scheda il livello compare come tre pallini accanto all'etichetta della lingua. `python3 scripts/valida.py --punteggi` stampa la percentuale di ogni voce, cioè la somma dei quattro livelli su 12, e segnala come "completa" una voce con tutte le lingue al livello 3. Il punteggio è l'unica misura di affidabilità: non c'è un campo di stato da aggiornare a mano.

Regole:

- Il primo termine di una lista è quello preferito, gli altri sono sinonimi o varianti.
- Le chiavi delle lingue seguono sempre l'ordine alfabetico dei codici: `eng`, `esp`, `fra`, `ita`. Il controllo dei dati lo segnala con un avviso, senza considerarlo un errore.
- Un sinonimo senza fonte o di bassa confidenza non va tra i termini: si toglie, oppure si cita nella nota. Il punteggio infatti conta qualsiasi termine della lingua.
- Definizioni e note sono scritte da zero. Le fonti restano come riferimento e non vanno copiate.
- Non cambiare mai un `id` esistente. Per nuove categorie, aggiungerle anche a `CATEGORIE` in `app.js`.

## Aggiungere un termine

Il flusso previsto è con Claude Code:

1. Si indica un termine in una lingua, per esempio "aggiungi *bozzello* (it)".
2. Claude cerca fonti, propone le altre tre lingue con genere, categoria e definizione, e segnala dubbi. Le fonti consigliate e il loro peso sono in `FONTI.md`.
3. Si rivede il diff di `data/voci.json` e si approva o si corregge.
4. Il commit su `main` pubblica il sito.

Istruzioni per Claude:

- Modificare solo `data/voci.json` e, per una fonte nuova, `data/fonti.json`, rispettando gli schemi qui sopra, senza toccare codice.
- Inserire le nuove voci a fine file.
- Eseguire `python3 scripts/valida.py` prima di ogni commit: controlla JSON, `id` univoci, categorie, generi, fonti e sigle del catalogo. Lo stesso controllo gira su GitHub a ogni push che tocca `data/` o `scripts/`.
- Segnalare nella nota i termini polisemici e i falsi amici. La confidenza si legge dal punteggio, non si commenta nella nota.

## Script

- `scripts/valida.py`: controlla i dati. Con `--punteggi` stampa il punteggio di ogni voce.
- `scripts/prepara.py`: prepara una voce nuova a partire da un termine e dalle fonti in archivio.
- `scripts/sfoltisci.py`: trova le citazioni doppie. Con `--rimuovi` toglie quelle sicure, con `--dettagli` elenca i casi da valutare.

Una voce nuova si prepara così:

```
python3 scripts/prepara.py cerca TERMINE LINGUA     # ricerca locale, non scrive nulla
python3 scripts/prepara.py scarica TERMINE LINGUA   # salva le pagine dei dizionari online
python3 scripts/prepara.py pagina SIGLA URL         # salva una pagina trovata a mano
python3 scripts/prepara.py crea TERMINE LINGUA      # scrive schede/ID.json
/rivedi ID                                          # in Claude Code: valuta citazioni e voce
python3 scripts/prepara.py aggiungi ID              # inserisce la voce in data/voci.json
```

`LINGUA` è `eng`, `esp`, `fra` o `ita`. Le schede stanno in `schede/` e non vengono pubblicate. `aggiungi` rifiuta una scheda con citazioni non confermate, dati mancanti, termini senza fonte o errori di validazione. I download rispettano `robots.txt`, anche quando una pagina rinvia a un altro indirizzo, e non salvano file oltre 100 MB.

## Pubblicazione

Il sito è pensato per GitHub Pages: Settings, Pages, Source "Deploy from a branch", branch `main`, cartella `/ (root)`. Gli indirizzi sono relativi, quindi funziona anche sotto un sottopercorso come `utente.github.io/veliglotta`.

Il service worker serve ogni risorsa dalla cache e la rinfresca in background. Dopo un aggiornamento dei dati, una modifica appare alla seconda visita. Se si aggiunge o si rimuove un file in `SHELL` dentro `sw.js`, va incrementata la costante `CACHE`.

## Licenze

- Dati (`data/`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.it). Vedi `LICENSE-DATA.md`.
- Codice: MIT. Vedi `LICENSE`.
