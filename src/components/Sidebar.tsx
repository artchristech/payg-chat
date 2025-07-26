import React from 'react';
import { Bot, ChevronsLeft, ChevronsRight, Plus, MessageSquare, Users, User } from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export function Sidebar({ isExpanded, onToggle, onNewChat, onLogout }: SidebarProps) {
  return (
    <div className={`flex flex-col justify-between bg-gray-800 dark:bg-gray-900 text-white transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Top/Middle Section */}
      <div>
        {/* Header */}
        <div className="h-[68px] p-4 flex items-center justify-between">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`whitespace-nowrap transition-opacity duration-200 ${
                  isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
                }`}>
                  <span className="text-white font-semibold">payg-chat</span>
                </div>
              </div>
              <button
                onClick={onToggle}
                className={`p-1 text-gray-400 hover:text-white transition-all duration-200 flex-shrink-0 ${
                  isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
                }`}
                title="Collapse sidebar"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0"
            title={!isExpanded ? 'New Chat' : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <div className={`whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
            }`}>
              <span>New Chat</span>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0"
            title={!isExpanded ? 'Chat History' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <div className={`whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
            }`}>
              <span>Chat History</span>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0"
            title={!isExpanded ? 'Agents' : undefined}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <div className={`whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
            }`}>
              <span>Agents</span>
            </div>
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className={`flex-1 min-w-0 transition-opacity duration-200 ${
            isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
          }`}>
            <div className="text-sm text-white font-medium whitespace-nowrap">User</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">user@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}