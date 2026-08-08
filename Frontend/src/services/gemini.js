
import { GoogleGenAI, Type } from "@google/genai";

export const getAIInsights = async (data) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-pro';
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the following business performance data for a multi-warehouse Salon/Gym/Cosmetics manager and provide 3 key actionable insights in professional tone: ${JSON.stringify(data)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable business insights'
            },
            summary: {
              type: Type.STRING,
              description: 'One sentence overall health summary'
            }
          },
          propertyOrdering: ["insights", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini AI error:", error);
    return { insights: ["Unable to fetch AI insights at this time."], summary: "System report unavailable." };
  }
};
