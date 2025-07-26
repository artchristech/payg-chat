import React, { useState } from 'react';
import { Bot, Plus, MessageSquare, Users, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export function Sidebar({ isExpanded, onToggle, onNewChat, onLogout }: SidebarProps) {
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  return (
    <div className={`fixed top-0 left-0 h-full z-40 bg-gray-800 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      <div className="flex flex-col justify-between h-full">
        {/* Top/Main Section */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 dark:border-gray-600">
            {isExpanded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-semibold">payg-chat</span>
                </div>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Primary Actions */}
          <div className="p-4 space-y-2">
            <button
              onClick={onNewChat}
              className={`w-full flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title={!isExpanded ? "New Chat" : undefined}
            >
              <Plus className="w-5 h-5" />
              {isExpanded && <span>New Chat</span>}
            </button>
            
            <button
              className={`w-full flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title={!isExpanded ? "Chat History" : undefined}
            >
              <MessageSquare className="w-5 h-5" />
              {isExpanded && <span>Chat History</span>}
            </button>
            
            <button
              className={`w-full flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title={!isExpanded ? "Agents" : undefined}
            >
              <Users className="w-5 h-5" />
              {isExpanded && <span>Agents</span>}
            </button>
          </div>
        </div>

        {/* Bottom Section - User Profile */}
        <div className="p-4 border-t border-gray-700 dark:border-gray-600">
          {isExpanded ? (
            <div
              className="relative"
              onMouseEnter={() => setIsProfileExpanded(true)}
              onMouseLeave={() => setIsProfileExpanded(false)}
            >
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">User</div>
                  <div className="text-gray-400 text-xs truncate">user@example.com</div>
                </div>
              </div>
              
              {isProfileExpanded && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-3 space-y-2">
                  <div className="text-white text-sm font-medium">user@example.com</div>
                  <div className="flex items-center justify-between">
                    <ThemeSelector />
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 px-3 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                U
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}