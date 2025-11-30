
import React from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { NotificationType } from '../../types';

const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'INFO': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS': return "bg-white border-green-100 shadow-[0_4px_12px_rgba(0,128,0,0.1)]";
      case 'ERROR': return "bg-white border-red-100 shadow-[0_4px_12px_rgba(255,0,0,0.1)]";
      case 'WARNING': return "bg-white border-amber-100 shadow-[0_4px_12px_rgba(255,165,0,0.1)]";
      case 'INFO': return "bg-white border-blue-100 shadow-[0_4px_12px_rgba(0,0,255,0.1)]";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`
            pointer-events-auto flex items-start gap-3 p-4 rounded-xl border min-w-[300px] max-w-sm
            animate-slideInRight transition-all duration-300
            ${getStyles(notification.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 mr-2">
             <p className="text-sm font-medium text-gray-800 leading-snug">
               {notification.message}
             </p>
          </div>
          <button 
             onClick={() => removeNotification(notification.id)}
             className="text-gray-400 hover:text-gray-600 transition-colors"
          >
             <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Notifications;
