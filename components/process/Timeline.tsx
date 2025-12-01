
import React, { useRef, useEffect } from 'react';
import { ProcedureStep } from '../../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineProps {
  steps: ProcedureStep[];
  selectedStepId: string;
  onSelectStep: (step: ProcedureStep) => void;
}

const Timeline: React.FC<TimelineProps> = ({ steps, selectedStepId, onSelectStep }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to selected item
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = document.getElementById(`step-${selectedStepId}`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedStepId]);

  const selectedIndex = steps.findIndex(s => s.id === selectedStepId);

  return (
    <div className="bg-white lg:h-full relative z-10 lg:border-r border-rose-100 flex flex-col">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Container: Horizontal on Mobile, Vertical on Desktop */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto py-2 lg:py-4 px-2 lg:p-0 hide-scrollbar"
      >
        <div className="flex flex-row lg:flex-col items-start lg:items-stretch min-w-max lg:min-w-0 gap-0 px-2 lg:px-0">
          {steps.map((step, index) => {
            const isSelected = step.id === selectedStepId;
            const isPast = index < selectedIndex;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.id}
                id={`step-${step.id}`}
                onClick={() => onSelectStep(step)}
                className={`
                    relative group cursor-pointer transition-colors
                    flex flex-col lg:flex-row items-center lg:items-start
                    min-w-[80px] sm:min-w-[100px] lg:min-w-0 lg:w-full
                    lg:px-6 lg:py-4 lg:hover:bg-rose-50/50
                    ${isSelected ? 'lg:bg-rose-50' : ''}
                `}
              >

                {/* --- CONNECTING LINES --- */}

                {/* Mobile Horizontal Line */}
                {!isLast && (
                  <div className="lg:hidden absolute top-3 left-1/2 w-full h-[2px] -z-10 bg-gray-100">
                    <div
                      className={`h-full transition-all duration-700 ease-in-out ${isPast ? 'bg-rose-500' : 'bg-transparent'}`}
                      style={{ width: isPast ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}

                {/* Desktop Vertical Line */}
                {!isLast && (
                  <div className="hidden lg:block absolute left-[35px] top-10 w-[2px] h-full -z-10 bg-gray-100">
                    <div
                      className={`w-full transition-all duration-700 ease-in-out ${isPast ? 'bg-rose-500' : 'bg-transparent'}`}
                      style={{ height: isPast ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}

                {/* --- STEP CIRCLE --- */}
                <div
                  className={`
                      relative z-10 flex-shrink-0 transition-all duration-300 transform
                      flex items-center justify-center border-2 rounded-full
                      w-6 h-6 lg:w-8 lg:h-8
                      ${isSelected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200 scale-110 ring-2 ring-rose-50 lg:ring-0'
                      : isPast
                        ? 'bg-white border-rose-500 text-rose-500 group-hover:bg-rose-50'
                        : 'bg-white border-gray-200 text-gray-300 group-hover:border-rose-300 group-hover:text-rose-300'
                    }
                   `}
                >
                  {isSelected ? (
                    <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full animate-pulse"></div>
                  ) : isPast ? (
                    <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <span className="text-[10px] lg:text-xs font-bold font-mono">{index + 1}</span>
                  )}
                </div>

                {/* --- LABEL --- */}
                <div
                  className={`
                      mt-1.5 lg:mt-0 lg:ml-4 text-center lg:text-left transition-all duration-300 px-1 lg:px-0 flex flex-col items-center lg:items-start
                      w-20 md:w-32 lg:w-auto lg:flex-1
                      ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}
                   `}
                >
                  <h4 className={`text-[10px] md:text-xs lg:text-sm font-bold leading-tight line-clamp-2 ${isSelected ? 'text-rose-700' : 'text-gray-700'}`}>
                    {step.title}
                  </h4>

                  {/* Desktop Only Description Preview */}
                  {isSelected && (
                    <p className="hidden lg:block text-xs text-rose-500 mt-1 line-clamp-1 font-medium">
                      Đang xem
                    </p>
                  )}
                  {!isSelected && (
                    <p className="hidden lg:block text-[10px] text-gray-400 mt-1 line-clamp-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
