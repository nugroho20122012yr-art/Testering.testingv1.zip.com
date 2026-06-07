// Netlify Function for CID•AI Assistant (Serverless version)
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, history } = JSON.parse(event.body);
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "API Key belum terpasang di Netlify Environment. Silakan pasang GEMINI_API_KEY di dashboard Netlify untuk mengaktifkan asisten." })
      };
    }

    const genAI = new GoogleGenAI(key);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are CID•AI Assistant. Only talk about how to use CID•AI crayon converter. Strictly refuse non-CID potential topics."
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: response.text() })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
