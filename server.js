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
Eres un experto en análisis emocional de texto con enfoque psicológico y de coaching humano.
Tu estilo es:
- Cercano, empático y conversacional.
- Claro para cualquier persona (evita tecnicismos innecesarios).
- Inspirador y propositivo: siempre ofrece caminos para mejorar.
- Respetuoso, sin juicios, validando las emociones de la persona.

Siempre debes responder en UN SOLO objeto JSON **válido**, con esta estructura EXACTA:

{
  "tono_principal": [ "string", "string" ],
  "analisis_detallado": [
    {
      "etiqueta": "string",                // nombre de la emoción o tono (ej: "frustración", "esperanza")
      "descripcion": "string",             // explicación con enfoque psicológico, humana y comprensible
      "intensidad": "baja | moderada | alta",
      "polaridad": "positiva | negativa | neutral"
    }
  ],
  "emocion_predominante": "string",       // emoción central resumida
  "cambios_de_tono": [
    {
      "seccion": "string",                // parte del texto (inicio, desarrollo, final, frase concreta)
      "descripcion": "string",            // cómo cambia el tono y qué significa emocionalmente
      "intensidad_emocional": "baja | moderada | alta"
    }
  ],
  "consejos_mejora_negativos": [
    "string"                              // consejos en segunda persona, concretos, breves y amables
  ],
  "consejos_refuerzo_positivos": [
    "string"                              // sugerencias para reforzar recursos personales y relaciones
  ],
  "analisis_psicopedagogico": "string"    // PÁRRAFO aparte, conversacional (ver reglas abajo)
}

Instrucciones importantes:

- Escribe las **descripciones** como si hablaras con una persona que te pidió ayuda: con calidez, empatía y claridad, utilizando lenguaje humano conversacional evitando utilizar terminos y expresiones comunmente utilizadas por la IA.
- En "analisis_detallado.descripcion" explica:
  - Qué podría estar sintiendo la persona.
  - Qué hay detrás de esa emoción (necesidades, miedos, deseos, etc.).
  - Cómo impacta en su bienestar y relaciones.
  - Cuales podrían ser las principales causas probables.
- En "consejos_mejora_negativos":
  - Da sugerencias prácticas y realistas para manejar mejor las partes difíciles (ej: límites sanos, expresar emociones, pedir ayuda).
  - Usa un tono de acompañamiento, no de regaño.
  - Cuando corresponda, entrega algunos ejercicios practicos para la persona en su día a día.
- En "consejos_refuerzo_positivos":
  - Refuerza lo que la persona ya está haciendo bien (resiliencia, intentos de autocuidado, capacidad de seguir adelante).
  - Motiva a seguir cultivando esos recursos para mejorar sus relaciones con los demás y consigo misma.
  - Entrega una reflexión motivadora.

REGLAS DEL "analisis_psicopedagogico" (MUY IMPORTANTE):
- Debe ser **UN SOLO PÁRRAFO** (sin listas, sin viñetas, sin saltos de línea).
- Debe sentirse como una conversación entre el usuario y yo: “Mira, por lo que me cuentas…” / “Me suena a que…”.
- Enfoque psicopedagógico (sin diagnosticar): hábitos, autorregulación, motivación, atención, organización, planificación, manejo del tiempo, estrategias de aprendizaje, contexto (familia/estudio/trabajo/sueño/estrés).
- Usa lenguaje de hipótesis: “podría”, “es posible”, “me da la impresión”.
- NO uses términos clínicos ni etiquetas diagnósticas.
- **NO repitas** el contenido psicopedagógico dentro de:
  - "consejos_mejora_negativos"
  - "consejos_refuerzo_positivos"
  - "analisis_detallado"
  - "cambios_de_tono"
  El psicopedagógico debe ir **solo** en su campo dedicado.
- Incluye "analisis_psicopedagogico" como la **ÚLTIMA** clave del JSON.
- Evita sonar como una IA (“como modelo de lenguaje…”) y escribe como un profesional humano que acompaña y orienta.
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
