// src/services/aiAgents.ts
import { CarListing, SearchFilters } from "../types";

interface AgentTask {
  type: "search" | "analyze" | "verify" | "recommend" | "compare";
  data: any;
}

interface AgentResponse {
  success: boolean;
  data: any;
  reason?: string;
}

/**
 * Search Agent - Finds and aggregates car listings
 */
export async function searchAgent(filters: SearchFilters): Promise<CarListing[]> {
  console.log("🔍 Search Agent activated:", filters);
  
  // In real implementation: search across multiple platforms
  // For now: return listings from main search
  const response = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
  
  return response.json();
}

/**
 * Analysis Agent - Provides insights on listings
 */
export async function analysisAgent(listings: CarListing[]): Promise<AgentResponse> {
  console.log("📊 Analysis Agent activated");
  
  const analysis = {
    averagePrice: listings.reduce((sum, car) => {
      const price = parseInt(car.price.replace(/[$,]/g, ""));
      return sum + price;
    }, 0) / listings.length,
    priceRange: {
      min: Math.min(...listings.map(c => parseInt(c.price.replace(/[$,]/g, "")))),
      max: Math.max(...listings.map(c => parseInt(c.price.replace(/[$,]/g, "")))),
    },
    averageMileage: listings.reduce((sum, car) => {
      const mileage = parseInt(car.mileage.replace(/[^0-9]/g, ""));
      return sum + mileage;
    }, 0) / listings.length,
    topPros: getMostCommonItems(listings.map(c => c.pros).flat()),
    commonCons: getMostCommonItems(listings.map(c => c.cons).flat()),
  };
  
  return {
    success: true,
    data: analysis,
  };
}

/**
 * Verification Agent - Checks listing authenticity and fraud
 * Enhanced with multiple verification layers
 */
export async function verificationAgent(listings: CarListing[]): Promise<AgentResponse> {
  console.log("✅ Verification Agent activated");
  
  const verified = listings.map(car => {
    const checks = performSecurityChecks(car);
    const trustScore = calculateDetailedTrustScore(car, checks);
    
    return {
      ...car,
      trustScore,
      isLegitimate: trustScore > 60,
      verificationDetails: {
        urlValid: checks.urlValid,
        sourceAuthentic: checks.sourceAuthentic,
        priceReasonable: checks.priceReasonable,
        dataComplete: checks.dataComplete,
        suspiciousPatterns: checks.suspiciousPatterns,
        recommendedAction: trustScore > 80 ? "✅ Safe to Contact" : trustScore > 60 ? "⚠️ Verify First" : "❌ High Risk"
      }
    };
  });
  
  return {
    success: true,
    data: verified,
  };
}

/**
 * Perform security checks on a listing
 */
function performSecurityChecks(car: CarListing): any {
  const checks: any = {};
  
  // URL Validation
  checks.urlValid = isValidURL(car.url);
  
  // Source Authentication
  const authenticSources = ['cars.com', 'autotrader.com', 'cargurus.com', 'edmunds.com', 'kbb.com'];
  checks.sourceAuthentic = authenticSources.some(s => car.source.toLowerCase().includes(s));
  
  // Price Reasonableness (rough check)
  const price = parseInt(car.price.replace(/[$,]/g, ''));
  const mileage = parseInt(car.mileage.replace(/[^0-9]/g, ''));
  checks.priceReasonable = price > 1000 && price < 500000; // Reasonable car price range
  
  // Data Completeness
  checks.dataComplete = !!(
    car.title && 
    car.price && 
    car.mileage && 
    car.year && 
    car.location && 
    car.source
  );
  
  // Suspicious Patterns
  checks.suspiciousPatterns = detectSuspiciousPatterns(car);
  
  return checks;
}

/**
 * Detect suspicious patterns that might indicate fraud
 */
function detectSuspiciousPatterns(car: CarListing): string[] {
  const patterns: string[] = [];
  
  // Too cheap for the year
  const year = parseInt(car.year);
  const price = parseInt(car.price.replace(/[$,]/g, ''));
  const age = 2026 - year;
  
  if (price < 2000 && age < 10) {
    patterns.push("Unusually low price for age");
  }
  
  // Too expensive
  if (price > 100000) {
    patterns.push("Premium price point - verify authenticity");
  }
  
  // Generic title
  if (car.title.includes("Generic") || car.title.length < 10) {
    patterns.push("Generic listing title");
  }
  
  // Missing details
  if (!car.summary || car.summary.length < 20) {
    patterns.push("Limited description provided");
  }
  
  // High mileage
  const mileage = parseInt(car.mileage.replace(/[^0-9]/g, ''));
  if (mileage > 150000 && age < 5) {
    patterns.push("High mileage for vehicle age");
  }
  
  return patterns;
}

