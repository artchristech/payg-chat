import React from 'react';
import { Bot, ChevronsLeft, ChevronsRight, Plus, MessageSquare, Users, User, Trash2, Clock } from 'lucide-react';
import { Conversation } from '../types/chat';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onLogout: () => void;
  currentConversationId: string | null;
  conversations: Record<string, Conversation>;
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onShowDeleteConfirm: (conversationId: string) => void;
}

export function Sidebar({ 
  isExpanded, 
  onToggle, 
  onNewChat, 
  onLogout, 
  currentConversationId, 
  conversations, 
  onLoadConversation, 
  onDeleteConversation,
  onShowDeleteConfirm
}: SidebarProps) {
  const [showHistory, setShowHistory] = React.useState(false);
  
  // Reset showHistory when sidebar collapses
  React.useEffect(() => {
    if (!isExpanded) {
      setShowHistory(false);
    }
  }, [isExpanded]);
  
  const conversationList = Object.values(conversations).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    onShowDeleteConfirm(conversationId);
  };

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
                <Bot className="w-6 h-6 text-blue-400 flex-shrink-0" />
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
            onClick={() => {
              if (!isExpanded) {
                onToggle();
              }
              onNewChat();
            }}
            className={`w-full flex rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0 ${
              isExpanded ? 'items-center justify-start p-4 gap-3' : 'items-center justify-center p-4'
            }`}
            title={!isExpanded ? 'New Chat' : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <div className="flex-1 text-left whitespace-nowrap transition-opacity duration-200 opacity-100 delay-150">
                <span>New Chat</span>
              </div>
            )}
          </button>

          <button
            onClick={() => {
              if (!isExpanded) {
                onToggle();
              } else {
                setShowHistory(!showHistory);
              }
            }}
            className={`w-full flex rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0 ${
              isExpanded ? 'items-center justify-start p-4 gap-3' : 'items-center justify-center p-4'
            } ${showHistory ? 'bg-gray-700' : ''}`}
            title={!isExpanded ? 'Chat History' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <div className="flex-1 text-left whitespace-nowrap transition-opacity duration-200 opacity-100 delay-150">
                <span>Chat History</span>
              </div>
            )}
          </button>

          <button
            onClick={() => {
              if (!isExpanded) {
                onToggle();
              }
            }}
            className={`w-full flex rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-w-0 ${
              isExpanded ? 'items-center justify-start p-4 gap-3' : 'items-center justify-center p-4'
            }`}
            title={!isExpanded ? 'Agents' : undefined}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <div className="flex-1 text-left whitespace-nowrap transition-opacity duration-200 opacity-100 delay-150">
                <span>Agents</span>
              </div>
            )}
          </button>
        </div>

        {/* Chat History */}
        {isExpanded && showHistory && (
          <div className="px-4 pb-4">
            <div className="border-t border-gray-700 pt-4">
              <div className="max-h-96 overflow-y-auto hide-scrollbar space-y-1">
                {conversationList.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversationList.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conversation.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                      }`}
                      onClick={() => onLoadConversation(conversation.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {conversation.title}
                        </div>
                        <div className="text-xs opacity-70 truncate">
                          {new Date(conversation.lastMessageAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
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