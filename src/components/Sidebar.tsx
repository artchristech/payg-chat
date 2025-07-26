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
    <div className={`fixed top-0 left-0 h-full z-40 bg-gray-800 dark:bg-gray-900 flex flex-col justify-between transition-all duration-300 ease-in-out ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Top/Middle Section */}
      <div>
        {/* Header */}
        <div className="h-[68px] p-4 flex items-center border-b border-gray-700">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                <Bot className="w-6 h-6 text-blue-400" />
                <span className="text-white font-semibold">payg-chat</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronsLeft className="w-5 h-5 flex-shrink-0" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-white transition-colors w-full flex justify-center"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-5 h-5 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Primary Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
              !isExpanded ? 'justify-center' : ''
            }`}
            title={!isExpanded ? 'New Chat' : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span>New Chat</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
              !isExpanded ? 'justify-center' : ''
            }`}
            title={!isExpanded ? 'Chat History' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span>Chat History</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${
              !isExpanded ? 'justify-center' : ''
            }`}
            title={!isExpanded ? 'Agents' : undefined}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span>Agents</span>}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <div className="flex-1">
              <div className="text-sm text-white font-medium">User</div>
              <div className="text-xs text-gray-400">user@example.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}