/**
 * Calculate detailed trust score (0-100)
 */
function calculateDetailedTrustScore(car: CarListing, checks: any): number {
  let score = 50; // Base score
  
  // URL validity: +15 points
  if (checks.urlValid) score += 15;
  
  // Source authenticity: +20 points
  if (checks.sourceAuthentic) score += 20;
  
  // Price reasonableness: +15 points
  if (checks.priceReasonable) score += 15;
  
  // Data completeness: +15 points
  if (checks.dataComplete) score += 15;
  
  // No suspicious patterns: +25 points
  if (checks.suspiciousPatterns.length === 0) {
    score += 25;
  } else if (checks.suspiciousPatterns.length === 1) {
    score -= 10;
  } else {
    score -= 20;
  }
  
  // Professional listing: +10 points
  if (car.pros && car.pros.length > 2) score += 10;
  if (car.cons && car.cons.length > 2) score += 10;
  
  // Summary quality: +5 points
  if (car.summary && car.summary.length > 50) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recommendation Agent - Suggests best matches
 */
export async function recommendationAgent(
  listings: CarListing[],
  userPreferences: any
): Promise<AgentResponse> {
  console.log("💡 Recommendation Agent activated");
  
  const scored = listings.map(car => ({
    ...car,
    matchScore: calculateMatchScore(car, userPreferences),
  }));
  
  const recommended = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  
  return {
    success: true,
    data: recommended,
    reason: `Top 3 matches based on your preferences`,
  };
}

/**
 * Comparison Agent - Compares multiple cars
 */
export async function comparisonAgent(carIds: string[]): Promise<AgentResponse> {
  console.log("🔄 Comparison Agent activated");
  
  // In real implementation: fetch specific cars and compare
  const comparison = {
    metrics: ["price", "mileage", "year", "reliability", "value"],
    winner: "Best overall match",
  };
  
  return {
    success: true,
    data: comparison,
  };
}

/**
 * Orchestrator - Manages multiple agents
 */
export async function orchestrateAgents(
  filters: SearchFilters,
  userPreferences: any
): Promise<any> {
  console.log("🤖 Agent Orchestrator started");
  
  try {
    // Step 1: Search
    console.log("Step 1: Searching for listings...");
    const listings = await searchAgent(filters);
    
    // Step 2: Analyze
    console.log("Step 2: Analyzing listings...");
    const analysis = await analysisAgent(listings);
    
    // Step 3: Verify
    console.log("Step 3: Verifying authenticity...");
    const verification = await verificationAgent(listings);
    
    // Step 4: Recommend
    console.log("Step 4: Generating recommendations...");
    const recommendations = await recommendationAgent(listings, userPreferences);
    
    return {
      listings: verification.data,
      analysis: analysis.data,
      recommendations: recommendations.data,
      orchestrationTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Orchestration failed:", error);
    throw error;
  }
}

// Helper functions
function getMostCommonItems(items: string[]): string[] {
  const counts: { [key: string]: number } = {};
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([item]) => item);
}

function calculateTrustScore(car: CarListing): number {
  let score = 50; // Base score
  
  // Increase score for:
  if (car.url && car.url.includes("cars.com")) score += 15;
  if (car.source && car.source.length > 3) score += 10;
  if (car.pros && car.pros.length > 2) score += 15;
  if (car.summary && car.summary.length > 20) score += 10;
  
  return Math.min(100, score);
}

function validateListing(car: CarListing): boolean {
  return !!(
    car.title &&
    car.price &&
    car.url &&
    car.url.includes("http") &&
    car.source
  );
}

function calculateMatchScore(car: CarListing, preferences: any): number {
  let score = 0;
  
  // Match on price
  const price = parseInt(car.price.replace(/[$,]/g, ""));
  if (preferences.budgetMax && price <= preferences.budgetMax) score += 30;
  if (preferences.budgetMin && price >= preferences.budgetMin) score += 20;
  
  // Match on year
  const year = parseInt(car.year);
  if (preferences.yearMin && year >= preferences.yearMin) score += 20;
  
  // Match on location
  if (preferences.location && car.location.includes(preferences.location)) score += 20;
  
  // Match on pros
  if (preferences.desiredFeatures) {
    const matchedFeatures = car.pros.filter(p =>
      preferences.desiredFeatures.some((f: string) =>
        p.toLowerCase().includes(f.toLowerCase())
      )
    );
    score += matchedFeatures.length * 5;
  }
  
  return Math.min(100, score);
}

// Export all agents
export const agents = {
  search: searchAgent,
  analyze: analysisAgent,
  verify: verificationAgent,
  recommend: recommendationAgent,
  compare: comparisonAgent,
  orchestrate: orchestrateAgents,
};
