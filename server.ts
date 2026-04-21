// server.ts - Backend API for AI Agents
import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Helper function to run Python scraper
function runPythonScraper(query: string, budget?: number, year?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log(`🐍 Starting Python scraper... (Query: ${query})`);
    const startTime = Date.now();
    
    // Simpler Python code that just calls scraper and outputs JSON
    const pythonCode = `
import sys
import json
import os
os.environ['LOGLEVEL'] = 'CRITICAL'
os.environ['PYTHONUNBUFFERED'] = '0'

# Suppress ALL printing from libraries
import io
class NullWriter:
    def write(self, x): pass
    def flush(self): pass

_original_stdout = sys.stdout
_devnull = NullWriter()

# Temporarily suppress output during import
sys.stdout = _devnull
sys.stderr = _devnull

try:
    import asyncio
    from scraper import scrape_cars
    os.chdir('${process.cwd()}')
finally:
    sys.stdout = _original_stdout
    sys.stderr = sys.stderr

# Now run scraper with output suppressed
sys.stdout = _devnull
sys.stderr = _devnull

async def main():
    results = await scrape_cars('${query}', ${budget || 'None'}, ${year || 'None'})
    return results

results = asyncio.run(main())

# Restore output and print ONLY JSON
sys.stdout = _original_stdout
sys.stderr = sys.stderr
sys.stdout.flush()
print(json.dumps(results))
sys.stdout.flush()
    `;
    
    const pythonProcess = spawn('.venv/bin/python', ['-c', pythonCode]);
    
    const timeoutHandle = setTimeout(() => {
      pythonProcess.kill();
      console.error('⏱️ Python scraper timed out after 60s');
      reject(new Error('Scraper timeout'));
    }, 60000);

    let jsonOutput = '';
    let errorOutput = '';

    // Collect ALL output first
    let allOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      allOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const elapsed = Date.now() - startTime;
      console.log(`⏱️ Python scraper finished in ${elapsed}ms (exit code: ${code})`);
      
      if (code === 0) {
        try {
          // Look for JSON array pattern [{ ... }] by finding first clean [ and last clean ]
          const jsonMatch = allOutput.match(/\[\s*{[\s\S]*}\s*\]/);
          
          if (!jsonMatch) {
            // Fallback: try to find any array-like structure
            const startIdx = allOutput.indexOf('[');
            const endIdx = allOutput.lastIndexOf(']');
            
            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
              console.error('❌ No JSON array found in output');
              console.error('Output sample:', allOutput.substring(0, 300));
              resolve([]);
              return;
            }
            
            jsonOutput = allOutput.substring(startIdx, endIdx + 1);
          } else {
            jsonOutput = jsonMatch[0];
          }
          
          // Clean up any control characters or encoding issues
          jsonOutput = jsonOutput
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/[\uFEFF]/g, ''); // Remove BOM
          
          const results = JSON.parse(jsonOutput);
          console.log(`✅ Extracted ${results.length} listings from Python`);
          resolve(results);
        } catch (e) {
          console.error('Failed to extract JSON from Python output');
          console.error('Parse error:', e instanceof Error ? e.message : e);
          console.error('Output length:', allOutput.length);
          console.error('Output sample (first 500 chars):', allOutput.substring(0, 500));
          resolve([]); // Return empty on parse error
        }
      } else {
        console.error('Python process exited with code:', code);
        reject(new Error(`Python scraper failed`));
      }
    });
  });
}

// Mock agent functions (in production, these would be the actual agents)
async function runSearchAgent(filters: any) {
  console.log('🔍 Search Agent executing...', filters);
  
  // Try to use real Crawl4AI scraper
  try {
    const query = filters.query || 'Honda';
    const budget = filters.budget ? parseInt(filters.budget.replace(/[$,]/g, '')) : undefined;
    const year = filters.year ? parseInt(filters.year) : undefined;
    
    console.log(`📡 Crawling for: ${query}, budget: ${budget}, year: ${year}`);
    const scrapedListings = await runPythonScraper(query, budget, year);
    
    if (scrapedListings && scrapedListings.length > 0) {
      console.log(`✅ Got ${scrapedListings.length} real listings from Crawl4AI`);
      return scrapedListings;
    }
  } catch (error) {
    console.warn('⚠️ Crawl4AI scraper failed, using demo data:', error);
  }
  
  // Fallback to demo data
  return [
    {
      title: "2019 Honda Civic",
      price: "$8,500",
      mileage: "45,000 miles",
      year: "2019",
      location: "Los Angeles, CA",
      url: "https://www.cars.com/vehicledetail/12345",
      source: "Cars.com",
      pros: ["Reliable", "Good fuel economy"],
      cons: ["Needs new tires"],
      summary: "Well-maintained Honda with excellent reliability",
      imageUrl: ""
    },
    {
      title: "2020 Toyota Corolla",
      price: "$12,999",
      mileage: "32,000 miles",
      year: "2020",
      location: "San Francisco, CA",
      url: "https://www.cars.com/vehicledetail/12346",
      source: "Cars.com",
      pros: ["Excellent reliability", "Low mileage"],
      cons: ["Older color"],
      summary: "Pristine Toyota Corolla, rarely driven",
      imageUrl: ""
    },
    {
      title: "2018 Ford Focus",
      price: "$7,899",
      mileage: "58,000 miles",
      year: "2018",
      location: "Phoenix, AZ",
      url: "https://www.cars.com/vehicledetail/12347",
      source: "Cars.com",
      pros: ["Good value", "Runs great"],
      cons: ["Higher mileage"],
      summary: "Affordable daily driver in great condition",
      imageUrl: ""
    }
  ];
}

