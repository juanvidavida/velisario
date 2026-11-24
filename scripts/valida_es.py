#!/usr/bin/env python3
"""Controlla data/voci-es.json, le definizioni e le note in spagnolo di Velisario.

Ogni traduzione porta in "origine" l'impronta del testo italiano da cui è stata
scritta (definizione e nota di data/voci.json). Se il testo italiano cambia,
l'impronta non corrisponde più e la traduzione va rivista.

  python3 scripts/valida_es.py              controlla e segnala le voci da rivedere
  python3 scripts/valida_es.py --firma      firma le traduzioni senza impronta
  python3 scripts/valida_es.py --firma ID…  rifirma le voci indicate, dopo averle riviste

Il campo facoltativo "titolo" sostituisce il primo termine spagnolo come titolo
della scheda, quando quel termine è uguale in più voci. Deve essere uno dei termini
spagnoli della voce, seguito se serve da un qualificatore tra parentesi:
"través (costado)".

Errori: id inesistente, definizione mancante, campi non validi, impronta mancante,
titolo che non parte da un termine spagnolo della voce.
Avvisi: voce senza traduzione, traduzione da rivedere, titoli spagnoli uguali,
rimandi ("véase …") che non corrispondono al titolo di nessuna scheda.
"""

import hashlib
import json
import re
import sys
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
VOCI = RADICE / "data" / "voci.json"
SPAGNOLO = RADICE / "data" / "voci-es.json"
CAMPI = {"origine", "titolo", "definizione", "nota"}
ORDINE_CAMPI = ("origine", "titolo", "definizione", "nota")


def impronta(voce):
    testo = json.dumps([voce.get("definizione", ""), voce.get("nota", "")], ensure_ascii=False)
    return hashlib.sha256(testo.encode("utf-8")).hexdigest()[:12]


def titolo(voce, t):
    if t and t.get("titolo"):
        return t["titolo"]
    termini = voce.get("esp") or voce.get("ita") or voce.get("eng") or []
    return termini[0]["t"] if termini else voce["id"]


def rimandi_rotti(testo, titoli):
    """Rimandi "véase X" e "véanse X y Y" il cui X non inizia con il titolo di una scheda."""
    rotti = []
    per_lunghezza = sorted(titoli, key=len, reverse=True)
    for m in re.finditer(r"\bv[ée]a(se|nse) (?:también )?", testo, re.IGNORECASE):
        resto = testo[m.end():]
        if resto.startswith(("las ", "los ")):
            continue
        while True:
            trovato = next((t for t in per_lunghezza if resto.lower().startswith(t.lower())), None)
            if not trovato:
                rotti.append(re.split(r"[.;:)]", resto, maxsplit=1)[0])
                break
            resto = resto[len(trovato):]
            if m.group(1) == "nse" and resto.startswith((" y ", ", ")):
                resto = resto[3:] if resto.startswith(" y ") else resto[2:]
                continue
            break
    return rotti


def carica():
    voci = json.loads(VOCI.read_text(encoding="utf-8"))["voci"]
    es = json.loads(SPAGNOLO.read_text(encoding="utf-8")) if SPAGNOLO.exists() else {"schema": 1, "voci": {}}
    return voci, es


def salva(voci, es):
    ordine = {v["id"]: i for i, v in enumerate(voci)}
    es["voci"] = {
        k: {c: es["voci"][k][c] for c in ORDINE_CAMPI if c in es["voci"][k]}
        for k in sorted(es["voci"], key=lambda k: ordine.get(k, len(ordine)))
    }
    SPAGNOLO.write_text(json.dumps(es, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv):
    voci, es = carica()
    per_id = {v["id"]: v for v in voci}

    if argv and argv[0] == "--firma":
        ids = argv[1:] or [k for k, t in es["voci"].items() if "origine" not in t]
        for k in ids:
            if k not in per_id or k not in es["voci"]:
                print(f"ERRORE {k}: voce o traduzione inesistente")
                return 1
            es["voci"][k]["origine"] = impronta(per_id[k])
        salva(voci, es)
        print(f"{len(ids)} traduzioni firmate")
        return 0

    errori = avvisi = 0
    for k, t in es["voci"].items():
        if k not in per_id:
            print(f"ERRORE {k}: nessuna voce con questo id in data/voci.json")
            errori += 1
            continue
        if not isinstance(t, dict) or set(t) - CAMPI:
            print(f"ERRORE {k}: campi ammessi solo {', '.join(sorted(CAMPI))}")
            errori += 1
            continue
        if not isinstance(t.get("definizione"), str) or not t["definizione"].strip():
            print(f"ERRORE {k}: definizione mancante")
            errori += 1
        if "nota" in t and (not isinstance(t["nota"], str) or not t["nota"].strip()):
            print(f"ERRORE {k}: nota vuota o non valida")
            errori += 1
        if "titolo" in t:
            base = t["titolo"].split(" (")[0] if isinstance(t["titolo"], str) else None
            if base not in [x["t"] for x in per_id[k].get("esp", [])]:
                print(f"ERRORE {k}: il titolo deve iniziare con un termine spagnolo della voce")
                errori += 1
        if "origine" not in t:
            print(f"ERRORE {k}: impronta mancante, esegui --firma dopo aver controllato la traduzione")
            errori += 1
        elif t["origine"] != impronta(per_id[k]):
            v = per_id[k]
            print(f"AVVISO [da rivedere] {k}: il testo italiano è cambiato")
            print(f"    definizione: {v.get('definizione', '')}")
            if v.get("nota"):
                print(f"    nota: {v['nota']}")
            avvisi += 1

    titoli = {}
    for v in voci:
        titoli.setdefault(titolo(v, es["voci"].get(v["id"])), []).append(v["id"])
    for t, ids in titoli.items():
        if len(ids) > 1:
            print(f"AVVISO [titoli uguali] «{t}»: {', '.join(ids)}")
            avvisi += 1
    for k, t in es["voci"].items():
        for campo in ("definizione", "nota"):
            for r in rimandi_rotti(t.get(campo, "") if isinstance(t, dict) else "", titoli):
                print(f"AVVISO [rimando] {k}.{campo}: «véase {r}» non è il titolo di una scheda")
                avvisi += 1

    mancanti = [v["id"] for v in voci if v["id"] not in es["voci"]]
    if mancanti:
        print(f"AVVISO [senza traduzione] {', '.join(mancanti)}")
        avvisi += 1

    print(f"{len(es['voci'])} traduzioni su {len(voci)} voci, {errori} errori, {avvisi} avvisi")
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
