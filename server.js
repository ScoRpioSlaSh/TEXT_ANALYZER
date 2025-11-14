import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Necesario en módulos ES para obtener __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, "public")));

// Ruta explícita para la raíz "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint de análisis
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Texto vacío o no enviado." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Eres un analizador experto de tono emocional en texto escrito.
Siempre debes responder en un SOLO objeto JSON válido.

Estructura EXACTA del JSON:

{
  "tono_principal": [ "string", "string" ],
  "analisis_detallado": [
    {
      "etiqueta": "string",
      "descripcion": "string",
      "intensidad": "baja | moderada | alta",
      "polaridad": "positiva | negativa | neutral"
    }
  ],
  "emocion_predominante": "string",
  "cambios_de_tono": [
    {
      "seccion": "string",
      "descripcion": "string",
      "intensidad_emocional": "baja | moderada | alta"
    }
  ],
  "consejos_mejora_negativos": [
    "string"
  ],
  "consejos_refuerzo_positivos": [
    "string"
  ]
}
        `.trim()
        },
        {
          role: "user",
          content: `Texto a analizar:\n\n${text}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(raw);

    res.json(data);
  } catch (error) {
    console.error("Error en /analyze:", error);
    res.status(500).json({
      error: "Error al analizar el texto.",
      detalle: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
