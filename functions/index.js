const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// সুরক্ষিতভাবে API Key লোড করা হচ্ছে
const geminiApiKey = functions.config().gemini.key;
const genAI = new GoogleGenerativeAI(geminiApiKey);

exports.getAiRecommendation = functions
    .region("asia-south1")
    .https.onCall(async (data, context) => {
        const userPrompt = data.prompt;

        if (!userPrompt) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Prompt is required.",
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemPrompt = `
      You are an expert Unani health assistant for a platform called UnaniMarts.
      Your role is to provide information ONLY about Unani or herbal remedies for health concerns.
      - If the user asks about Unani/herbal remedies, provide a helpful and informative answer.
      - If the user asks ANY other unrelated question, you MUST refuse to answer.
      Respond with ONLY this exact phrase in Bengali: "আমি শুধুমাত্র ইউনানী স্বাস্থ্য বিষয়ে পরামর্শ দিতে পারি।"
      - Do not recommend specific branded products.
      Recommend only generic ingredients or herbs.
    `;

        try {
            const result = await model.generateContent([systemPrompt, userPrompt]);
            const response = await result.response;
            const text = response.text();

            return { text: text };
        } catch (error) {
            console.error("Error generating content from Gemini:", error);
            throw new functions.https.HttpsError(
                "internal",
                "Failed to get a response from the AI model.",
            );
        }
    });