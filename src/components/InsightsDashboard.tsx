// src/components/InsightsDashboard.tsx
import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface InsightsDashboardProps {
  analysis?: {
    averagePrice: number;
    insights: string[];
    marketHealth: string;
  };
  trustScores?: Array<{ title: string; score: number }>;
  recommendations?: any[];
}

export default function InsightsDashboard({
  analysis,
  trustScores,
  recommendations,
}: InsightsDashboardProps) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-7xl mx-auto px-6 md:px-12"
    >
      {/* Market Insights */}
      <motion.div
        className="bg-blue-50 border border-blue-200 rounded-lg p-8"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-900">Market Insights</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-blue-600 font-mono mb-1">Average Price</p>
            <p className="text-3xl font-bold text-blue-900">
              ${Math.round(analysis.averagePrice).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-blue-600 font-mono mb-2">Status</p>
            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {analysis.marketHealth}
            </span>
          </div>
          
          <div>
            <p className="text-sm text-blue-600 font-mono mb-3">Key Insights</p>
            <ul className="space-y-2">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="mt-1 w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Trust Scores */}
      <motion.div
        className="bg-purple-50 border border-purple-200 rounded-lg p-8"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-purple-900">Verification Scores</h3>
        </div>
        
        <div className="space-y-3">
          {trustScores?.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-purple-800 truncate">{item.title}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-purple-900 w-10 text-right">
                  {item.score}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <motion.div
          className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-8"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-green-600" />
            <h3 className="text-2xl font-bold text-green-900">🤖 AI Recommended Best Matches</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((car, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded border border-green-200 p-4"
              >
                <p className="font-bold text-green-900 text-sm mb-2">{car.title}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>💰 {car.price}</p>
                  <p>🛣️ {car.mileage}</p>
                  <p className="text-green-600 font-semibold">
                    ⭐ Match: {car.matchScore}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
