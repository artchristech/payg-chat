import React from 'react';
import { Message } from '../types/chat';
import { Volume2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[70%] relative
        ${isUser 
          ? 'bg-blue-500 dark:bg-gray-600 text-white rounded-2xl px-4 py-3' 
          : 'text-gray-900 dark:text-gray-100'
        }
      `}>
        {(message.type === 'image' || message.type === 'generated_image') && message.imageUrl && (
          <div className="mb-2">
            <img 
              src={message.imageUrl} 
              alt={message.type === 'generated_image' ? "Generated image" : "Uploaded image"}
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
        
        <p className={`
          whitespace-pre-wrap text-base leading-relaxed transition-opacity duration-500 ease-out
          ${message.isLoading ? 'opacity-0' : 'opacity-100'}
        `}>
          {message.content}
          {message.isLoading && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}