import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Aumenta il limite per testi lunghi
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Inizializza Gemini con API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Puoi usare anche "gemini-1.5-pro" se vuoi più qualità

app.post("/summarize", async (req, res) => {
  const { text } = req.body;
  console.log("Testo ricevuto dal client, lunghezza:", text ? text.length : 0);

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  if (text.trim().length < 10) {
    return res.status(400).json({
      error: "Il testo deve contenere almeno 10 caratteri",
    });
  }

  try {
    // Stima tokens (Gemini non ha lo stesso limite di OpenAI, ma meglio controllare)
    const maxChars = 100000; // limite sicurezza lato nostro
    let processedText = text;
    if (text.length > maxChars) {
      console.log("Testo troppo lungo, troncando...");
      processedText = text.substring(0, maxChars);
      processedText += "\n\n[Testo troncato per limiti di dimensione]";
    }

    // Chiamata al modello Gemini
    const prompt = `
Sei un assistente che crea riassunti chiari.
Se il testo è molto lungo, concentrati solo sui punti principali senza però escludere parti fondamentali.

Testo da riassumere:
${processedText}
`;

    const result = await model.generateContent(prompt);

    let summary_text = result.response.text();
    console.log(
      "Riassunto generato con successo, lunghezza:",
      summary_text.length
    );

    res.json({ summary_text });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "Errore durante il riassunto: " + err.message,
    });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
