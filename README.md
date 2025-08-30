# VisioSummarizer

**VisioSummarizer** è un’applicazione web interattiva realizzata come esercizio pratico di programmazione avanzata in JavaScript. Permette di estrarre testo da immagini e PDF e generare un riassunto intelligente del contenuto, visualizzando anche concetti chiave.

🔗 **Link al sito**: [VisioSummarizer - GitHub Pages](https://marcof-dev.github.io/VisioSummarize/)

## Caratteristiche principali

- **Estrazione testo**: supporta il caricamento di immagini e PDF per l’estrazione automatica del testo tramite OCR.  
- **Generazione riassunto**: utilizza l’API di **Gemini** per produrre riassunti dei testi estratti.  
- **Visualizzazione interattiva**: mostra il testo estratto e i concetti principali direttamente nel browser.  
- **Compatibile con dispositivi mobili**: l’applicazione è ora completamente **responsive** e utilizzabile anche da smartphone e tablet.

## Limitazioni

- **Dipendenza dall’API Gemini**: la funzionalità di riassunto dipende dall’accesso all’API di Gemini. In caso di scadenza o indisponibilità della chiave API, la generazione dei riassunti potrebbe non funzionare.  
- **Esercizio didattico**: il progetto è stato sviluppato come esercizio pratico e dimostrativo; non è pensato per uso commerciale.  
- **Gestione testi lunghi**: i testi particolarmente lunghi potrebbero non essere riassunti completamente a causa di limiti tecnici delle API.  

## Tecnologie utilizzate

- **HTML, CSS, JavaScript** per l’interfaccia e la logica dell’applicazione.  
- **Tesseract.js** per l’OCR e l’estrazione del testo da immagini e PDF.  
- **API Gemini** per la generazione dei riassunti automatici.  
- **Responsive design** tramite media queries per garantire l’uso ottimale su dispositivi di qualsiasi dimensione.  
- **Render** per il deploy e l’hosting online del server.  

## Istruzioni per l’uso

1. Aprire l’applicazione in un browser moderno su desktop o dispositivo mobile.  
2. Caricare un file immagine o PDF tramite il pannello di caricamento.  
3. Cliccare sul pulsante per estrarre il testo.  
4. Cliccare sul pulsante per generare il riassunto tramite Gemini.  
5. Consultare il testo estratto e i concetti chiave visualizzati.

## Note aggiuntive

- È consigliato utilizzare l’applicazione con testi di dimensioni moderate per garantire prestazioni ottimali.  
- Il progetto può servire come base per applicazioni più complesse di analisi e sintesi dei contenuti multimediali, anche su dispositivi mobili.  
- Il **server** è stato caricato online tramite **Render**, per gestire le richieste API e garantire l’accessibilità del servizio.
