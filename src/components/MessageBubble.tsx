import React from 'react';
import { Message } from '../types/chat';
import { User, Bot, Loader2, Volume2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

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
          : 'bg-gray-800 text-gray-100 border border-gray-700'
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
        
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm opacity-70">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}
        
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