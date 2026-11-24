"use strict";

const LINGUE = [
  { codice: "eng", nome: "Inglese" },
  { codice: "esp", nome: "Spagnolo" },
  { codice: "fra", nome: "Francese" },
  { codice: "ita", nome: "Italiano" },
];

const CATEGORIE = {
  scafo: "Scafo",
  coperta: "Coperta",
  attrezzatura: "Attrezzatura",
  vele: "Vele",
  manovre: "Manovre",
  navigazione: "Navigazione",
  meteo: "Meteo",
  equipaggio: "Equipaggio",
};

const GENERE = { m: "m.", f: "f.", loc: "loc.", v: "v." };

const PESI = { A: 0, B: 1, C: 2 };

/* Opere con una versione per lingua: per ognuna, un pezzo dell'indirizzo e l'etichetta
   mostrata nella scheda, in ordine alfabetico. */
const VERSIONI = {
  USCG: [
    ["English-Spanish", "ESP"],
    ["English-French", "FRA"],
    ["English-Italian", "ITA"],
  ],
  MF: [
    ["htmcorso/", "CORSO"],
    ["inglita", "ENG-ITA"],
    ["itaing", "ITA-ENG"],
  ],
  ANTAL: [
    ["antal.it/fr/", "FRA"],
    ["antal.it/it/", "ITA"],
  ],
};

const LIVELLI = [
  "nessuna fonte",
  "solo fonti deboli",
  "una fonte attendibile, senza doppio riscontro",
  "una fonte autorevole e un secondo riscontro",
];

const LINGUA_HTML = { eng: "en", esp: "es", fra: "fr", ita: "it" };

/* Lingua dell'interfaccia, con i testi in testi.js, e lingua dei termini usati
   come titolo delle schede. */
const LINGUA_TITOLO = { es: "esp", it: "ita" };
const CHIAVE_INTERFACCIA = "velisario-interfaccia";
let ui = leggiInterfaccia();

function leggiInterfaccia() {
  try {
    const v = localStorage.getItem(CHIAVE_INTERFACCIA);
    if (v && TESTI[v]) return v;
  } catch {}
  return Object.keys(TESTI)[0];
}

function T() {
  return TESTI[ui];
}

function nomeLingua(codice) {
  return (T().lingue && T().lingue[codice]) || LINGUE.find((l) => l.codice === codice).nome;
}

function nomeCategoria(k) {
  return (T().categorie && T().categorie[k]) || CATEGORIE[k] || k;
}

function livello(n) {
  return (T().livelli || LIVELLI)[n];
}

const stato = { q: "", lingua: "tutte", categoria: "tutte" };
let errore = null;
let statistica = null;
let indice = [];
let voci = [];
let catalogo = new Map();
/* Definizioni e note in spagnolo per id, da data/voci-es.json. */
let traduzioni = {};

const el = {
  q: document.getElementById("q"),
  pulisci: document.getElementById("pulisci"),
  filtroLingua: document.getElementById("filtro-lingua"),
  categoria: document.getElementById("categoria"),
  conteggio: document.getElementById("conteggio"),
  risultati: document.getElementById("risultati"),
  vuoto: document.getElementById("vuoto"),
  errore: document.getElementById("errore"),
  statistiche: document.getElementById("statistiche"),
  sezioneFonti: document.getElementById("fonti"),
  elencoFonti: document.getElementById("elenco-fonti"),
  crediti: document.getElementById("crediti"),
  interfaccia: document.getElementById("lingua-interfaccia"),
};

/* Normalizzazione: minuscolo, senza accenti, trattini e apostrofi come spazi.
   Restituisce anche la mappa dalla posizione normalizzata a quella originale,
   usata per evidenziare le corrispondenze nel testo originale. */
function fold(s) {
  let str = "";
  const map = [];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (c === "-" || c === "'" || c === "’") c = " ";
    const f = c
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace("œ", "oe")
      .replace("æ", "ae");
    for (let k = 0; k < f.length; k++) {
      str += f[k];
      map.push(i);
    }
  }
  return { str, map };
}

function costruisciIndice() {
  indice = [];
  for (const voce of voci) {
    for (const l of LINGUE) {
      for (const termine of voce[l.codice] || []) {
        indice.push({ voce, lingua: l.codice, f: fold(termine.t) });
      }
    }
  }
}

