import { CarListing, SearchFilters } from "../types";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function searchCars(filters: SearchFilters): Promise<CarListing[]> {
  // Use OpenRouter Elephant Alpha model
  const model = "openrouter/elephant-alpha";
  
  const prompt = `You are a car listing search assistant. Based on the user's search criteria, generate 5 realistic car listings from top automotive sites (Mix between Cars.com, Autotrader, Carvana, TrueCar, and Edmunds).

Search Criteria:
- Make/Model: ${filters.query || filters.makeModel || "any car"}
- Budget: $${filters.budgetMin || "0"} - $${filters.budgetMax || "100000"}
- Year: ${filters.yearMin || "2015"}+
- Location: ${filters.location || "USA"}

Return ONLY a valid JSON array with exactly 5 car objects. No markdown, no code blocks, just raw JSON.

Each car must have these fields:
- title: "Year Make Model Trim" (realistic)
- price: "$XX,XXX" format
- mileage: "XX,XXX miles"
- year: YYYY
- location: "City, State"
- source: "Cars.com", "Autotrader", "Carvana", "TrueCar", or "Edmunds"
- url: Create a valid search inventory URL for the specific make/model and source. Use these EXACT formats (do NOT use fake UUIDs):
  - Cars.com: "https://www.cars.com/shopping/results/?stock_type=all&makes[]=[make]&models[]=[model]"
  - Autotrader: "https://www.autotrader.com/cars-for-sale/all-cars/[make]/[model]"
  - Carvana: "https://www.carvana.com/cars/[make]-[model]"
  - TrueCar: "https://www.truecar.com/used-cars-for-sale/listings/[make]/[model]/"
  - Edmunds: "https://www.edmunds.com/inventory/srp.html?make=[make]&model=[model]"
- pros: ["advantage1", "advantage2", "advantage3"]
- cons: ["disadvantage1", "disadvantage2"]
- summary: Brief description

Example format ONLY:
[
  {"title":"2022 Honda Civic EX","price":"$18,995","mileage":"32,000 miles","year":"2022","location":"Los Angeles, CA","url":"https://www.autotrader.com/cars-for-sale/all-cars/honda/civic","source":"Autotrader","pros":["Reliable","Low mileage","Modern features"],"cons":["Higher price"],"summary":"Well-maintained Honda Civic with great fuel economy"}
]

IMPORTANT: Return ONLY the JSON array. No explanation, no markdown, no extra text.`;

  try {
    console.log("Calling OpenRouter API with Elephant Alpha...");
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CarWise",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    let text = data.choices[0]?.message?.content || "";
    
    if (!text) throw new Error("No response from API");

    // Clean up potential markdown or whitespace
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    console.log("Cleaned text:", text);
    
    try {
      const parsed = JSON.parse(text);
      console.log("Successfully parsed JSON:", parsed);
      return parsed as CarListing[];
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text length:", text.length);
      console.error("Raw text:", text);
      
      // Try to fix incomplete JSON
      if (text.endsWith('"}') || text.endsWith('"]')) {
         try {
           const fixed = JSON.parse(text + ']');
           console.log("Fixed truncated JSON");
           return fixed as CarListing[];
         } catch { /* ignore */ }
      }
      
      throw new Error("Failed to parse API response as JSON");
    }
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
}
