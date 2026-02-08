import React from 'react';
import { School } from '../types';
import { Globe, BookOpen } from 'lucide-react';

interface SchoolTableProps {
  schools: School[];
  selectedSchoolId?: number | null;
  onSelectSchool: (id: number) => void;
  disabled: boolean;
  /** 第 1 轮已选学校 ID；第 2 轮时该学校不可再选 */
  round1SchoolId?: number | null;
}

export const SchoolTable: React.FC<SchoolTableProps> = ({ 
  schools, 
  selectedSchoolId, 
  onSelectSchool,
  disabled,
  round1SchoolId = null,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School Name
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fall
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spring
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flexible
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Remaining
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map((school) => {
              const total = school.slotsFall + school.slotsSpring + school.slotsFlexible;
              const isSelected = selectedSchoolId === school.id;
              const isFullyBooked = total === 0;
              const isDisabledRound2SameSchool = round1SchoolId != null && school.id === round1SchoolId;
              const isRowDisabled = disabled || isFullyBooked || isDisabledRound2SameSchool;
              
              return (
                <tr 
                  key={school.id} 
                  onClick={() => !isRowDisabled && onSelectSchool(school.id)}
                  className={`
                    transition-colors cursor-pointer
                    ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    ${isRowDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50/50' : ''}
                  `}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                         <Globe size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-mono">
                    {school.slotsFall}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-mono">
                    {school.slotsSpring}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-mono">
                    {school.slotsFlexible}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${total > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
