import React, { useState, useEffect } from 'react';
import { Message } from '../types/chat';
import { User, Bot, Volume2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(false);

  // Typing animation effect
  useEffect(() => {
    if (isUser) {
      setDisplayedContent(message.content);
      return;
    }

    const targetContent = message.content;
    let currentIndex = 0;
    
    // Reset displayed content when message content changes significantly
    if (targetContent.length < displayedContent.length) {
      setDisplayedContent('');
      currentIndex = 0;
    } else {
      currentIndex = displayedContent.length;
    }

    if (currentIndex < targetContent.length) {
      const timer = setInterval(() => {
        setDisplayedContent(targetContent.slice(0, currentIndex + 1));
        currentIndex++;
        
        if (currentIndex >= targetContent.length) {
          clearInterval(timer);
        }
      }, 20); // Adjust speed here (lower = faster)

      return () => clearInterval(timer);
    }
  }, [message.content, isUser, displayedContent.length]);

  // Cursor blinking effect
  useEffect(() => {
    if (isUser || !message.isLoading) {
      setShowCursor(false);
      return;
    }

    setShowCursor(true);
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, [message.isLoading, isUser]);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-blue-500' : 'bg-gray-700'}
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-300" />
        )}
      </div>
      
      <div className={`
        max-w-[70%] rounded-2xl px-4 py-2 relative
        ${isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-700 text-gray-100'
        }
      `}>
        {message.type === 'image' && message.imageUrl && (
          <div className="mb-2">
            <img 
              src={message.imageUrl} 
              alt="Uploaded image" 
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
        
        {message.type === 'audio' && message.audioUrl && (
          <div className="mb-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <audio controls className="max-w-full">
              <source src={message.audioUrl} type="audio/webm" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {displayedContent}
          {message.isLoading && showCursor && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </p>
        
        <div className={`
          text-xs mt-1 opacity-60
          ${isUser ? 'text-blue-100' : 'text-gray-400'}
        `}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}