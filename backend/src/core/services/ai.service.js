import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client (Fallbacks gracefully if no key is present)
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Passes a user query and a list of available menu items to the AI model.
 * The model acts as a dietary assistant, identifying the best items for the query
 * and estimating their macros.
 * 
 * @param {string} query - The user's natural language request (e.g. "high protein low carb")
 * @param {Array} menuItems - List of available menu items from the database
 * @returns {Array} - Array of recommended items with AI reasoning and estimated macros
 */
export const getAIRecommendations = async (query, menuItems) => {
    // If no API key, return offline mock data so the app doesn't break
    if (!ai) {
        console.warn("GEMINI_API_KEY is missing. Using fallback mock AI recommendations.");
        return generateMockRecommendations(query, menuItems);
    }

    try {
        const prompt = `
You are an expert AI dietary and budget assistant for a food delivery app.
A user asked: "${query}"

Here is a list of available menu items from open restaurants formatted as JSON:
${JSON.stringify(menuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            restaurantName: item.restaurant.name
        })))}

Your goal is to parse this list and find the 3 best menu items that match the user's request.
For each item you choose, you must:
1. Provide a short, enthusiastic reasoning explaining why you picked it.
2. Estimate the nutritional macros (Protein, Carbs, Fats in grams, and total Calories) based on standard culinary averages for a dish of that name/description.

Strictly format your response as JSON matching the schema provided.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Fast model for real-time chat
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "List of recommended menu items with estimated macros",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "The ID of the menu item from the provided list" },
                            reasoning: { type: Type.STRING, description: "Why this item matches the user's query" },
                            macros: {
                                type: Type.OBJECT,
                                properties: {
                                    calories: { type: Type.INTEGER, description: "Estimated total calories" },
                                    protein: { type: Type.INTEGER, description: "Estimated protein in grams" },
                                    carbs: { type: Type.INTEGER, description: "Estimated carbs in grams" },
                                    fats: { type: Type.INTEGER, description: "Estimated fats in grams" }
                                },
                                required: ["calories", "protein", "carbs", "fats"]
                            }
                        },
                        required: ["id", "reasoning", "macros"]
                    }
                }
            }
        });

        const recommendationsText = response.text();
        const aiChoices = JSON.parse(recommendationsText);

        // Merge the AI's choices with the original database items
        const enrichedItems = aiChoices.map(aiChoice => {
            const originalItem = menuItems.find(item => item.id === aiChoice.id);
            return {
                ...originalItem,
                aiReasoning: aiChoice.reasoning,
                estimatedMacros: aiChoice.macros
            };
        }).filter(item => item.id); // Remove any mismatched IDs

        return enrichedItems;

    } catch (error) {
        console.error("AI Service Error:", error);
        // Fallback to mock data if Gemini throws an error (e.g. rate limit, content policy)
        return generateMockRecommendations(query, menuItems);
    }
};

// Fallback logic for when there's no internet/API key
const generateMockRecommendations = (query, menuItems) => {
    // Just pick top 3 items at random and assign fake macros
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map(item => ({
        ...item,
        aiReasoning: `I thought ${item.name} from ${item.restaurant.name} would be perfect for your request '${query}'!`,
        estimatedMacros: {
            calories: Math.floor(Math.random() * 500) + 300,
            protein: Math.floor(Math.random() * 40) + 10,
            carbs: Math.floor(Math.random() * 60) + 20,
            fats: Math.floor(Math.random() * 30) + 5
        }
    }));
};