function titolo(voce) {
  const tradotta = ui === "es" && traduzioni[voce.id];
  if (tradotta && tradotta.titolo) return tradotta.titolo;
  const preferita = voce[LINGUA_TITOLO[ui]];
  const t = (preferita && preferita[0]) || (voce.ita && voce.ita[0]) || (voce.eng && voce.eng[0]);
  return t ? t.t : voce.id;
}

function punteggio(voce, q) {
  let migliore = Infinity;
  for (const e of indice) {
    if (e.voce !== voce) continue;
    if (stato.lingua !== "tutte" && e.lingua !== stato.lingua) continue;
    const i = e.f.str.indexOf(q);
    if (i < 0) continue;
    let p;
    if (e.f.str === q) p = 0;
    else if (i === 0) p = 1;
    else if (e.f.str[i - 1] === " ") p = 2;
    else p = 3;
    if (p < migliore) migliore = p;
  }
  return migliore;
}

function cerca() {
  const q = fold(stato.q.trim()).str;
  let lista = voci.filter(
    (v) => stato.categoria === "tutte" || v.categoria === stato.categoria
  );
  if (q) {
    const con = [];
    for (const v of lista) {
      const p = punteggio(v, q);
      if (p !== Infinity) con.push({ v, p });
    }
    con.sort((a, b) => a.p - b.p || titolo(a.v).localeCompare(titolo(b.v), ui));
    return con.map((x) => x.v);
  }
  return lista.sort((a, b) => titolo(a).localeCompare(titolo(b), ui));
}

/* Costruisce un nodo con le corrispondenze di q evidenziate. */
function conEvidenza(testo, q) {
  const frag = document.createDocumentFragment();
  if (!q) {
    frag.append(testo);
    return frag;
  }
  const f = fold(testo);
  const i = f.str.indexOf(q);
  if (i < 0) {
    frag.append(testo);
    return frag;
  }
  const inizio = f.map[i];
  const fine = f.map[i + q.length - 1] + 1;
  frag.append(testo.slice(0, inizio));
  const m = document.createElement("mark");
  m.textContent = testo.slice(inizio, fine);
  frag.append(m);
  frag.append(testo.slice(fine));
  return frag;
}

function nodo(tag, classe, testo) {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (testo !== undefined) n.textContent = testo;
  return n;
}

function scheda(voce, q) {
  const art = nodo("article", "scheda");

  const testa = nodo("div", "scheda-testa");
  testa.append(nodo("h2", "scheda-titolo", titolo(voce)));
  const meta = nodo("div", "scheda-meta");
  meta.append(nodo("span", "categoria", nomeCategoria(voce.categoria)));
  testa.append(meta);
  art.append(testa);

  const griglia = nodo("div", "lingue");
  const lv = livelli(voce);
  for (const l of LINGUE) {
    const blocco = nodo("div", "lingua");
    const etichetta = nodo("span", "lingua-etichetta", l.codice.toUpperCase());
    etichetta.title = nomeLingua(l.codice);
    if (catalogo.size) {
      const n = lv[l.codice];
      const p = nodo("span", "livello", "●".repeat(n) + "○".repeat(3 - n));
      p.title = `${nomeLingua(l.codice)}: ${livello(n)}`;
      p.setAttribute("aria-label", p.title);
      etichetta.append(" ", p);
    }
    blocco.append(etichetta);
    const ul = nodo("ul", "termini");
    ul.lang = LINGUA_HTML[l.codice];
    for (const t of voce[l.codice] || []) {
      const li = nodo("li");
      const sp = nodo("span", "termine");
      sp.append(conEvidenza(t.t, stato.lingua === "tutte" || stato.lingua === l.codice ? q : ""));
      li.append(sp);
      if (t.g) li.append(nodo("span", "genere", GENERE[t.g] || t.g));
      ul.append(li);
    }
    blocco.append(ul);
    griglia.append(blocco);
  }
  art.append(griglia);

  const tradotta = ui === "es" && traduzioni[voce.id];
  for (const campo of ["definizione", "nota"]) {
    const testo = tradotta ? tradotta[campo] : voce[campo];
    if (!testo) continue;
    const n = nodo("p", campo, testo);
    n.lang = tradotta ? "es" : "it";
    art.append(n);
  }

  if (voce.fonti && voce.fonti.length) {
    const p = nodo("p", "fonti", T().fontiScheda);
    gruppiFonti(voce.fonti).forEach((g, i) => {
      if (i) p.append(" · ");
      const c = catalogo.get(g.sigla) || {};
      const base = c.url || (c.link && c.link[0].url);
      const versioni = versioniCitate(g, base);
      if (versioni.length) {
        p.append(nodoVersioni(g, versioni));
        return;
      }
      const url = [...g.citazioni.map((f) => risolvi(f.url, base)), base].find(
        (u) => u && /^https?:\/\//.test(u)
      );
      const n = url ? nodo("a", "sigla", g.sigla) : nodo("span", "sigla", g.sigla);
      if (url) {
        n.href = url;
        n.target = "_blank";
        n.rel = "noopener";
      }
      n.title = g.citazioni.map((f) => f.termini || "").join("; ");
      p.append(n);
    });
    art.append(p);
  }
  return art;
}

