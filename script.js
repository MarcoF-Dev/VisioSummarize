const fileInput = document.getElementById("fileInput");
const label = document.getElementById("labelContainer");
const labelContent = document.getElementById("fileDropTitleContainer");
const fileContainer = document.getElementById("fileDropContainer");
const uploadBtn = document.getElementById("uploadButtonNavbar");

uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", addFile);

let uploadedFiles = {
  image: [],
  pdf: [],
  text: [],
};

let uploadedFilesType = {
  image: 0,
  pdf: 0,
};
let fileForProcessing = [];
let imgForOCR = [];

const maxSizePdf = 5 * 1024 * 1024;
const maxSizeImg = 3 * 1024 * 1024;

function addFile(filesFromDrop) {
  let files = [];

  if (filesFromDrop instanceof Event) {
    files = Array.from(fileInput.files);
  } else if (filesFromDrop) {
    files = Array.from(filesFromDrop);
  }

  if (files.length === 0) {
    createToastify("Nessun file selezionato", "error");
    return;
  }

  labelContent.classList.add("hidden");

  files.forEach((currentFile) => {
    // Controllo file già caricato
    if (
      uploadedFiles.image.some(
        (f) => f.name === currentFile.name && f.size === currentFile.size
      ) ||
      uploadedFiles.text.some(
        (f) => f.name === currentFile.name && f.size === currentFile.size
      ) ||
      uploadedFiles.pdf.some(
        (f) => f.name === currentFile.name && f.size === currentFile.size
      )
    ) {
      createToastify(`${currentFile.name} già caricato`, "error");
      return;
    }

    // Controllo dimensione
    if (
      currentFile.type.startsWith("image/") &&
      currentFile.size > maxSizeImg
    ) {
      createToastify(`${currentFile.name} troppo grande (Max 3 MB)`, "error");
      return;
    }
    if (
      (currentFile.type === "application/pdf" ||
        currentFile.name.endsWith(".pdf")) &&
      currentFile.size > maxSizePdf
    ) {
      createToastify(`${currentFile.name} troppo grande (Max 5 MB)`, "error");
      return;
    }

    // Gestione immagini
    if (currentFile.type.startsWith("image/")) {
      if (uploadedFilesType.image >= 6) {
        createToastify("Limite di 6 immagini raggiunto", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("imageContainer", "uploadedFileContainer");

        const img = document.createElement("img");
        img.src = event.target.result;
        img.classList.add("labelImg");

        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.classList.add("closeButton");

        imgContainer.append(img, closeButton);
        fileContainer.appendChild(imgContainer);

        closeButton.addEventListener("click", (event) => {
          event.stopPropagation();
          event.preventDefault();
          imgContainer.remove();
          uploadedFiles.image = uploadedFiles.image.filter(
            (f) => f !== currentFile
          );
          uploadedFilesType.image--;
          checkEmptyContainer();
          createToastify(`${currentFile.name} rimosso`, "info");
        });

        uploadedFiles.image.push(currentFile);
        uploadedFilesType.image++;
        createToastify(`${currentFile.name} caricato con successo`, "success");
      };
      reader.readAsDataURL(currentFile);
    }

    // Gestione PDF
    else if (
      currentFile.type === "application/pdf" ||
      currentFile.name.endsWith(".pdf")
    ) {
      if (uploadedFilesType.pdf >= 3) {
        createToastify("Limite di 3 PDF raggiunto", "error");
        return;
      }
      renderPDF(currentFile);
    }

    // Gestione testo
    else if (currentFile.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = function (event) {
        const textContainer = document.createElement("div");
        textContainer.classList.add("textContainer", "uploadedFileContainer");
        textContainer.textContent = event.target.result;

        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.classList.add("closeButton");

        textContainer.appendChild(closeButton);
        fileContainer.appendChild(textContainer);

        closeButton.addEventListener("click", (event) => {
          event.stopPropagation();
          event.preventDefault();
          textContainer.remove();
          uploadedFiles.text = uploadedFiles.text.filter(
            (f) => f !== currentFile
          );
          checkEmptyContainer();
          createToastify(`${currentFile.name} rimosso`, "info");
        });

        uploadedFiles.text.push(currentFile);
        createToastify(`${currentFile.name} caricato con successo`, "success");
      };
      reader.readAsText(currentFile);
    }

    // File non supportato
    else {
      createToastify("File non supportato", "error");
    }
  });

  fileInput.value = "";
}

// Render PDF
async function renderPDF(currentFile) {
  try {
    const arrayBuffer = await currentFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const pdfContainer = document.createElement("div");
    pdfContainer.classList.add("pdfContainer", "uploadedFileContainer");

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.classList.add("closeButton");
    pdfContainer.appendChild(closeButton);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;

      pdfContainer.appendChild(canvas);
    }

    fileContainer.appendChild(pdfContainer);

    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      pdfContainer.remove();
      uploadedFiles.pdf = uploadedFiles.pdf.filter((f) => f !== currentFile);
      uploadedFilesType.pdf--;
      checkEmptyContainer();
      createToastify(`${currentFile.name} rimosso`, "info");
    });

    uploadedFiles.pdf.push(currentFile);
    uploadedFilesType.pdf++;
    createToastify(`${currentFile.name} caricato con successo`, "success");
  } catch (error) {
    createToastify(`Errore nel caricamento di ${currentFile.name}`, "error");
  }
}

