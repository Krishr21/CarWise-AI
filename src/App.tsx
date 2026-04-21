import React, { useState } from 'react';
import { 
  Search, 
  Car, 
  DollarSign, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronRight,
  Info,
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CarListing, SearchFilters, SearchState } from './types';
import { searchCars } from './services/geminiService';
import { hybridSearchCars } from './services/crawl4aiService';
import InsightsDashboard from './components/InsightsDashboard';
import AlertsPanel from './components/AlertsPanel';
import { useAgents } from './hooks/useAgents';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    budgetMin: '',
    budgetMax: '',
    makeModel: '',
    yearMin: '',
    location: ''
  });

  const [state, setState] = useState<SearchState>({
    isSearching: false,
    status: 'idle',
    results: []
  });

  const { result: agentResult, executing: agentExecuting, runAgents } = useAgents();
  const [useAIAgents, setUseAIAgents] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.query && !filters.makeModel) return;

    setState({ ...state, isSearching: true, status: 'researching', results: [] });

    try {
      // Simulate "Analyst" phase for better UX
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'analyzing' }));
      }, 2000);

      // Use hybrid search: Try real scraper first, then LLM fallback
      const results = await hybridSearchCars(filters, searchCars);
      setState({
        isSearching: false,
        status: 'completed',
        results
      });

      // Run AI agents in background for insights
      if (useAIAgents) {
        console.log("🤖 Running AI agents for insights...");
        await runAgents(filters, { desiredFeatures: ['Reliable', 'Good condition'] });
      }
    } catch (error) {
      setState({
        isSearching: false,
        status: 'error',
        results: [],
        error: 'Failed to find listings. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Hero Section */}
      <header className="border-b border-[#141414] pt-12 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center">
              <Car className="text-[#E4E3E0] w-6 h-6" />
            </div>
            <h1 className="text-xs font-mono uppercase tracking-[0.2em] opacity-50">CarWise-AI / MVP v1.0</h1>
          </div>
          
          <h2 className="text-6xl md:text-8xl font-serif italic leading-[0.9] tracking-tighter mb-8">
            Find your next <br />
            <span className="not-italic font-sans font-bold uppercase">perfect drive.</span>
          </h2>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              <input 
                type="text"
                placeholder="Search anything (e.g. 'Reliable SUV for camping under $20k')"
                className="w-full bg-white/50 border border-[#141414] rounded-none py-4 pl-12 pr-4 focus:outline-none focus:bg-white transition-colors"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              />
            </div>
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text"
                  placeholder="Max Budget"
                  className="w-full bg-white/50 border border-[#141414] rounded-none py-4 pl-9 pr-4 focus:outline-none focus:bg-white transition-colors"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text"
                  placeholder="Location"
                  className="w-full bg-white/50 border border-[#141414] rounded-none py-4 pl-9 pr-4 focus:outline-none focus:bg-white transition-colors"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={state.isSearching}
              className="md:col-span-2 bg-[#141414] text-[#E4E3E0] py-4 px-6 font-bold uppercase flex items-center justify-center gap-2 hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {state.isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              {!state.isSearching && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* AI Agents Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
        >
          <Zap className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <p className="font-semibold text-purple-900">🤖 Enable AI Agents</p>
            <p className="text-sm text-purple-700">Get market insights, verification scores, and AI-powered recommendations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useAIAgents}
              onChange={(e) => setUseAIAgents(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
          </label>
        </motion.div>

        <AnimatePresence mode="wait">
          {state.status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="p-8 border border-[#141414] border-dashed">
                <div className="w-12 h-12 border border-[#141414] rounded-full flex items-center justify-center mb-6">
                  <span className="font-mono text-sm">01</span>
                </div>
                <h3 className="text-xl font-bold mb-4 uppercase">Live Search</h3>
                <p className="opacity-70 leading-relaxed">
                  Our Researcher agent scans the web for real, current listings across major automotive marketplaces.
                </p>
              </div>
              <div className="p-8 border border-[#141414] border-dashed">
                <div className="w-12 h-12 border border-[#141414] rounded-full flex items-center justify-center mb-6">
                  <span className="font-mono text-sm">02</span>
                </div>
                <h3 className="text-xl font-bold mb-4 uppercase">AI Analysis</h3>
                <p className="opacity-70 leading-relaxed">
                  The Analyst agent filters results based on your budget, location, and specific needs, identifying pros and cons.
                </p>
              </div>
              <div className="p-8 border border-[#141414] border-dashed">
                <div className="w-12 h-12 border border-[#141414] rounded-full flex items-center justify-center mb-6">
                  <span className="font-mono text-sm">03</span>
                </div>
                <h3 className="text-xl font-bold mb-4 uppercase">Comparison</h3>
                <p className="opacity-70 leading-relaxed">
                  View a structured comparison table and detailed cards for the best matches found in the wild.
                </p>
              </div>
            </motion.div>
          )}

          {state.isSearching && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-[#141414]/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#141414] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-serif italic mb-2">
                  {state.status === 'researching' ? 'Researcher is scanning listings...' : 'Analyst is ranking options...'}
                </h3>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">Please wait while we process live data</p>
              </div>
            </motion.div>
          )}

          {state.status === 'completed' && state.results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Comparison Table */}
              <section>
                <div className="flex items-center justify-between mb-6 border-b border-[#141414] pb-2">
                  <h3 className="font-serif italic text-2xl">Comparison Grid</h3>
                  <span className="font-mono text-xs opacity-50 uppercase">{state.results.length} Results Found</span>
                </div>
                <div className="overflow-x-auto border border-[#141414]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#141414] text-[#E4E3E0]">
                        <th className="p-4 font-mono text-[10px] uppercase tracking-wider border-r border-[#E4E3E0]/20">Car</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-wider border-r border-[#E4E3E0]/20">Price</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-wider border-r border-[#E4E3E0]/20">Mileage</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-wider border-r border-[#E4E3E0]/20">Location</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.results.map((car, i) => (
                        <tr key={i} className="border-b border-[#141414] hover:bg-white/40 transition-colors group cursor-default">
                          <td className="p-4 font-bold border-r border-[#141414]">
                            <a 
                              href={car.url}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-600 hover:text-blue-800 cursor-pointer"
                              onClick={(e) => {
                                if (!car.url || car.url === 'https://www.cars.com/vehicledetail') {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {car.title}
                            </a>
                          </td>
                          <td className="p-4 font-mono border-r border-[#141414]">{car.price}</td>
                          <td className="p-4 font-mono border-r border-[#141414]">{car.mileage}</td>
                          <td className="p-4 border-r border-[#141414]">{car.location}</td>
                          <td className="p-4 flex items-center justify-between">
                            <span className="font-mono text-xs opacity-70 uppercase">{car.source}</span>
                            <a 
                              href={car.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer"
                              onClick={(e) => {
                                if (!car.url || car.url === 'https://www.cars.com/vehicledetail') {
                                  e.preventDefault();
                                  alert('Link not available');
                                }
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Detailed Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {state.results.map((car, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-[#141414] flex flex-col overflow-hidden"
                  >
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-2xl font-bold mb-1">{car.title}</h4>
                          <p className="font-mono text-xs uppercase opacity-50">{car.source} • {car.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-600">{car.price}</div>
                          <div className="text-xs opacity-50 mt-1">{car.mileage}</div>
                        </div>
                      </div>

                    <p className="text-sm leading-relaxed mb-6 opacity-80 italic">
                      "{car.summary}"
                    </p>

                    <div className="grid grid-cols-2 gap-6 mb-8 flex-grow">
                      <div>
                        <h5 className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pros
                        </h5>
                        <ul className="space-y-2">
                          {(car.pros || []).map((pro, j) => (
                            <li key={j} className="text-xs flex items-start gap-2">
                              <span className="mt-1 w-1 h-1 bg-[#141414] rounded-full shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-rose-600" /> Cons
                        </h5>
                        <ul className="space-y-2">
                          {(car.cons || []).map((con, j) => (
                            <li key={j} className="text-xs flex items-start gap-2">
                              <span className="mt-1 w-1 h-1 bg-[#141414] rounded-full shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <a 
                      href={car.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-[#141414] py-3 px-4 flex items-center justify-center gap-2 font-bold uppercase text-xs hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group"
                    >
                      View Original Listing
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </motion.div>
                ))}
              </section>

              {/* AI Agents Insights Dashboard */}
              {useAIAgents && agentResult && (
                <InsightsDashboard
                  analysis={agentResult.analysis}
                  trustScores={agentResult.trustScores}
                  recommendations={agentResult.recommendations}
                />
              )}

              {useAIAgents && agentExecuting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-12 text-center"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                  <p className="text-purple-600 font-semibold">🤖 AI Agents analyzing listings...</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {state.status === 'error' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border border-rose-200 bg-rose-50 p-12"
            >
              <Info className="w-12 h-12 text-rose-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Search Failed</h3>
              <p className="opacity-70 mb-8">{state.error}</p>
              <button 
                onClick={() => setState({ ...state, status: 'idle' })}
                className="bg-[#141414] text-[#E4E3E0] py-3 px-8 font-bold uppercase text-sm"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Real-time Alerts Panel */}
      {useAIAgents && <AlertsPanel />}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 md:px-12 py-12 border-t border-[#141414]/10 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            <span className="font-bold uppercase tracking-tighter">CarWise-AI</span>
          </div>
          <p className="font-mono text-[10px] opacity-40 uppercase">
            Built with Gemini 3 Flash • Real-time Search Grounding Enabled
          </p>
          <div className="flex gap-8">
            <a href="#" className="font-mono text-[10px] uppercase opacity-50 hover:opacity-100">About</a>
            <a href="#" className="font-mono text-[10px] uppercase opacity-50 hover:opacity-100">Privacy</a>
            <a href="#" className="font-mono text-[10px] uppercase opacity-50 hover:opacity-100">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