/* Le versioni linguistiche citate da una voce. Lista vuota se l'opera non ne ha
   o se una citazione non corrisponde a nessuna versione. */
function versioniCitate(gruppo, base) {
  const regole = VERSIONI[gruppo.sigla];
  if (!regole) return [];
  const conUrl = gruppo.citazioni.map((f) => ({ ...f, assoluto: risolvi(f.url, base) || "" }));
  if (!conUrl.every((f) => regole.some(([pezzo]) => f.assoluto.includes(pezzo)))) return [];
  return regole.flatMap(([pezzo, etichetta]) => {
    const citate = conUrl.filter((f) => f.assoluto.includes(pezzo));
    if (!citate.length) return [];
    return [{ etichetta, url: citate[0].assoluto, termini: citate.map((f) => f.termini || "").join("; ") }];
  });
}

function nodoVersioni(gruppo, versioni) {
  const n = nodo("span", "sigla", `${gruppo.sigla} (`);
  n.title = gruppo.citazioni.map((f) => f.termini || "").join("; ");
  versioni.forEach((v, i) => {
    if (i) n.append(", ");
    const a = link(v.etichetta, v.url);
    a.title = v.termini;
    n.append(a);
  });
  n.append(")");
  return n;
}

/* Gli url delle citazioni possono essere relativi all'indirizzo dell'opera nel catalogo,
   come un link relativo del web: "scafo/" su https://www.treccani.it/vocabolario/. */
function risolvi(url, base) {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

/* Raggruppa le citazioni di una voce per sigla, una sola per opera,
   in ordine di peso e poi di posizione nel catalogo. */
function gruppiFonti(fonti) {
  const gruppi = new Map();
  for (const f of fonti) {
    const c = typeof f === "string" ? { sigla: f } : f;
    const sigla = c.sigla || "";
    if (!gruppi.has(sigla)) gruppi.set(sigla, { sigla, citazioni: [] });
    gruppi.get(sigla).citazioni.push(c);
  }
  const ordine = (s) => {
    const c = catalogo.get(s);
    return c ? Math.min(...Object.values(c.pesi || {}).map((p) => PESI[p] ?? 3), 3) * 1000 + c.indice : 9999;
  };
  return [...gruppi.values()].sort((a, b) => ordine(a.sigla) - ordine(b.sigla));
}

/* Livello di verifica da 0 a 3 per ogni lingua, come livelli in scripts/valida.py:
   una citazione conta se la fonte copre la lingua e tra i suoi termini c'è uno della lingua. */
function livelli(voce) {
  const ris = {};
  for (const l of LINGUE) {
    const termini = (voce[l.codice] || []).map((t) => fold(t.t).str);
    const migliori = new Map();
    for (const f of voce.fonti || []) {
      if (typeof f !== "object") continue;
      const c = catalogo.get(f.sigla);
      const peso = c && c.pesi && c.pesi[l.codice];
      if (!peso) continue;
      const citati = fold(f.termini || "").str;
      const trovato = termini.some((t) =>
        new RegExp("(?<![a-z])" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])").test(citati)
      );
      if (trovato && (!migliori.has(f.sigla) || peso < migliori.get(f.sigla))) migliori.set(f.sigla, peso);
    }
    const pesi = [...migliori.values()];
    const forti = pesi.filter((p) => p === "A" || p === "B").length;
    if (pesi.includes("A") && forti >= 2) ris[l.codice] = 3;
    else if (forti) ris[l.codice] = 2;
    else ris[l.codice] = pesi.length ? 1 : 0;
  }
  return ris;
}

