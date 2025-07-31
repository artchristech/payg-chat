import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { ContextBlock } from '../types/chat';

export function useContextBlocks() {
  const {
    contextBlocks,
    addContextBlock,
    removeContextBlock,
    wireContextToMessage,
    unwireContextFromMessage,
  } = useChatStore();

  const createContextBlock = useCallback((blockData: Omit<ContextBlock, 'id' | 'createdAt'>) => {
    const newBlock: ContextBlock = {
      ...blockData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    addContextBlock(newBlock);
    return newBlock;
  }, [addContextBlock]);

  const deleteContextBlock = useCallback((blockId: string) => {
    removeContextBlock(blockId);
  }, [removeContextBlock]);

  const wireContext = useCallback((messageId: string, contextId: string) => {
    wireContextToMessage(messageId, contextId);
  }, [wireContextToMessage]);

  const unwireContext = useCallback((messageId: string, contextId: string) => {
    unwireContextFromMessage(messageId, contextId);
  }, [unwireContextFromMessage]);

  return {
    contextBlocks,
    createContextBlock,
    deleteContextBlock,
    wireContext,
    unwireContext,
  };
}