// src/components/AlertsPanel.tsx
import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  type: 'deal' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const alertTypes = ['deal', 'warning', 'info'] as const;
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        title: ['Great Deal Found! 🎉', 'Price Drop Detected 📉', 'New Listing Alert 🆕'][
          Math.floor(Math.random() * 3)
        ],
        message:
          'A car matching your preferences just became available at a great price!',
        timestamp: new Date(),
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
    }, 15000); // New alert every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'deal':
        return <TrendingDown className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'deal':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      {/* Alert Bell Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          {alerts.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {Math.min(alerts.length, 9)}
            </motion.span>
          )}
        </div>
      </motion.button>

      {/* Alerts Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 w-96 bg-white border border-[#141414] rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50"
          >
            <div className="sticky top-0 bg-[#141414] text-[#E4E3E0] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold">🚨 Real-time Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-[#141414]/80 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No alerts yet</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border-l-4 ${getBgColor(alert.type)} flex justify-between items-start gap-3`}
                  >
                    <div className="flex gap-3 flex-1">
                      <div className="mt-0.5">{getIcon(alert.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#141414]">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
