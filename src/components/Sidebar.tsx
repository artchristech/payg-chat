import React from 'react';
import { MessageSquare, Settings, User, History, HelpCircle } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Menu</h2>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span>New Chat</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <History className="w-5 h-5" />
            <span>Chat History</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span>Help</span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              User Account
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Signed in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}