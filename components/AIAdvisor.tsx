
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, Trash2, ChevronRight, MessageSquare, Check } from 'lucide-react';
import { DashboardStats } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { useStore } from '../store/useStore';

interface AIAdvisorProps {
  stats: DashboardStats;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "💰 Phân bổ ngân sách 500 triệu thế nào?",
  "🎤 Viết kịch bản MC lễ thành hôn",
  "🍲 Gợi ý thực đơn tiệc cưới mùa hè",
  "💌 Cách viết thiệp mời bạn bè hài hước",
  "📸 Kinh nghiệm chụp ảnh cưới tiết kiệm",
  "🎶 List nhạc đám cưới lãng mạn"
];

const AIAdvisor: React.FC<AIAdvisorProps> = ({ stats }) => {
  const { user, settings } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: `Chào ${user?.displayName || 'bạn'}! 👋\nTôi là trợ lý cưới thông minh của bạn. Tôi có thể giúp bạn lên kế hoạch, tính toán ngân sách, hoặc soạn thảo nội dung.\n\nBạn đang lo lắng điều gì nhất cho ngày trọng đại?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    // UI Updates
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      const responseText = await getFinancialAdvice(stats, messages, textToSend);
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: error.message || "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng kiểm tra lại API Key hoặc thử lại sau." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Xóa toàn bộ lịch sử trò chuyện này?")) {
      setMessages([{ 
        role: 'model', 
        content: `Dữ liệu đã được làm mới! ✨\nChúng ta hãy bắt đầu lại nhé. Bạn cần tôi hỗ trợ gì?` 
      }]);
    }
  };

  // Logic: Phải là ADMIN hoặc (USER có quyền + đã Active + có Key)
  const isConfigured = user?.role === 'ADMIN' || (user?.role === 'USER' && user.isActive && settings.openaiApiKey);
  const isRestricted = user?.role === 'USER' && !user.isActive;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-rose-100 flex flex-col h-[600px] overflow-hidden relative">
      
      {/* 1. Header */}
      <div className="p-4 border-b border-rose-50 bg-gradient-to-r from-white to-rose-50/30 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl shadow-md text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Cố Vấn AI
              <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Beta
              </span>
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Được hỗ trợ bởi {user?.role === 'ADMIN' ? 'Gemini Pro' : 'OpenAI GPT-4o Mini'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleClearChat}
          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="Làm mới cuộc trò chuyện"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth relative">
        {/* RESTRICTED OVERLAY */}
        {isRestricted && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-rose-100 p-4 rounded-full mb-4">
                    <Bot className="w-12 h-12 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Tính năng bị khóa</h3>
                <p className="text-gray-500 mb-4 max-w-sm">
                    Tài khoản chưa kích hoạt không thể sử dụng Cố Vấn AI. Vui lòng liên hệ Admin để mở khóa tính năng này.
                </p>
            </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${isUser ? 'bg-indigo-100' : 'bg-rose-100'}`}>
                  {isUser ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-rose-600" />}
                </div>
                
                {/* Bubble */}
                <div className={`
                  p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative
                  ${isUser 
                    ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }
                `}>
                  {/* Message Content */}
                  <div className="whitespace-pre-line">
                    {msg.content}
                  </div>

                  {/* Timestamp/Status (Optional aesthetic detail) */}
                  {!isUser && idx === messages.length - 1 && !isLoading && (
                     <div className="absolute -bottom-5 left-0 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã trả lời
                     </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-rose-100 mt-1">
                   <Bot className="w-5 h-5 text-rose-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                   <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></span>
                   </span>
                   <span className="text-xs text-gray-400 ml-1 font-medium">Đang suy nghĩ...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggestions & Input Area */}
      <div className="bg-white border-t border-rose-50 p-4 pt-2">
        
        {/* Quick Suggestions */}
        {!isLoading && messages.length < 5 && isConfigured && !isRestricted && (
           <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSend(q)}
                   className="flex-shrink-0 text-xs font-medium bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full border border-rose-100 hover:bg-rose-100 hover:border-rose-200 transition-colors whitespace-nowrap"
                 >
                    {q}
                 </button>
              ))}
           </div>
        )}

        {/* Input Bar */}
        <div className="relative flex items-end gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
          <textarea
            className="flex-1 max-h-32 min-h-[44px] p-2.5 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-400 resize-none outline-none overflow-y-auto"
            placeholder={isConfigured ? "Nhập câu hỏi của bạn..." : "Tính năng bị khóa..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading || !isConfigured || isRestricted}
            rows={1}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim() || !isConfigured || isRestricted}
            className={`p-2.5 rounded-lg mb-0.5 transition-all flex-shrink-0 ${
              !input.trim() || isLoading || !isConfigured || isRestricted
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md active:scale-95'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Footer Warning */}
        {!isConfigured && user?.role === 'USER' && (
           <div className="mt-2 text-center">
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1">
                 ⚠️ {!user.isActive ? "Tài khoản chưa được kích hoạt." : "Bạn cần nhập API Key trong phần Cài Đặt."}
              </span>
           </div>
        )}
      </div>

      <style>{`
        .mask-linear-fade {
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export default AIAdvisor;
