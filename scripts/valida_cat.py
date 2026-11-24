#!/usr/bin/env python3
"""Controlla data/voci-cat.json, i termini catalani di Velisario.

Il file sta accanto a data/voci.json per non toccare i dati di Veliglotta:
  fonti   pesi per il catalano ("cat") delle opere già in data/fonti.json, e le opere
          nuove con sigla, titolo, url e pesi
  voci    per id: "cat", lista di { t, g } come nelle altre lingue, e "fonti",
          citazioni { sigla, termini, url } da aggiungere a quelle della voce

  python3 scripts/valida_cat.py              controlla
  python3 scripts/valida_cat.py --punteggi   mostra anche il livello di verifica di ogni voce

Errori: id inesistente, termini o genere non validi, sigla sconosciuta, opera nuova
senza titolo, peso non valido.
Avvisi: voce senza termini catalani, citazione che non contiene nessun termine catalano
della voce, termine catalano uguale in più voci.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from valida import piega  # noqa: E402

RADICE = Path(__file__).resolve().parent.parent
GENERI = {"m", "f", "loc", "v"}
PESI = {"A", "B", "C"}


def catalogo(fonti_cat):
    """Pesi per il catalano: quelli di voci-cat.json, sulle opere di fonti.json o nuove."""
    cat = {}
    for f in fonti_cat:
        peso = (f.get("pesi") or {}).get("cat")
        if peso:
            cat[f["sigla"]] = peso
    return cat


def contiene(citati, termine):
    t = re.escape(piega(termine))
    return re.search(r"(?<![a-z])" + t + r"(?![a-z])", piega(citati)) is not None


def livello(termini, citazioni, pesi):
    """Come livelli() di valida.py, per il solo catalano: 0 nessuna fonte, 1 solo C,
    2 almeno una B o una A senza secondo riscontro, 3 una A più una A o B."""
    migliori = {}
    for f in citazioni:
        peso = pesi.get(f.get("sigla"))
        if peso and any(contiene(f.get("termini", ""), t["t"]) for t in termini):
            if f["sigla"] not in migliori or peso < migliori[f["sigla"]]:
                migliori[f["sigla"]] = peso
    valori = list(migliori.values())
    forti = sum(1 for p in valori if p in ("A", "B"))
    if "A" in valori and forti >= 2:
        return 3
    if forti:
        return 2
    return 1 if valori else 0


def main(argv):
    voci = json.loads((RADICE / "data/voci.json").read_text(encoding="utf-8"))["voci"]
    base = {f["sigla"]: f for f in json.loads((RADICE / "data/fonti.json").read_text(encoding="utf-8"))["fonti"]}
    dati = json.loads((RADICE / "data/voci-cat.json").read_text(encoding="utf-8"))
    per_id = {v["id"]: v for v in voci}
    errori = avvisi = 0

    def errore(msg):
        nonlocal errori
        print("ERRORE", msg)
        errori += 1

    def avviso(msg):
        nonlocal avvisi
        print("AVVISO", msg)
        avvisi += 1

    sigle = set(base)
    for f in dati.get("fonti", []):
        s = f.get("sigla")
        if not s:
            errore("fonte senza sigla")
            continue
        if s not in base and not (f.get("titolo") and (f.get("url") or f.get("link"))):
            errore(f"{s}: un'opera nuova ha bisogno di titolo e url")
        for lingua, peso in (f.get("pesi") or {}).items():
            if lingua != "cat" or peso not in PESI:
                errore(f"{s}: in voci-cat.json si indica solo il peso per cat, A, B o C")
        sigle.add(s)
    pesi = catalogo(dati.get("fonti", []))

    usati = defaultdict(list)
    livelli = {}
    for k, e in dati.get("voci", {}).items():
        if k not in per_id:
            errore(f"{k}: nessuna voce con questo id in data/voci.json")
            continue
        termini = e.get("cat")
        if not isinstance(termini, list) or not termini:
            errore(f"{k}: serve una lista cat con almeno un termine")
            continue
        for t in termini:
            if not isinstance(t, dict) or not isinstance(t.get("t"), str) or not t["t"].strip():
                errore(f"{k}: termine catalano non valido {t!r}")
            elif t.get("g") not in GENERI:
                errore(f"{k}: genere mancante o non valido per {t['t']!r}")
            else:
                usati[piega(t["t"])].append(k)
        for f in e.get("fonti", []):
            if f.get("sigla") not in sigle:
                errore(f"{k}: sigla sconosciuta {f.get('sigla')!r}")
            elif not any(contiene(f.get("termini", ""), t["t"]) for t in termini if isinstance(t, dict) and t.get("t")):
                avviso(f"[citazione] {k}: {f['sigla']} non cita nessun termine catalano della voce")
        livelli[k] = livello([t for t in termini if isinstance(t, dict) and t.get("t")], e.get("fonti", []), pesi)

    for t, ids in usati.items():
        if len(ids) > 1:
            avviso(f"[duplicati] il termine {t!r} compare in più voci: {', '.join(ids)}")
    mancanti = [v["id"] for v in voci if v["id"] not in dati.get("voci", {})]
    if mancanti:
        avviso(f"[senza catalano] {len(mancanti)} voci: {', '.join(mancanti)}")

    if "--punteggi" in argv:
        for k, n in sorted(livelli.items(), key=lambda x: (x[1], x[0])):
            print(f"{n} {'●' * n}{'○' * (3 - n)} {k}")
    conta = [sum(1 for n in livelli.values() if n == i) for i in range(4)]
    print(f"{len(livelli)} voci con il catalano su {len(voci)}; livelli 0-3: {conta}; {errori} errori, {avvisi} avvisi")
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
