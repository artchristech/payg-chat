import React from 'react';
import { Message } from '../types/chat';
import { Volume2, MoreHorizontal } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onContinue?: (messageId: string) => void;
}

export function MessageBubble({ message, onContinue }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[70%] relative
        ${isUser 
          ? 'bg-gray-600 text-white rounded-2xl px-4 py-3' 
          : 'text-gray-100'
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
        
        <p className={`
          whitespace-pre-wrap text-base leading-relaxed
        `}>
          {message.content}
          {message.isLoading && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </p>
        
        {/* Continue Button for Chunked Messages */}
        {message.canContinue && !message.isLoading && onContinue && (
          <div className="mt-4 flex justify-start">
            <button
              onClick={() => onContinue(message.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-600 hover:border-gray-500"
            >
              <MoreHorizontal className="w-4 h-4" />
              Continue
            </button>
          </div>
        )}
        
        {/* Chunk Indicator */}
        {message.isChunked && message.chunkIndex !== undefined && message.totalChunks !== undefined && (
          <div className="mt-2 text-xs text-gray-500">
            Part {message.chunkIndex} of {message.totalChunks}
          </div>
        )}
      </div>
    </div>
  );
}