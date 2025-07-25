import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  ChevronsLeft, 
  ChevronsRight, 
  Plus, 
  MessageSquare, 
  Users, 
  LogOut 
} from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { supabase } from '../utils/supabaseClient';

interface SidebarProps {
  onNewChat: () => void;
  onLogout: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function Sidebar({ onNewChat, onLogout, isExpanded, onToggle }: SidebarProps) {
  const [userEmail, setUserEmail] = useState<string>('');

  // Get user info on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setUserInitial(user.email.charAt(0).toUpperCase());
      }
    };
    getUser();
  }, []);

  const recentChats = [
    'Market research for SaaS',
    'Python data analysis help',
    'React component design',
    'AI model comparison',
    'Database optimization tips',
    'Content strategy ideas',
  ];

  const primaryActions = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: Plus,
      onClick: onNewChat,
    },
    {
      id: 'chat-history',
      label: 'Chat History',
      icon: MessageSquare,
      onClick: () => {}, // Placeholder
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: Users,
      onClick: () => {}, // Placeholder
    },
  ];

  return (
    <div className={`
      fixed top-0 left-0 bg-gray-800 dark:bg-gray-900 text-white h-full flex flex-col justify-between transition-all duration-300 ease-in-out z-40
      ${isExpanded ? 'w-64' : 'w-16'}
    `}>
      {/* Top Section */}
      <div>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {isExpanded ? (
              <>
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-blue-400" />
                  <span className="font-semibold text-lg">payg-chat</span>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors mx-auto"
                title="Expand sidebar"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="p-4 space-y-2">
          {primaryActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors group relative
                  ${!isExpanded ? 'justify-center' : ''}
                `}
                title={!isExpanded ? action.label : undefined}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium">{action.label}</span>
                )}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {action.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Recents Section */}
        {isExpanded && (
          <div className="px-4 pb-4 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recents
            </h3>
            <div className="space-y-1 overflow-y-auto max-h-96">
              {recentChats.map((chat, index) => (
                <button
                  key={index}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white truncate block">
                    {chat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700 dark:border-gray-800">
        <div className={`
          group relative
          ${isExpanded ? 'hover:bg-gray-700 dark:hover:bg-gray-800 rounded-lg transition-colors' : ''}
        `}>
          <div className={`
            flex items-center gap-3 p-2
            ${!isExpanded ? 'justify-center' : ''}
          `}>
            {/* User Avatar */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {userInitial}
            </div>
            
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {userEmail}
                </div>
              </div>
            )}
            
            {isExpanded && (
              <div className="flex items-center gap-1">
                <ThemeSelector />
                <button
                  onClick={onLogout}
                  className="p-1 hover:bg-gray-600 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Collapsed state tooltip */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 bottom-0 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {userEmail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}