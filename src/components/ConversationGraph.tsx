import React, { useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Message } from '../types/chat';

interface ConversationGraphProps {
  messages: Record<string, Message>;
  currentLeafId: string | null;
  onNodeClick: (messageId: string) => void;
}

const nodeWidth = 200;
const nodeHeight = 80;
const levelHeight = 120;

export function ConversationGraph({ messages, currentLeafId, onNodeClick }: ConversationGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const messageArray = Object.values(messages);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    if (messageArray.length === 0) {
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
                isCurrentLeaf 
                  ? 'ring-2 ring-yellow-400 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onNodeClick(message.id)}
            >
              <div className="text-xs font-medium mb-1">
                {isUser ? 'You' : 'AI'}
              </div>
              <div className="text-xs">
                {displayContent}
              </div>
              {message.isHidden && (
                <div className="text-xs mt-1 opacity-70">
                  (Hidden)
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

    return { nodes, edges };
  }, [messages, currentLeafId, onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}