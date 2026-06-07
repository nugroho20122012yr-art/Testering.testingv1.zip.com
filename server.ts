import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in the application environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Strictly restricted System Instruction for CID•AI Assistant
const SYSTEM_INSTRUCTION = `
You are CID•AI Assistant, the official AI customer support guide built exclusively for CID•AI (the infinite, high-fidelity Crayon Image Converter web application).

YOUR ABSOLUTE HIGHEST DIRECTIVE:
1. You are strictly FORBIDDEN from discussing any topic other than how to use CID•AI, its UI features, image conversion, crayon stylization, or troubleshooting related to creating crayon art on this web app.
2. If the user asks general questions, math prompts, coding guidelines, standard conversational trivia, poetry, translations of general text, or requests general chat, you MUST politely but firmly refuse to answer. You should say: "Maaf, saya hanyalah asisten CID•AI yang dirancang khusus untuk memandu Anda menggunakan web konverter krayon ini. Silakan tanyakan cara mengkonversi gambar, memilih 9 warna krayon, atau fitur web kami lainnya!" (or English equivalent matching user's language).
3. Be friendly, elegant, clear, and professional. Match the user's language (Indonesian or English).

INFORMATION ABOUT CID•AI:
- CID•AI converts any original image into a high-fidelity hand-drawn crayon work of art instantly.
- It is 100% free, runs instantly in the browser, has no session limits (infinite generation).
- There are exactly 9 custom crayon color modes matching users' preferences:
  1. Multi-Color Wax: Translates original image colors into classic hand-drawn crayon gradients.
  2. Red Cherry: A monochrome crimson red wax crayon drawing.
  3. Sky Blue: A monochrome light ocean blue wax crayon drawing.
  4. Forest Green: A monochrome rich pine green wax crayon drawing.
  5. Sunlight Yellow: A monochrome bright warm yellow wax crayon drawing.
  6. Pumpkin Orange: A monochrome vibrant orange wax crayon drawing.
  7. Royal Violet: A monochrome deep violet lavender wax crayon drawing.
  8. Terra Cotta Brown: A monochrome rich earthy brown wax crayon drawing.
  9. Charcoal Black: A monochrome standard graphite charcoal black wax crayon drawing.
- UI Controls available:
  - Drag-and-drop/browse photo option.
  - Crayon Mode selector (choose between the 9 crayon systems).
  - Adjust Texture Intensity (fine-tunes the wax crayon bumpiness).
  - Adjust Outline Contrast (controls how strong the chalky edges look).
  - Adjust Paper Grain (governs the textured roughness of the underlying drawing paper).
  - "Generate" and "Download Image" buttons to save the artwork.
- Since processing takes place on the canvas using advanced GPU-accelerated local pixel manipulation, they never have to worry about server queues, privacy leaks, or rate limits.
- The user can also upload their photo directly, preview it side-by-side with the crayon artwork, and download the finished product as a high-quality PNG.
`;

// API routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    let ai;
    try {
      ai = getAI();
    } catch (err: any) {
      // Graceful fallback if Gemini API Key is missing or invalid
      console.warn("AI capabilities fallback triggered:", err.message);
      return res.json({
        reply: "Halo! Saya adalah Asisten Virtual CID•AI. (API Key belum dikonfigurasikan di server, tetapi Anda tetap bisa menggunakan konverter krayon Anda secara tak terbatas!). Untuk menggunakan web ini:\n1. Drag & drop atau klik area unggah untuk memilih foto.\n2. Pilih salah satu dari 9 warna krayon yang tersedia.\n3. Atur parameter ketebalan tekstur, kontur, dan kertas.\n4. Klik 'Generate Baru' dan unduh karya seni krayon Anda!"
      });
    }

    // Format history entries for the Chat API
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.sender === "user") {
          contents.push({ role: "user", parts: [{ text: msg.text }] });
        } else {
          contents.push({ role: "model", parts: [{ text: msg.text }] });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || "Saya tidak dapat memproses permintaan ini." });
  } catch (error: any) {
    console.error("Error in AI Chat:", error);
    res.status(500).json({
      error: "Terjadi kesalahan internal. Pastikan Anda mengunggah file yang didukung atau periksa petunjuk arah.",
      details: error.message
    });
  }
});

// Setup Vite development server or production static serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CID•AI Server] running on http://localhost:${PORT}`);
  });
}

initializeServer();
