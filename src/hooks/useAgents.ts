// src/hooks/useAgents.ts
import { useState, useCallback } from 'react';
import { CarListing, SearchFilters } from '../types';

interface AgentInsights {
  averagePrice: number;
  insights: string[];
  marketHealth: string;
}

interface AgentResult {
  listings: CarListing[];
  analysis?: AgentInsights;
  recommendations?: CarListing[];
  trustScores?: Array<{ title: string; score: number }>;
  executing: boolean;
  error?: string;
}

export function useAgents() {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [executing, setExecuting] = useState(false);

  const runAgents = useCallback(async (filters: SearchFilters, preferences?: any) => {
    setExecuting(true);
    try {
      const response = await fetch('http://localhost:8000/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, preferences: preferences || {} }),
      });

      if (!response.ok) throw new Error('Agent orchestration failed');
      
      const data = await response.json();
      setResult({
        listings: data.data.listings,
        analysis: data.data.analysis,
        recommendations: data.data.recommendations,
        trustScores: data.data.insights.trustScores,
        executing: false,
      });
    } catch (error) {
      setResult({
        listings: [],
        executing: false,
        error: String(error),
      });
    } finally {
      setExecuting(false);
    }
  }, []);

  return { result, executing, runAgents };
}