function link(testo, url) {
  const a = nodo("a", null, testo);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function disegnaElencoFonti() {
  const voci = [...catalogo.values()].sort((a, b) => a.sigla.localeCompare(b.sigla, ui));
  el.elencoFonti.replaceChildren(
    ...voci.flatMap((c) => {
      const dt = nodo("dt", null, c.sigla);
      const dd = nodo("dd", null, c.titolo);
      if (c.url) {
        dd.append(" ");
        dd.append(link("(link)", c.url));
      }
      if (c.link) {
        dd.append(" (");
        c.link.forEach((l, i) => {
          if (i) dd.append(", ");
          dd.append(link(l.testo, l.url));
        });
        dd.append(")");
      }
      return [dt, dd];
    })
  );
  el.sezioneFonti.hidden = catalogo.size === 0;
}

function disegna() {
  el.pulisci.hidden = stato.q === "";
  const trovate = cerca();
  const q = fold(stato.q.trim()).str;
  el.risultati.replaceChildren(...trovate.map((v) => scheda(v, q)));
  el.vuoto.hidden = trovate.length !== 0;
  el.conteggio.textContent = T().conteggio(trovate.length, voci.length);
  aggiornaUrl();
}

function aggiornaUrl() {
  const p = new URLSearchParams();
  if (stato.q) p.set("q", stato.q);
  if (stato.lingua !== "tutte") p.set("l", stato.lingua);
  if (stato.categoria !== "tutte") p.set("c", stato.categoria);
  const h = p.toString();
  history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
}

function leggiUrl() {
  const p = new URLSearchParams(location.hash.slice(1));
  stato.q = p.get("q") || "";
  const l = p.get("l");
  stato.lingua = LINGUE.some((x) => x.codice === l) ? l : "tutte";
  const c = p.get("c");
  stato.categoria = c && CATEGORIE[c] ? c : "tutte";
}

function costruisciControlli() {
  const opzioni = [{ codice: "tutte", nome: "Tutte" }, ...LINGUE];
  for (const o of opzioni) {
    const b = nodo("button", "chip");
    b.type = "button";
    b.dataset.lingua = o.codice;
    b.addEventListener("click", () => {
      stato.lingua = o.codice;
      aggiornaChip();
      disegna();
    });
    el.filtroLingua.append(b);
  }

  for (const codice of Object.keys(TESTI)) {
    const b = nodo("button", "chip", codice.toUpperCase());
    b.type = "button";
    b.dataset.ui = codice;
    b.lang = codice;
    b.title = TESTI[codice].nome;
    b.addEventListener("click", () => {
      ui = codice;
      try {
        localStorage.setItem(CHIAVE_INTERFACCIA, codice);
      } catch {}
      applicaTesti();
      if (voci.length) disegna();
    });
    el.interfaccia.append(b);
  }

  el.categoria.addEventListener("change", () => {
    stato.categoria = el.categoria.value;
    disegna();
  });

  el.q.addEventListener("input", () => {
    stato.q = el.q.value;
    disegna();
  });

  const pulisciRicerca = () => {
    el.q.value = "";
    stato.q = "";
    disegna();
  };
  el.pulisci.addEventListener("click", () => {
    pulisciRicerca();
    el.q.blur();
  });
  el.q.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.q.value) {
      e.preventDefault();
      pulisciRicerca();
    }
  });
}

function opzioniCategorie() {
  const tutte = nodo("option", null, T().tutteCategorie);
  tutte.value = "tutte";
  const perNome = Object.keys(CATEGORIE)
    .map((k) => [k, nomeCategoria(k)])
    .sort((a, b) => a[1].localeCompare(b[1], ui));
  el.categoria.replaceChildren(
    tutte,
    ...perNome.map(([k, nome]) => {
      const o = nodo("option", null, nome);
      o.value = k;
      return o;
    })
  );
  el.categoria.value = stato.categoria;
}

