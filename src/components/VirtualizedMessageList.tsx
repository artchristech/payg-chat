import React, { forwardRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';
import { Message } from '../types/chat';

interface VirtualizedMessageListProps {
  messages: Message[];
  height: number;
  onScrollToBottom: () => void;
  outputFontFamily: string;
  outputLineSpacing: number;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    itemHeights: number[];
    outputFontFamily: string;
    outputLineSpacing: number;
    outputFontSize: number;
  };
}

const MessageItem = React.memo(({ index, style, data }: MessageItemProps) => {
  const message = data.messages[index];
  
  return (
    <div style={style}>
      <div className="px-4 py-3">
        <MessageBubble 
          message={message} 
          outputFontFamily={data.outputFontFamily}
          outputLineSpacing={data.outputLineSpacing}
        />
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const VirtualizedMessageList = forwardRef<any, VirtualizedMessageListProps>(
  ({ messages, height, onScrollToBottom, outputFontFamily, outputLineSpacing, outputFontSize }, ref) => {
    // Estimate item height based on message content
    const getItemHeight = useCallback((message: Message) => {
      let baseHeight = 80; // Base height for a message bubble
      
      // Add height for image content
      if (message.type === 'image' && message.imageUrl) {
        baseHeight += 150; // Estimated image height
      }
      
      // Add height for audio content
      if (message.type === 'audio' && message.audioUrl) {
        baseHeight += 60; // Estimated audio player height
      }
      
      // Add height based on text length (rough estimation)
      const textLines = Math.ceil(message.content.length / 80);
      baseHeight += Math.max(textLines * 24, 24); // 24px per line, minimum 1 line
      
      return Math.max(baseHeight, 60); // Minimum height
    }, []);

    // Memoize item heights to prevent recalculation
    const itemHeights = useMemo(() => {
      return messages.map(getItemHeight);
    }, [messages, getItemHeight]);

    // Calculate average item height for the list
    const averageItemHeight = useMemo(() => {
      if (itemHeights.length === 0) return 100;
      return Math.ceil(itemHeights.reduce((sum, height) => sum + height, 0) / itemHeights.length);
    }, [itemHeights]);

    const itemData = useMemo(() => ({
      messages,
      itemHeights,
      outputFontFamily,
      outputLineSpacing,
      outputFontSize,
    }), [messages, itemHeights, outputFontFamily, outputLineSpacing, outputFontSize]);

    const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
      // Check if scrolled to bottom (with small threshold)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (isAtBottom) {
        onScrollToBottom();
      }
    }, [onScrollToBottom]);

    if (messages.length === 0) {
      return null;
    }

    return (
      <List
        ref={ref}
        height={height}
        itemCount={messages.length}
        itemSize={averageItemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        className="hide-scrollbar"
        overscanCount={5} // Render 5 extra items outside viewport for smoother scrolling
      >
        {MessageItem}
      </List>
    );
  }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';