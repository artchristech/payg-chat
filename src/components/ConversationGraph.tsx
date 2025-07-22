import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Message } from '../types/chat';
import { ThinkingBubble } from './ThinkingBubble';
import { MessageBubble } from './MessageBubble';

interface ConversationGraphProps {
  messages: Record<string, Message>;
  currentLeafId: string | null;
  onNodeClick: (messageId: string) => void;
  onReveal: (messageId: string) => void;
}

// Custom node component that renders either ThinkingBubble or MessageBubble
function CustomNode({ data }: { data: any }) {
  const { message, onReveal, isActive } = data;
  
  return (
    <div className={`p-2 rounded-lg border-2 transition-all duration-200 ${
      isActive 
        ? 'border-blue-500 shadow-lg' 
        : 'border-gray-300 dark:border-gray-600'
    }`}>
      {message.role === 'assistant' && message.isHidden ? (
        <div className="w-80">
          <ThinkingBubble messageId={message.id} onReveal={onReveal} />
        </div>
      ) : (
        <div className="w-80">
          <MessageBubble message={message} onReveal={onReveal} />
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

export function ConversationGraph({ messages, currentLeafId, onNodeClick, onReveal }: ConversationGraphProps) {
  // Convert messages to nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const messageArray = Object.values(messages);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Create a map to track node positions
    const levelMap: Record<number, number> = {};
    
    // Build the tree structure
    const buildTree = (parentId: string | null, level: number = 0, xOffset: number = 0): number => {
      const children = messageArray.filter(msg => msg.parentId === parentId);
      let currentX = xOffset;
      
      children.forEach((message, index) => {
        const nodeId = message.id;
        
        // Calculate position
        if (!levelMap[level]) levelMap[level] = 0;
        const x = currentX * 400;
        const y = level * 200;
        
        // Create node
        nodes.push({
          id: nodeId,
          type: 'customNode',
          position: { x, y },
          data: {
            message,
            onReveal,
            isActive: nodeId === currentLeafId,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
        
        // Create edge if has parent
        if (parentId) {
          edges.push({
            id: `${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            style: { stroke: '#6366f1', strokeWidth: 2 },
          });
        }
        
        // Recursively build children
        const childrenWidth = buildTree(nodeId, level + 1, currentX);
        currentX += Math.max(1, childrenWidth);
      });
      
      return Math.max(1, children.length);
    };
    
    buildTree(null);
    
    return { nodes, edges };
  }, [messages, currentLeafId, onReveal]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes when messages change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);
  
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}