/* Scrive nella lingua dell'interfaccia tutti i testi fuori dalle schede. */
function applicaTesti() {
  const t = T();
  document.documentElement.lang = ui;
  document.title = t.titoloPagina;
  document.querySelector('meta[name="description"]').content = t.descrizione;
  for (const n of document.querySelectorAll("[data-t]")) n.textContent = t[n.dataset.t];
  for (const n of document.querySelectorAll("[data-t-aria-label]")) {
    n.setAttribute("aria-label", t[n.dataset.tAriaLabel]);
  }
  for (const n of document.querySelectorAll("[data-t-placeholder]")) {
    n.placeholder = t[n.dataset.tPlaceholder];
  }
  for (const b of el.filtroLingua.children) {
    const c = b.dataset.lingua;
    b.textContent = c === "tutte" ? t.tutte : c.toUpperCase();
    b.title = c === "tutte" ? t.tutte : nomeLingua(c);
  }
  for (const b of el.interfaccia.children) {
    b.setAttribute("aria-pressed", String(b.dataset.ui === ui));
  }
  opzioniCategorie();
  el.crediti.replaceChildren(
    ...t.piede.map((pezzo) => {
      if (typeof pezzo === "string") return pezzo;
      if (pezzo[0] === "ORIGINALE") return link(ORIGINALE.nome, ORIGINALE.url);
      return link(pezzo[0], pezzo[1]);
    })
  );
  if (errore) el.errore.textContent = t[errore];
  disegnaStatistiche();
}

function disegnaStatistiche() {
  if (statistica) el.statistiche.textContent = T().statistiche(statistica.tot, statistica.complete);
}

function aggiornaChip() {
  for (const b of el.filtroLingua.children) {
    b.setAttribute("aria-pressed", String(b.dataset.lingua === stato.lingua));
  }
}

function mostraErrore(chiave) {
  errore = chiave;
  el.errore.textContent = T()[chiave];
  el.errore.hidden = false;
}

async function avvia() {
  costruisciControlli();
  leggiUrl();
  applicaTesti();
  el.q.value = stato.q;
  el.categoria.value = stato.categoria;
  aggiornaChip();

  const spagnolo = fetch("data/voci-es.json")
    .then((r) => (r.ok ? r.json() : { voci: {} }))
    .catch(() => ({ voci: {} }));

  const fonti = fetch("data/fonti.json")
    .then((r) => (r.ok ? r.json() : { fonti: [] }))
    .catch(() => ({ fonti: [] }));

  try {
    const risposta = await fetch("data/voci.json");
    if (!risposta.ok) throw new Error("HTTP " + risposta.status);
    const dati = await risposta.json();
    voci = dati.voci;
  } catch (e) {
    mostraErrore(location.protocol === "file:" ? "erroreFile" : "erroreRete");
    return;
  }

  /* Senza catalogo le schede mostrano comunque le sigle, senza ordine per peso. */
  traduzioni = (await spagnolo).voci || {};
  catalogo = new Map((await fonti).fonti.map((c, indice) => [c.sigla, { ...c, indice }]));
  disegnaElencoFonti();

  costruisciIndice();
  if (catalogo.size) {
    const complete = voci.filter((v) => Object.values(livelli(v)).every((n) => n === 3)).length;
    statistica = { tot: voci.length, complete };
  } else {
    statistica = { tot: voci.length };
  }
  disegnaStatistiche();
  disegna();
}

window.addEventListener("hashchange", () => {
  if (!voci.length) return;
  leggiUrl();
  el.q.value = stato.q;
  el.categoria.value = stato.categoria;
  aggiornaChip();
  disegna();
});

/* Pulsante "Instalar app": apre la richiesta del browser dove esiste (Chrome, Edge),
   mostra le istruzioni su iPhone e iPad, resta nascosto se l'app è già installata. */
const installata =
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ios =
  /iPhone|iPad|iPod/.test(navigator.platform) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const pulsanteInstalla = document.getElementById("installa");
let richiesta = null;

if (!installata) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    richiesta = e;
    pulsanteInstalla.hidden = false;
  });
  if (ios) pulsanteInstalla.hidden = false;
}
window.addEventListener("appinstalled", () => {
  richiesta = null;
  pulsanteInstalla.hidden = true;
});
pulsanteInstalla.addEventListener("click", async () => {
  if (richiesta) {
    richiesta.prompt();
    const { outcome } = await richiesta.userChoice;
    if (outcome === "accepted") pulsanteInstalla.hidden = true;
    richiesta = null;
  } else if (ios) {
    document.getElementById("istruzioni-ios").showModal();
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

avvia();