async function runAnalysisAgent(listings: any) {
  console.log('📊 Analysis Agent executing...');
  return {
    averagePrice: listings.reduce((sum: number, car: any) => {
      const price = parseInt(car.price.replace(/[$,]/g, ''));
      return sum + price;
    }, 0) / listings.length,
    insights: [
      "Average price is 8,500",
      "Most common feature: Reliable",
      "Market trend: Prices stable"
    ],
    marketHealth: "Good - Healthy inventory"
  };
}

async function runVerificationAgent(listings: any) {
  console.log('✅ Verification Agent executing...');
  
  return listings.map((car: any) => {
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
}

function performSecurityChecks(car: any) {
  const checks: any = {};
  
  checks.urlValid = isValidURL(car.url);
  
  const authenticSources = ['cars.com', 'autotrader.com', 'cargurus.com', 'edmunds.com', 'kbb.com'];
  checks.sourceAuthentic = authenticSources.some(s => car.source?.toLowerCase().includes(s));
  
  const price = parseInt(car.price?.replace(/[$,]/g, '') || '0');
  checks.priceReasonable = price > 1000 && price < 500000;
  
  checks.dataComplete = !!(car.title && car.price && car.mileage && car.year && car.location && car.source);
  
  checks.suspiciousPatterns = detectSuspiciousPatterns(car);
  
  return checks;
}

function detectSuspiciousPatterns(car: any): string[] {
  const patterns: string[] = [];
  const year = parseInt(car.year || '2020');
  const price = parseInt(car.price?.replace(/[$,]/g, '') || '0');
  const age = 2026 - year;
  
  if (price < 2000 && age < 10) {
    patterns.push("Unusually low price for age");
  }
  if (price > 100000) {
    patterns.push("Premium price point - verify authenticity");
  }
  if (!car.title || car.title.includes("Generic") || car.title.length < 10) {
    patterns.push("Generic listing title");
  }
  if (!car.summary || car.summary.length < 20) {
    patterns.push("Limited description provided");
  }
  
  const mileage = parseInt(car.mileage?.replace(/[^0-9]/g, '') || '0');
  if (mileage > 150000 && age < 5) {
    patterns.push("High mileage for vehicle age");
  }
  
  return patterns;
}

function calculateDetailedTrustScore(car: any, checks: any): number {
  let score = 50;
  
  if (checks.urlValid) score += 15;
  if (checks.sourceAuthentic) score += 20;
  if (checks.priceReasonable) score += 15;
  if (checks.dataComplete) score += 15;
  
  if (checks.suspiciousPatterns.length === 0) {
    score += 25;
  } else if (checks.suspiciousPatterns.length === 1) {
    score -= 10;
  } else {
    score -= 20;
  }
  
  if (car.pros?.length > 2) score += 10;
  if (car.cons?.length > 2) score += 10;
  if (car.summary?.length > 50) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function runRecommendationAgent(listings: any, preferences: any) {
  console.log('💡 Recommendation Agent executing...');
  return listings.map((car: any) => ({
    ...car,
    matchScore: Math.floor(Math.random() * 100),
    reason: "Good match for your preferences"
  })).sort((a: any, b: any) => b.matchScore - a.matchScore);
}

// API Endpoints
app.post('/api/agents/search', async (req: Request, res: Response) => {
  try {
    const { filters } = req.body;
    const results = await runSearchAgent(filters);
    res.json({
      success: true,
      agent: 'search',
      data: results,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/agents/analyze', async (req: Request, res: Response) => {
  try {
    const { listings } = req.body;
    const analysis = await runAnalysisAgent(listings);
    res.json({
      success: true,
      agent: 'analysis',
      data: analysis,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/agents/verify', async (req: Request, res: Response) => {
  try {
    const { listings } = req.body;
    const verified = await runVerificationAgent(listings);
    res.json({
      success: true,
      agent: 'verify',
      data: verified,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/agents/recommend', async (req: Request, res: Response) => {
  try {
    const { listings, preferences } = req.body;
    const recommendations = await runRecommendationAgent(listings, preferences);
    res.json({
      success: true,
      agent: 'recommend',
      data: recommendations,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/agents/orchestrate', async (req: Request, res: Response) => {
  try {
    const { filters, preferences } = req.body;
    
    // Execute agents in sequence
    const searchResults = await runSearchAgent(filters);
    const analysis = await runAnalysisAgent(searchResults);
    const verified = await runVerificationAgent(searchResults);
    const recommendations = await runRecommendationAgent(searchResults, preferences);
    
    res.json({
      success: true,
      agents: ['search', 'analyze', 'verify', 'recommend'],
      data: {
        listings: verified,
        analysis,
        recommendations: recommendations.slice(0, 3),
        insights: {
          bestDeal: recommendations[0],
          marketStatus: analysis.marketHealth,
          trustScores: verified.map((v: any) => ({ title: v.title, score: v.trustScore }))
        }
      },
      executedAt: new Date().toISOString(),
      executionTime: '2.5s'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Crawl4AI Scraping Endpoint
app.post('/api/scrape/cars', async (req: Request, res: Response) => {
  try {
    const { query, budget, year, location } = req.body;
    
    console.log('🕷️ Crawl4AI Scraping endpoint called');
    console.log(`   Query: ${query}, Budget: ${budget}, Year: ${year}, Location: ${location}`);
    
    const listings = await runPythonScraper(query, budget, year);
    
    // Always return listings (empty array if none found)
    res.json({
      success: true,
      source: 'Crawl4AI',
      count: listings.length,
      data: listings,
      results: listings,
      scrapedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Crawl4AI scraping failed',
      data: [],
      results: []
    });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CarWise Agent Server' });
});

app.listen(PORT, () => {
  console.log(`🤖 CarWise Agent Server running on http://localhost:${PORT}`);
});
