const fileInput = document.getElementById("fileInput");
const label = document.getElementById("labelContainer");
const labelContent = document.getElementById("fileDropTitleContainer");
const fileContainer = document.getElementById("fileDropContainer");
const uploadBtn = document.getElementById("uploadButtonNavbar");
const extractTextButton = document.getElementById("extractTextButton");
const extractedTextContainer = document.getElementById(
  "extractedTextContainer"
);

uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", addFile);

let uploadedFiles = { image: [], pdf: [], text: [] };
let uploadedFilesType = { image: 0, pdf: 0 };
let fileForProcessing = [];
let imgForOCR = [];
let processedImages = [];
let textAfterOcr = [];
let textToShow = [];
let ocrIsScanning = false;

const maxSizePdf = 5 * 1024 * 1024;
const maxSizeImg = 3 * 1024 * 1024;

/* --- Funzioni principali --- */

function addFile(filesFromDrop) {
  let files =
    filesFromDrop instanceof Event
      ? Array.from(fileInput.files)
      : Array.from(filesFromDrop);
  if (!files.length) return createToastify("Nessun file selezionato", "error");

  labelContent.classList.add("hidden");

  files.forEach((currentFile) => {
    if (
      [
        ...uploadedFiles.image,
        ...uploadedFiles.pdf,
        ...uploadedFiles.text,
      ].some((f) => f.name === currentFile.name && f.size === currentFile.size)
    )
      return createToastify(`${currentFile.name} già caricato`, "error");

    if (currentFile.type.startsWith("image/") && currentFile.size > maxSizeImg)
      return createToastify(
        `${currentFile.name} troppo grande (Max 3 MB)`,
        "error"
      );

    if (
      (currentFile.type === "application/pdf" ||
        currentFile.name.endsWith(".pdf")) &&
      currentFile.size > maxSizePdf
    )
      return createToastify(
        `${currentFile.name} troppo grande (Max 5 MB)`,
        "error"
      );

    if (currentFile.type.startsWith("image/")) handleImage(currentFile);
    else if (
      currentFile.type === "application/pdf" ||
      currentFile.name.endsWith(".pdf")
    )
      handlePDF(currentFile);
    else if (currentFile.type === "text/plain") handleText(currentFile);
    else createToastify("File non supportato", "error");
  });

  fileInput.value = "";
}

function handleImage(file) {
  if (uploadedFilesType.image >= 6)
    return createToastify("Limite di 6 immagini raggiunto", "error");

  const reader = new FileReader();
  reader.onload = (event) => {
    const imgContainer = document.createElement("div");
    imgContainer.classList.add("imageContainer", "uploadedFileContainer");

    const img = document.createElement("img");
    img.src = event.target.result;
    img.classList.add("labelImg");

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.classList.add("closeButton");
    closeButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      imgContainer.remove();
      uploadedFiles.image = uploadedFiles.image.filter((f) => f !== file);
      uploadedFilesType.image--;
      resetProcessingArrays();
      checkEmptyContainer();
      createToastify(`${file.name} rimosso`, "info");
    });

    imgContainer.append(img, closeButton);
    fileContainer.appendChild(imgContainer);
    uploadedFiles.image.push(file);
    uploadedFilesType.image++;
    createToastify(`${file.name} caricato con successo`, "success");
  };
  reader.readAsDataURL(file);
}

async function handlePDF(file) {
  if (uploadedFilesType.pdf >= 3)
    return createToastify("Limite di 3 PDF raggiunto", "error");
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const pdfContainer = document.createElement("div");
    pdfContainer.classList.add("pdfContainer", "uploadedFileContainer");

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.classList.add("closeButton");
    closeButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pdfContainer.remove();
      uploadedFiles.pdf = uploadedFiles.pdf.filter((f) => f !== file);
      uploadedFilesType.pdf--;
      resetProcessingArrays();
      checkEmptyContainer();
      createToastify(`${file.name} rimosso`, "info");
    });
    pdfContainer.appendChild(closeButton);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
      pdfContainer.appendChild(canvas);
    }

    fileContainer.appendChild(pdfContainer);
    uploadedFiles.pdf.push(file);
    uploadedFilesType.pdf++;
    createToastify(`${file.name} caricato con successo`, "success");
  } catch {
    createToastify(`Errore nel caricamento di ${file.name}`, "error");
  }
}

