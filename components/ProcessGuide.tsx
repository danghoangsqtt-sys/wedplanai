import React, { useState, useMemo } from 'react';
import { WeddingRegion } from '../types';
import { WEDDING_PROCEDURES } from '../data/wedding-procedures';
import Timeline from './process/Timeline';
import ProcedureDetail from './process/ProcedureDetail';
import { Map, MapPin } from 'lucide-react';

const ProcessGuide: React.FC = () => {
  const [region, setRegion] = useState<WeddingRegion>('NORTH');
  const [selectedStepId, setSelectedStepId] = useState<string>('');

  const procedures = useMemo(() => WEDDING_PROCEDURES[region], [region]);
  
  // Select first step by default when region changes
  useMemo(() => {
    if (procedures.length > 0) {
      setSelectedStepId(procedures[0].id);
    }
  }, [procedures]);

  const currentStep = procedures.find(p => p.id === selectedStepId) || procedures[0];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#FDF2F8] lg:overflow-hidden rounded-xl lg:rounded-none overflow-hidden lg:shadow-none shadow-sm border border-rose-100 lg:border-none m-0 lg:m-0">
      
      {/* --- LEFT SIDEBAR (Timeline) --- */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-rose-100 flex flex-col flex-shrink-0 z-20">
        
        {/* Header & Region Selector */}
        <div className="p-4 border-b border-rose-50">
           <div className="flex items-center gap-2 mb-3">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Lộ Trình Cưới</h2>
                <p className="text-xs text-gray-500">Quy trình chuẩn {region === 'NORTH' ? 'Miền Bắc' : region === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam'}</p>
              </div>
           </div>

           {/* Region Tabs */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['NORTH', 'CENTRAL', 'SOUTH'] as WeddingRegion[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    region === r 
                    ? 'bg-white text-rose-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {r === 'NORTH' ? 'Bắc' : r === 'CENTRAL' ? 'Trung' : 'Nam'}
                </button>
              ))}
           </div>
        </div>

        {/* Timeline Component */}
        <Timeline 
          steps={procedures} 
          selectedStepId={selectedStepId} 
          onSelectStep={(step) => setSelectedStepId(step.id)} 
        />
      </div>

      {/* --- RIGHT CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto bg-white lg:bg-[#FDF2F8] relative">
         {currentStep ? (
            <ProcedureDetail step={currentStep} region={region} />
         ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
               Chọn một bước để xem chi tiết
            </div>
         )}
      </div>
    </div>
  );
};

export default ProcessGuide;