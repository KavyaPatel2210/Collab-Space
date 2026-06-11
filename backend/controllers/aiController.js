const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize only if key exists
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

exports.generate = async (req, res) => {
  const { prompt, history, documentContext } = req.body;

  const genAI = getGeminiClient();
  if (!genAI) {
    return res.status(503).json({
      msg: 'AI service not configured',
      error: 'GEMINI_API_KEY is missing in server environment variables.'
    });
  }

  if (!prompt) {
    return res.status(400).json({ msg: 'Prompt is required' });
  }

  // Build full prompt: prepend document context if provided
  let fullPrompt = prompt;
  if (documentContext && documentContext.trim()) {
    fullPrompt = `You are an AI assistant helping with a document. Here is the document content for context:\n---\n${documentContext}\n---\n\nUser request: ${prompt}`;
  }

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      let text;

      if (history && Array.isArray(history) && history.length > 0) {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        text = response.text();
      } else {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        text = response.text();
      }

      // If successful, return the result and exit the function!
      return res.json({ result: text, usedModel: modelName });
    } catch (err) {
      console.error(`Model ${modelName} failed:`, err.message);
      lastError = err.message;
      
      // If it's a 503 (high demand) or 429 (rate limit), we continue loop to try next model
      if (err.message.includes('503') || err.message.includes('429') || err.message.includes('unavailable') || err.message.includes('overloaded')) {
        continue;
      } else {
        // For 400 Bad Request or 404 Not Found, it might be a permanent error for this model, 
        // but we can still try the fallback models just in case.
        continue;
      }
    }
  }

  // If we exhausted all models in the loop
  res.status(503).json({ 
    msg: 'All AI models are currently experiencing high demand. Please try again in a few moments.', 
    error: lastError 
  });
};
