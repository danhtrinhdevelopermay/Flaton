import React, { useState, useRef, useEffect } from 'react';
import { Shield, ChevronDown, Zap, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Server {
  id: number;
  name: string;
  credits: number;
}

interface ServerDropdownProps {
  servers: Server[];
  selectedServer: number | null;
  onSelect: (id: number) => void;
  requiredCredits: number;
}

export default function ServerDropdown({ servers, selectedServer, onSelect, requiredCredits }: ServerDropdownProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selected = servers.find(s => s.id === selectedServer);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 pl-12 pr-4 py-4 rounded-2xl border-2 transition-all text-left relative ${
          theme === 'dark'
            ? 'bg-slate-800/50 border-slate-700 text-white hover:border-slate-600'
            : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 shadow-sm'
        } ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : ''}`}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Shield className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">
            {selected ? (selected.name || `Server ${selected.id}`) : 'Chọn Server...'}
          </div>
          {selected && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-black uppercase text-slate-500">
                {selected.credits} Credits Khả dụng
              </span>
            </div>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 rounded-2xl border-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 shadow-2xl shadow-black/50'
            : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
        }`}>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {servers.map(server => {
              const isSelected = server.id === selectedServer;
              const isDisabled = server.credits < requiredCredits;
              
              return (
                <button
                  key={server.id}
                  disabled={isDisabled}
                  onClick={() => {
                    onSelect(server.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group relative ${
                    isSelected
                      ? 'bg-indigo-500 text-white'
                      : isDisabled
                        ? 'opacity-40 grayscale cursor-not-allowed'
                        : theme === 'dark'
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {server.name || `Server ${server.id}`}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 text-[10px] font-black uppercase ${
                      isSelected ? 'text-indigo-100' : 'text-slate-500'
                    }`}>
                      <Zap className="w-3 h-3" />
                      {server.credits} Credits
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4" />}
                  {isDisabled && (
                    <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">
                      Cạn kiệt
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
