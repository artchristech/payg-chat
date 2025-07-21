import React from 'react';
import { Message } from '../types/chat';
import { Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        
        <div className={`
          text-base leading-relaxed transition-opacity duration-500 ease-out
          ${message.isLoading ? 'opacity-0' : 'opacity-100'}
        `}>
          {isUser ? (
            <div className="whitespace-pre-wrap">
              {message.content}
              {message.isLoading && (
                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
              )}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {message.isLoading && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MessageBubble);