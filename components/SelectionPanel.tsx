import React, { useState } from 'react';
import { School, Semester } from '../types';
import { Calendar, Check } from 'lucide-react';

interface SelectionPanelProps {
  selectedSchool: School | null;
  onSubmit: (schoolId: number, semester: Semester) => void;
  onSkip: () => void;
  disabled: boolean;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ selectedSchool, onSubmit, onSkip, disabled }) => {
  const [semester, setSemester] = useState<Semester>(Semester.Fall);

  if (!selectedSchool) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg flex justify-between items-center md:px-8 z-50">
        <div className="text-gray-500 text-sm">
           {disabled ? "Waiting for your turn..." : "Select a school from the list above to proceed."}
        </div>
        {!disabled && (
           <button 
             onClick={onSkip}
             className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2"
           >
             Skip this round
           </button>
        )}
      </div>
    );
  }

  const canSelectFall = selectedSchool.slotsFall > 0 || selectedSchool.slotsFlexible > 0;
  const canSelectSpring = selectedSchool.slotsSpring > 0 || selectedSchool.slotsFlexible > 0;

  const handleSubmit = () => {
    if (selectedSchool) {
      onSubmit(selectedSchool.id, semester);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Confirm Selection</h3>
          <p className="text-gray-600 text-sm">
            You are selecting <span className="font-semibold text-indigo-600">{selectedSchool.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <label className={`
              flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all
              ${semester === Semester.Fall ? 'bg-white shadow-sm ring-1 ring-gray-200 text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
              ${!canSelectFall ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <input 
                type="radio" 
                name="semester" 
                value={Semester.Fall} 
                checked={semester === Semester.Fall}
                onChange={() => setSemester(Semester.Fall)}
                disabled={!canSelectFall}
                className="hidden"
              />
              <Calendar size={16} />
              Fall
            </label>

            <label className={`
              flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all
              ${semester === Semester.Spring ? 'bg-white shadow-sm ring-1 ring-gray-200 text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
              ${!canSelectSpring ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <input 
                type="radio" 
                name="semester" 
                value={Semester.Spring} 
                checked={semester === Semester.Spring}
                onChange={() => setSemester(Semester.Spring)}
                disabled={!canSelectSpring}
                className="hidden"
              />
              <Calendar size={16} />
              Spring
            </label>
          </div>

          <div className="flex gap-2">
            <button
               onClick={onSkip}
               className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled || (semester === Semester.Fall && !canSelectFall) || (semester === Semester.Spring && !canSelectSpring)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
            >
              <Check size={18} />
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