function handleText(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const textContainer = document.createElement("div");
    textContainer.classList.add("textContainer", "uploadedFileContainer");
    textContainer.textContent = event.target.result;

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.classList.add("closeButton");
    closeButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      textContainer.remove();
      uploadedFiles.text = uploadedFiles.text.filter(
        (f) => f !== event.target.result
      );
      resetProcessingArrays();
      checkEmptyContainer();
      createToastify(`File rimosso`, "info");
    });

    textContainer.appendChild(closeButton);
    fileContainer.appendChild(textContainer);
    uploadedFiles.text.push(event.target.result);
    createToastify(`Testo caricato con successo`, "success");
  };
  reader.readAsText(file);
}

function checkEmptyContainer() {
  if (!fileContainer.querySelector(".uploadedFileContainer"))
    labelContent.classList.remove("hidden");
}

function createToastify(message, type) {
  let bg;
  switch (type) {
    case "success":
      bg = "#4caf50";
      break;
    case "error":
      bg = "#f44336";
      break;
    default:
      bg = "#088ff0";
  }
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: bg,
  }).showToast();
}

/* --- OCR & Preprocessing --- */

extractTextButton.addEventListener("click", () => {
  if (ocrIsScanning) return createToastify("OCR già in esecuzione", "info");
  resetProcessingArrays();
  pdfToImages(uploadedFiles.pdf);
  createToastify("Estrazione testo avviata", "info");
});

async function pdfToImages(pdfFiles) {
  const allImages = [];
  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const canvas = document.createElement("canvas");
      const viewport = page.getViewport({ scale: 2 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
      allImages.push(canvas.toDataURL("image/png"));
    }
  }
  fileForProcessing.push(...allImages);
  getFileForProcessing();
}

function getFileForProcessing() {
  fileForProcessing.push(...uploadedFiles.image);
  if (fileForProcessing.length <= 0 && uploadedFiles.text.length <= 0)
    return createToastify("Nessun file da elaborare", "info");
  processImage();
}

async function processImage() {
  processedImages = [];
  for (let current of fileForProcessing) {
    let img = new Image();
    img.src = current instanceof File ? URL.createObjectURL(current) : current;
    await new Promise(
      (resolve) =>
        (img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let j = 0; j < data.length; j += 4) {
            const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
            data[j] = data[j + 1] = data[j + 2] = avg;
          }
          ctx.putImageData(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
            0,
            0
          );
          processedImages.push(canvas.toDataURL("image/png"));
          resolve();
        })
    );
  }
  createToastify("Immagini elaborate con successo", "success");
  finalArray();
}

function finalArray() {
  imgForOCR = [...processedImages];
  ocrScan();
}

async function ocrScan() {
  const placeholder = document.querySelectorAll(
    "#extractedTextPreview .text-placeholder"
  );
  placeholder.forEach((ph) => ph.classList.add("shimmer"));
  ocrIsScanning = true;
  textAfterOcr = [];
  textToShow = [];
  for (let img of imgForOCR) {
    const {
      data: { text },
    } = await Tesseract.recognize(img, "ita");
    textAfterOcr.push(text);
  }
  placeholder.forEach((ph) => ph.classList.remove("shimmer"));
  ocrIsScanning = false;
  textToShow = [...textAfterOcr, ...uploadedFiles.text];
  cleanTextAfterOcr();
  renderFinalText(textToShow);
}

