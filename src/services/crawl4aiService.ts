/**
 * Crawl4AI Integration for CarWise
 * Provides real car listings from web sources
 */

import { CarListing, SearchFilters } from "../types";

/**
 * Fetch real car listings from backend Crawl4AI scraper
 * Falls back to LLM generation if scraper fails
 */
export async function searchCarsWithCrawl4AI(filters: SearchFilters): Promise<CarListing[]> {
  try {
    console.log("🌐 Attempting Crawl4AI real-time scraping...");
    console.log("📍 Target API: http://localhost:8000/api/scrape/cars");
    
    // Call backend scraper endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch("http://localhost:8000/api/scrape/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: filters.query || filters.makeModel || "cars",
          budget: filters.budgetMax,
          year: filters.yearMin,
          location: filters.location,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`❌ API returned status ${response.status}`);
        const errorText = await response.text();
        console.error(`   Response: ${errorText.substring(0, 200)}`);
        throw new Error(`Scraper failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ API Response received:", { success: result.success, count: result.count });
      
      // Handle both array and object responses
      const listings = Array.isArray(result) ? result : (result.data || result.results || []);
      
      if (listings && listings.length > 0) {
        console.log(`✅ Crawl4AI: Got ${listings.length} real listings`);
        return listings;
      } else {
        console.log("⚠️ Scraper returned 0 listings, falling back to LLM");
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("❌ Scraper request timed out (30s)");
      } else {
        console.error("❌ Fetch error:", fetchError.message);
      }
      throw fetchError;
    }
  } catch (error) {
    console.warn("⚠️ Crawl4AI scraping failed:", error);
  }

  // Fallback to empty array - let main search handle it
  return [];
}

/**
 * Hybrid search: Try Crawl4AI first, then LLM
 */
export async function hybridSearchCars(
  filters: SearchFilters,
  llmSearchFn: (filters: SearchFilters) => Promise<CarListing[]>
): Promise<CarListing[]> {
  // Try real scraping first
  const scrapedListings = await searchCarsWithCrawl4AI(filters);
  
  if (scrapedListings.length > 0) {
    return scrapedListings;
  }

  console.log("💭 Falling back to LLM generation...");
  
  // Fallback to LLM generation
  return llmSearchFn(filters);
}