// esempio di utilizzo

// Controllo se ci sono file nel container
function checkEmptyContainer() {
  const filesLeft = fileContainer.querySelectorAll(".uploadedFileContainer");
  if (filesLeft.length === 0) {
    labelContent.classList.remove("hidden");
  }
}

// Drag & drop
label.addEventListener("dragover", (event) => {
  label.classList.add("dragover");
  event.preventDefault();
});
label.addEventListener("dragleave", () => label.classList.remove("dragover"));

label.addEventListener("drop", (event) => {
  label.classList.remove("dragover");
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  if (files.length > 0) addFile(files);
});

// Toastify helper
function createToastify(message, type) {
  let backgroundColor;
  switch (type) {
    case "success":
      backgroundColor = "#4caf50";
      break;
    case "error":
      backgroundColor = "#f44336";
      break;
    default:
      backgroundColor = "#088ff0";
  }
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: backgroundColor,
  }).showToast();
}

const extractTextButton = document.getElementById("extractTextButton");
extractTextButton.addEventListener("click", () => {
  pdfToImages(uploadedFiles.pdf);
});
async function pdfToImages(pdfFiles) {
  const allImages = []; // qui salveremo tutte le immagini

  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      // canvas temporaneo
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const viewport = page.getViewport({ scale: 2 }); // maggiore DPI
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // trasforma il canvas in dataURL immagine
      const imgData = canvas.toDataURL("image/png");
      allImages.push(imgData);
    }
  }

  for (let i = 0; i < allImages.length; i++) {
    fileForProcessing.push(allImages[i]);
  }
  getFileForProcessing();
  return allImages;
}

function getFileForProcessing() {
  let img = [...uploadedFiles.image];
  for (let i = 0; i < img.length; i++) {
    fileForProcessing.push(img[i]);
  }

  if (fileForProcessing.length <= 0) {
    createToastify("Nessun file da elaborare", "info");
  } else {
    processImage();
  }
}

let processedImages = []; // array finale con le immagini preprocessate

async function processImage() {
  processedImages = []; // reset ogni volta

  for (let i = 0; i < fileForProcessing.length; i++) {
    let current = fileForProcessing[i];
    let img = new Image();

    // Se è un File (Blob)
    if (current instanceof File) {
      img.src = URL.createObjectURL(current);
    }
    // Se è un dataURL (da pdfToImages)
    else if (typeof current === "string") {
      img.src = current;
    }

    await new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // --- resize se troppo piccola ---
        const scale = 2; // ingrandisci un po’ per leggibilità
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // --- grayscale ---
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let j = 0; j < data.length; j += 4) {
          const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
          data[j] = data[j + 1] = data[j + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);

        // Salvo il risultato come dataURL
        const processedDataUrl = canvas.toDataURL("image/png");
        processedImages.push(processedDataUrl);

        console.log(`Immagine ${i + 1} processata`);
        resolve();
      };
    });
  }

  createToastify("Tutte le immagini sono state preprocessate", "success");
  shimmerStyle();
  finalArray();
}

function finalArray() {
  imgForOCR = [...processedImages];
  console.log(imgForOCR);
}
function shimmerStyle() {
  const placeholders = document.querySelectorAll(".text-placeholder");
  placeholders.forEach((placeholder) => {
    placeholder.classList.add("shimmer");
  });
}
