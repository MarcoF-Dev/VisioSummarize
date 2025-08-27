import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/summarize", async (req, res) => {
  const { text } = req.body;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/pegasus-xsum",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  const data = await response.json();
  res.json(data);
});

app.listen(3000, () =>
  console.log("Server in ascolto su http://localhost:3000")
);
