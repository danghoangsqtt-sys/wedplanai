
import React, { useState, lazy, Suspense } from 'react';
import { MessageSquareText, X, Loader2, RefreshCw } from 'lucide-react';
import { DashboardStats } from '../types';

const AIAdvisor = lazy(() => import('./AIAdvisor'));

interface AIFloatingChatProps {
  stats: DashboardStats;
  isRestricted: boolean;
}

const AIFloatingChat: React.FC<AIFloatingChatProps> = ({ stats, isRestricted }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Cố Vấn AI"
          className="
            fixed bottom-20 right-4
            lg:bottom-6 lg:right-6
            z-40 w-13 h-13 p-3.5 rounded-full
            bg-gradient-to-br from-rose-500 to-pink-600 text-white
            shadow-lg shadow-rose-500/40
            hover:scale-110 active:scale-95 transition-all duration-200
            flex items-center justify-center
          "
        >
          <MessageSquareText className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="
              fixed z-50 flex flex-col bg-white shadow-2xl border border-rose-100
              inset-x-0 bottom-0 rounded-t-2xl h-[92vh]
              md:inset-auto md:bottom-4 md:right-4 md:w-[380px] md:h-[580px] md:rounded-2xl
              lg:bottom-6 lg:right-6
              overflow-hidden
            "
            style={{ animation: 'slideInFromBottom 0.25s ease-out' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" />
                <span className="font-bold text-sm">Cố Vấn AI</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-semibold">Beta</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AIAdvisor content — header hidden since panel already has one */}
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <Loader2 className="w-7 h-7 animate-spin text-rose-400" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              }>
                <AIAdvisor stats={stats} isRestricted={isRestricted} hideHeader />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AIFloatingChat;
