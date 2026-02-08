import React, { useEffect, useState } from 'react';
import { User, School, Semester } from './types';
import { db } from './services/mockDb';
import { SchoolTable } from './components/SchoolTable';
import { StatusBoard } from './components/StatusBoard';
import { SelectionPanel } from './components/SelectionPanel';
import { AdminPanel } from './components/AdminPanel';
import { LogIn, RefreshCcw, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [activeRank, setActiveRank] = useState<number | null>(null);
  
  // Selection UI State
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  // Helper to refresh data from DB
  const refreshAppState = () => {
    setUsers(db.getUsers());
    setSchools(db.getSchools());
    setCurrentRound(db.getCurrentRound());
    setActiveRank(db.getActiveRank());

    // Update Current User object if their status/selection changed
    if (currentUser && !currentUser.isAdmin) {
      const updatedMe = db.getUsers().find(u => u.id === currentUser.id);
      if (updatedMe) {
         setCurrentUser(updatedMe); 
      }
    }
  };

  // Poll for updates (Simulate real-time)
  useEffect(() => {
    const fetchData = () => {
      // 1. Sync with storage (in case Admin updated in another tab)
      db.sync(); 
      
      // 2. Ensure local state logic is correct (e.g., advancing turns)
      db.refreshStatus(); 
      
      // 3. Update React State
      refreshAppState();
    };

    fetchData(); // Initial load
    const interval = setInterval(fetchData, 1000); // Polling every 1s
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.login(loginInput);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
    } else {
      setLoginError('User not found. Try "Alice Chen" or ID "1". For admin, type "admin".');
    }
  };

  const handleSelectSchool = (schoolId: number) => {
    // Can only click if it's my turn
    if (activeRank === currentUser?.rank) {
      setSelectedSchoolId(schoolId === selectedSchoolId ? null : schoolId);
    }
  };

  const handleSubmitSelection = (schoolId: number, semester: Semester) => {
    if (!currentUser) return;
    const result = db.submitSelection(currentUser.id, schoolId, semester);
    if (result.success) {
      setSelectedSchoolId(null);
      refreshAppState(); // Immediate update
    } else {
      alert(result.message);
    }
  };

  const handleSkip = () => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to skip your turn for this round? This decision is final.")) {
       const result = db.skipTurn(currentUser.id);
       if (result.success) {
         setSelectedSchoolId(null);
         refreshAppState(); // Immediate update so UI reflects change instantly
       } else {
         alert(result.message || "Failed to skip turn. It might not be your turn anymore.");
       }
    }
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
               <LogIn size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Student Exchange Portal</h1>
            <p className="text-gray-500 mt-2">Login to select your destination</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name or Student ID</label>
              <input
                type="text"
                id="name"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="e.g. Alice Chen"
              />
              {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Sign In
            </button>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Rank 1: Alice Chen</li>
                <li>Rank 2: Bob Smith</li>
                <li>Admin: admin</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isMyTurn = currentUser.rank === activeRank;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
               <RefreshCcw size={20} />
             </div>
             <h1 className="text-xl font-bold text-gray-900">ExchangeSelect</h1>
             {currentUser.isAdmin && (
                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded ml-2">ADMIN</span>
             )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
              {!currentUser.isAdmin && <div className="text-xs text-gray-500">Rank #{currentUser.rank}</div>}
            </div>
            <button 
              onClick={() => { db.logout(); setCurrentUser(null); }}
              className="text-gray-500 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentUser.isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            {/* Status Board */}
            <StatusBoard 
              users={users} 
              schools={schools}
              currentUser={currentUser} 
              activeRank={activeRank} 
              currentRound={currentRound} 
            />

            {/* School List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Available Universities</h2>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                    {schools.reduce((acc, s) => acc + s.slotsFall + s.slotsSpring + s.slotsFlexible, 0)} slots remaining
                </span>
              </div>
              
              <SchoolTable 
                schools={schools} 
                selectedSchoolId={selectedSchoolId}
                onSelectSchool={handleSelectSchool}
                disabled={!isMyTurn}
              />
            </div>
          </>
        )}
      </main>

      {/* Selection Control Panel (Sticky Bottom) - Only show if not Admin */}
      {!currentUser.isAdmin && (
        <SelectionPanel 
          selectedSchool={schools.find(s => s.id === selectedSchoolId) || null}
          onSubmit={handleSubmitSelection}
          onSkip={handleSkip}
          disabled={!isMyTurn}
        />
      )}
    </div>
  );
};

export default App;
