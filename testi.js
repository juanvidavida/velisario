"use strict";

/* Testi dell'interfaccia per lingua. La prima lingua è quella predefinita.
   Nomi delle lingue, categorie e livelli mancanti si prendono dalle costanti
   italiane di app.js, così le voci di Veliglotta restano allineate. */
const ORIGINALE = {
  nome: "Veliglotta",
  autore: "Giorgio Stampa (gissimo)",
  url: "https://github.com/gissimo/veliglotta",
};
const SORGENTI = "https://github.com/juanvidavida/velisario";

const TESTI = {
  es: {
    nome: "Español",
    titoloPagina: "Velisario, diccionario náutico de vela",
    descrizione: "Diccionario de términos de vela en catalán, inglés, español, francés e italiano, con búsqueda y uso sin conexión.",
    sottotitolo: "Diccionario de vela en catalán, inglés, español, francés e italiano",
    linguaInterfaccia: "Idioma de la interfaz",
    installa: "Instalar app",
    istruzioniIos:
      "Para instalar Velisario, toca el botón Compartir de Safari (el cuadrado con una flecha hacia arriba) y elige «Añadir a pantalla de inicio».",
    chiudi: "Entendido",
    controlli: "Búsqueda y filtros",
    cercaEtichetta: "Buscar un término",
    cercaSegnaposto: "Busca un término en cualquier idioma",
    pulisci: "Borrar la búsqueda",
    linguaRicerca: "Idioma en el que buscar",
    categoria: "Categoría",
    risultati: "Resultados",
    vuoto: "No se ha encontrado ningún término. Prueba con menos letras o busca en otro idioma.",
    fonti: "Fuentes",
    fontiScheda: "Fuentes: ",
    tutte: "Todos",
    tutteCategorie: "Todas las categorías",
    lingue: { cat: "Catalán", eng: "Inglés", esp: "Español", fra: "Francés", ita: "Italiano" },
    categorie: {
      scafo: "Casco",
      coperta: "Cubierta",
      attrezzatura: "Aparejo",
      vele: "Velas",
      manovre: "Maniobras",
      navigazione: "Navegación",
      meteo: "Meteorología",
      equipaggio: "Tripulación",
    },
    livelli: [
      "sin fuentes",
      "solo fuentes poco fiables",
      "una fuente fiable, sin segunda confirmación",
      "una fuente de referencia y una segunda confirmación",
    ],
    conteggio: (n, tot) => (n === tot ? `${tot} términos` : `${n} de ${tot} términos`),
    statistiche: (tot, complete) =>
      complete === undefined
        ? `${tot} términos.`
        : `${tot} términos, ${complete} con tres puntos en todos los idiomas.`,
    erroreFile:
      "El diccionario no se carga si se abre el archivo directamente. Ábrelo desde un servidor local, por ejemplo con: python3 -m http.server",
    erroreRete: "No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.",
    piede: [
      "Velisario es una adaptación al español de ",
      ["ORIGINALE"],
      `, de ${ORIGINALE.autore}. Cambios respecto al original: interfaz en español, definiciones y notas traducidas y adaptadas al español, con algunas correcciones, y términos en catalán. Datos con licencia `,
      ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es"],
      ", código con licencia MIT. ",
      ["Código fuente y contribuciones en GitHub", SORGENTI],
      ".",
    ],
  },
  it: {
    nome: "Italiano",
    titoloPagina: "Velisario, dizionario velico multilingue",
    descrizione: "Dizionario di termini velici in catalano, inglese, spagnolo, francese e italiano, con ricerca e uso offline.",
    sottotitolo: "Dizionario velico in catalano, inglese, spagnolo, francese e italiano",
    linguaInterfaccia: "Lingua dell'interfaccia",
    installa: "Installa app",
    istruzioniIos:
      "Per installare Velisario, tocca il pulsante Condividi di Safari (il quadrato con la freccia verso l'alto) e scegli «Aggiungi alla schermata Home».",
    chiudi: "Ho capito",
    controlli: "Ricerca e filtri",
    cercaEtichetta: "Cerca un termine",
    cercaSegnaposto: "Cerca un termine in qualsiasi lingua",
    pulisci: "Cancella la ricerca",
    linguaRicerca: "Lingua in cui cercare",
    categoria: "Categoria",
    risultati: "Risultati",
    vuoto: "Nessun termine trovato. Prova con meno lettere, oppure cerca in un'altra lingua.",
    fonti: "Fonti",
    fontiScheda: "Fonti: ",
    tutte: "Tutte",
    tutteCategorie: "Tutte le categorie",
    conteggio: (n, tot) => (n === tot ? `${tot} termini` : `${n} di ${tot} termini`),
    statistiche: (tot, complete) =>
      complete === undefined
        ? `${tot} termini.`
        : `${tot} termini, ${complete} con tre pallini in tutte le lingue.`,
    erroreFile:
      "Il dizionario non si carica aprendo il file direttamente. Servilo con un server locale, per esempio con: python3 -m http.server",
    erroreRete: "Impossibile caricare i dati. Controlla la connessione e riprova.",
    piede: [
      "Velisario è un adattamento in spagnolo di ",
      ["ORIGINALE"],
      `, di ${ORIGINALE.autore}. Modifiche rispetto all'originale: interfaccia in spagnolo, definizioni e note tradotte e adattate in spagnolo, con alcune correzioni, e termini in catalano. Dati rilasciati con licenza `,
      ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.it"],
      ", codice con licenza MIT. ",
      ["Sorgenti e contributi su GitHub", SORGENTI],
      ".",
    ],
  },
};
