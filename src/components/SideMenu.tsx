import React, { useState } from 'react';
import { Menu, MessageSquare, Settings, User, HelpCircle, LogOut } from 'lucide-react';

export function SideMenu() {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { icon: MessageSquare, label: 'New Chat', action: () => console.log('New Chat') },
    { icon: User, label: 'Profile', action: () => console.log('Profile') },
    { icon: Settings, label: 'Settings', action: () => console.log('Settings') },
    { icon: HelpCircle, label: 'Help', action: () => console.log('Help') },
    { icon: LogOut, label: 'Sign Out', action: () => console.log('Sign Out') },
  ];

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanded Menu Panel */}
      <div
        className={`
          absolute bottom-16 right-0 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-2xl shadow-2xl
          transition-all duration-300 ease-out origin-bottom-right
          ${isHovered 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          }
        `}
      >
        <div className="p-3 space-y-1 min-w-[180px]">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-100 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
            >
              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Button */}
      <button
        className={`
          w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full 
          shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 ease-out
          flex items-center justify-center group relative overflow-hidden
          ${isHovered ? 'rotate-90' : 'rotate-0'}
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon */}
        <Menu className="w-6 h-6 relative z-10 transition-transform duration-300" />
        
        {/* Subtle pulse effect */}
        <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </div>
  );
}