function cleanTextAfterOcr() {
  textAfterOcr = textAfterOcr.map((txt) => {
    txt = txt
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\n+/g, " ");
    for (const [wrong, right] of Object.entries({ 0: "O", 1: "l", ﬁ: "fi" }))
      txt = txt.replace(new RegExp(wrong, "g"), right);
    return txt;
  });
}

function resetProcessingArrays() {
  fileForProcessing = [];
  imgForOCR = [];
  processedImages = [];
  textAfterOcr = [];
  textToShow = [];
}

/* --- Funzione animazione fluida per spostamento blocchi --- */
function moveWithAnimation(block, target) {
  const rect1 = block.getBoundingClientRect();
  const rect2 = target.getBoundingClientRect();
  const deltaY = rect1.top - rect2.top;

  block.style.transition = "none";
  block.style.transform = `translateY(${deltaY}px)`;

  requestAnimationFrame(() => {
    block.style.transition = "transform 0.3s ease";
    block.style.transform = "translateY(0)";
  });
}

/* --- Render testi estratti --- */
function renderFinalText(textArray) {
  const extractedTextAnimation = document.querySelectorAll(
    "#extractedTextPreview .text-placeholder"
  );
  const finalTxtBtn = document.getElementById("finalizeTextButton");
  extractedTextAnimation.forEach((placeholder) => {
    placeholder.classList.add("hidden");
  });
  extractedTextContainer.innerHTML = "";

  textArray.forEach((text, index) => {
    const textBlock = document.createElement("div");
    textBlock.classList.add("textBlock");
    textBlock.dataset.index = index;

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `<i class="ri-delete-bin-line"></i>`;
    deleteBtn.classList.add("deleteButton");
    deleteBtn.addEventListener("click", () => {
      textBlock.remove();
      updateTextArrayOrder();
      if (extractedTextContainer.children.length === 0) {
        extractedTextAnimation.forEach((placeholder) => {
          placeholder.classList.remove("hidden");
          finalTxtBtn.classList.add("hidden");
        });
      }
    });

    const textContent = document.createElement("p");
    textContent.textContent = text;
    textContent.classList.add("textContent");

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttonsContainer");

    const upButton = document.createElement("button");
    upButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>`;
    upButton.addEventListener("click", () => {
      const prev = textBlock.previousElementSibling;
      if (prev) {
        moveWithAnimation(textBlock, prev);
        extractedTextContainer.insertBefore(textBlock, prev);
        updateTextArrayOrder();
      }
    });

    const downButton = document.createElement("button");
    downButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 20l8-8h-6v-8h-4v8h-6z"/></svg>`;
    downButton.addEventListener("click", () => {
      const next = textBlock.nextElementSibling;
      if (next) {
        moveWithAnimation(next, textBlock);
        extractedTextContainer.insertBefore(next, textBlock);
        updateTextArrayOrder();
      }
    });

    finalTxtBtn.classList.remove("hidden");

    buttonsContainer.append(upButton, downButton);
    textBlock.append(textContent, buttonsContainer, deleteBtn);
    extractedTextContainer.appendChild(textBlock);
  });

  function updateTextArrayOrder() {
    textToShow = Array.from(
      extractedTextContainer.querySelectorAll(".textBlock")
    ).map((b) => b.querySelector(".textContent").textContent);
  }

  /*  DA SISTEMARE!!!!!!!!!! */

  finalTxtBtn.addEventListener("click", () => {
    createToastify("Testo finalizzato con successo!", "success");
    let finalText = textToShow.join("\n\n");
    // Mostra il testo finale in un'area di anteprima

    extractedTextContainer.innerHTML = `<span>${finalText}</span>`;
    finalTxtBtn.classList.add("hidden");
  });
}

/* --- Drag & Drop --- */
label.addEventListener("dragover", (e) => {
  e.preventDefault();
  label.classList.add("dragover");
});
label.addEventListener("dragleave", () => label.classList.remove("dragover"));
label.addEventListener("drop", (e) => {
  e.preventDefault();
  label.classList.remove("dragover");
  addFile(Array.from(e.dataTransfer.files));
});
