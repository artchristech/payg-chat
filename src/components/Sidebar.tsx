import React from 'react';
import { Plus, History, Users, User, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function Sidebar({ isExpanded, onToggleExpand }: SidebarProps) {
  return (
    <div className={`fixed top-0 left-0 h-full z-40 bg-gray-800 dark:bg-gray-900 flex flex-col justify-between transition-all duration-300 ease-in-out ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Top & Middle Section */}
      <div>
        {/* Header */}
        <div className="h-[68px] flex items-center justify-center border-b border-gray-700">
          <button
            onClick={onToggleExpand}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronsLeft className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ChevronsRight className="w-5 h-5 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Primary Actions */}
        <div className="p-4 space-y-2">
          <button className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
            !isExpanded ? 'justify-center' : ''
          }`}>
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">New Chat</span>}
          </button>

          <button className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
            !isExpanded ? 'justify-center' : ''
          }`}>
            <History className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Chat History</span>}
          </button>

          <button className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
            !isExpanded ? 'justify-center' : ''
          }`}>
            <Users className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Agents</span>}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">User</div>
              <div className="text-xs text-gray-400 truncate">user@example.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}