import React, { useState } from 'react';
import { User, UserStatus, School } from '../types';
import { Clock, CheckCircle, Lock, User as UserIcon } from 'lucide-react';

interface StatusBoardProps {
  users: User[];
  schools: School[];
  currentUser: User;
  activeRank: number | null;
  currentRound: number;
}

// Simple internal Tooltip component to handle overflow truncation
const Tooltip = ({ text, children, className }: { text: string, children: React.ReactNode, className?: string }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ 
        x: rect.left + rect.width / 2, 
        y: rect.top 
    });
    setShow(true);
  };

  return (
    <div 
        className={className}
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
            className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[110%]"
            style={{ top: pos.y, left: pos.x, maxWidth: '300px' }}
        >
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export const StatusBoard: React.FC<StatusBoardProps> = ({ users, schools, currentUser, activeRank, currentRound }) => {
  const activeUser = users.find(u => u.rank === activeRank);
  const isMyTurn = currentUser.rank === activeRank;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Round {currentRound} Status
           </h2>
           <p className="text-sm text-gray-500 mt-1">
             Exchange Program Selection • {users.filter(u => u.status === UserStatus.Completed).length} / {users.length} Completed
           </p>
        </div>
        
        <div className={`
          px-4 py-3 rounded-lg flex items-center gap-3 border
          ${isMyTurn ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}
        `}>
          {isMyTurn ? (
            <>
              <div className="animate-pulse relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <span className="font-semibold">It's your turn! Please select.</span>
            </>
          ) : (
            <>
              <Clock size={18} />
              <span>
                Current Turn: <strong>Rank {activeRank} - {activeUser?.name || 'Processing...'}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar/User List - Simplified Horizontal Scroll */}
      <div className="relative">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {users.map((user) => {
             const isActive = user.rank === activeRank;
             const isCompleted = user.status === UserStatus.Completed || user.status === UserStatus.Skipped;
             const isMe = user.id === currentUser.id;
             
             // Determine selection display: "学校名 - 学期"
             const selection = currentRound === 1 ? user.selectedRound1 : user.selectedRound2;
             const selectionLabel = selection
               ? (() => {
                   const name = schools.find(s => s.id === selection.schoolId)?.name;
                   return name ? `${name} - ${selection.semester}` : null;
                 })()
               : null;

             return (
               <div 
                  key={user.id}
                  className={`
                    flex-shrink-0 w-48 p-3 rounded-lg border snap-start
                    flex flex-col gap-2 relative transition-all
                    ${isActive ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}
                    ${isCompleted ? 'bg-gray-50 opacity-75' : ''}
                  `}
               >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      Rank {user.rank}
                    </span>
                    {isCompleted ? (
                       <CheckCircle size={16} className="text-green-500" />
                    ) : isActive ? (
                       <Clock size={16} className="text-indigo-600 animate-spin-slow" />
                    ) : (
                       <Lock size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="font-medium text-sm truncate flex items-center gap-1">
                    <UserIcon size={14} className="text-gray-400" />
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.status}
                    {selection && selectionLabel && (
                      <Tooltip text={selectionLabel} className="mt-1">
                        <span className="block text-indigo-600 truncate cursor-help hover:text-indigo-800 transition-colors">
                          Selected: {selectionLabel}
                        </span>
                      </Tooltip>
                    )}
                  </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
};
