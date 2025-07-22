import React, { useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  Position,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Message, ContextBlock } from '../types/chat';

interface ConversationGraphProps {
  messages: Record<string, Message>;
  currentLeafId: string | null;
  onNodeClick: (messageId: string) => void;
  contextBlocks: Record<string, ContextBlock>;
  onWireContext: (messageId: string, contextId: string) => void;
  onUnwireContext: (messageId: string, contextId: string) => void;
}

const nodeWidth = 200;
const nodeHeight = 80;
const levelHeight = 120;

// A helper component to fit the view when nodes change
function FitViewUpdater({ nodes }: { nodes: Node[] }) {
  const { fitView } = useReactFlow();
  React.useEffect(() => {
    fitView({ padding: 0.2 });
  }, [nodes, fitView]);
  return null;
}

export function ConversationGraph({ messages, currentLeafId, onNodeClick, contextBlocks, onWireContext, onUnwireContext }: ConversationGraphProps) {
  // Debug logging
  console.log('ConversationGraph - messages prop:', messages);
  console.log('ConversationGraph - currentLeafId:', currentLeafId);
  console.log('ConversationGraph - Object.keys(messages).length:', Object.keys(messages).length);

  const handleDrop = useCallback((event: React.DragEvent, messageId: string) => {
    event.preventDefault();
    const contextData = event.dataTransfer.getData('application/context-block');
    if (contextData) {
      try {
        const { id: contextId } = JSON.parse(contextData);
        onWireContext(messageId, contextId);
      } catch (error) {
        console.error('Error parsing dropped context data:', error);
      }
    }
  }, [onWireContext]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const { nodes, edges } = useMemo(() => {
    console.log('ConversationGraph - useMemo executing...');
    const messageArray = Object.values(messages);
    console.log('ConversationGraph - messageArray:', messageArray);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    if (messageArray.length === 0) {
      console.log('ConversationGraph - No messages, returning empty nodes/edges');
      return { nodes, edges };
    }

    // Build a tree structure to calculate positions
    const childrenMap = new Map<string, string[]>();
    const rootMessages: Message[] = [];
    
    messageArray.forEach(message => {
      if (message.parentId === null) {
        rootMessages.push(message);
      } else {
        if (!childrenMap.has(message.parentId)) {
          childrenMap.set(message.parentId, []);
        }
        childrenMap.get(message.parentId)!.push(message.id);
      }
    });

    // Calculate positions using a simple tree layout
    const positionMap = new Map<string, { x: number; y: number; level: number }>();
    const levelCounts = new Map<number, number>();

    function calculatePosition(messageId: string, level: number = 0): void {
      const currentCount = levelCounts.get(level) || 0;
      levelCounts.set(level, currentCount + 1);
      
      const x = currentCount * (nodeWidth + 50);
      const y = level * levelHeight;
      
      positionMap.set(messageId, { x, y, level });
      
      const children = childrenMap.get(messageId) || [];
      children.forEach(childId => {
        calculatePosition(childId, level + 1);
      });
    }

    // Start with root messages
    rootMessages.forEach(message => {
      calculatePosition(message.id);
    });

    // Create nodes
    messageArray.forEach(message => {
      const position = positionMap.get(message.id) || { x: 0, y: 0, level: 0 };
      const isCurrentLeaf = message.id === currentLeafId;
      const isUser = message.role === 'user';
      const hasWiredContext = message.wiredContextIds && message.wiredContextIds.length > 0;
      
      // Truncate content for display
      const displayContent = message.content.length > 50 
        ? message.content.substring(0, 50) + '...' 
        : message.content;

      nodes.push({
        id: message.id,
        type: 'default',
        position: { x: position.x, y: position.y },
        data: {
          label: (
            <div 
              className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isUser 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              } ${
                hasWiredContext 
                  ? 'ring-2 ring-green-400 ring-offset-2' 
                  : ''
              }`}
                isCurrentLeaf 
                  ? 'ring-2 ring-yellow-400 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onNodeClick(message.id)}
              onDrop={(e) => handleDrop(e, message.id)}
              onDragOver={handleDragOver}
            >
              <div className="text-xs font-medium mb-1">
                <div className="flex items-center justify-between">
                  <span>{isUser ? 'You' : 'AI'}</span>
                  {hasWiredContext && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs">{message.wiredContextIds!.length}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs">
                {displayContent}
              </div>
              {message.isHidden && (
                <div className="text-xs mt-1 opacity-70">
                  (Hidden)
                </div>
              )}
              {hasWiredContext && (
                <div className="text-xs mt-1 opacity-70">
                  <div className="flex flex-wrap gap-1">
                    {message.wiredContextIds!.map(contextId => {
                      const context = contextBlocks[contextId];
                      return context ? (
                        <span key={contextId} className="px-1 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                          {context.title.length > 10 ? `${context.title.substring(0, 10)}...` : context.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          width: nodeWidth,
          height: nodeHeight,
          background: 'transparent',
          border: 'none',
        },
      });
    });

    // Create edges
    messageArray.forEach(message => {
      if (message.parentId) {
        edges.push({
          id: `${message.parentId}-${message.id}`,
          source: message.parentId,
          target: message.id,
          type: 'smoothstep',
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
        });
      }
    });

    console.log('ConversationGraph - Generated nodes:', nodes);
    console.log('ConversationGraph - Generated edges:', edges);
    console.log('ConversationGraph - Nodes count:', nodes.length);
    console.log('ConversationGraph - Edges count:', edges.length);

    return { nodes, edges };
  }, [messages, currentLeafId, onNodeClick, contextBlocks, handleDrop, handleDragOver]);

  console.log('ConversationGraph - Final nodes for ReactFlow:', nodes);
  console.log('ConversationGraph - Final edges for ReactFlow:', edges);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      {console.log('ConversationGraph - Rendering ReactFlow with nodes:', nodes.length, 'edges:', edges.length)}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <FitViewUpdater nodes={nodes} />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}