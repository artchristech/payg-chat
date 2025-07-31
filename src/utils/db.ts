import { supabase } from './supabaseClient';
import { Message, Conversation } from '../types/chat';

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio' | 'image_generation_request' | 'generated_image';
  image_url?: string;
  audio_url?: string;
  file_name?: string;
  file_content?: string; // Added for parsed file content
  file_title?: string; // Added for parsed file title
  file_type?: string;
  parent_id?: string;
  created_at: string;
  model_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
}

export interface DatabaseConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  model_id: string;
  max_tokens: number;
  cost: number;
}

// Convert database message to app message format
function dbMessageToMessage(dbMessage: DatabaseMessage): Message {
  return {
    id: dbMessage.id,
    role: dbMessage.role,
    content: dbMessage.content,
    timestamp: new Date(dbMessage.created_at),
    type: dbMessage.type,
    imageUrl: dbMessage.image_url,
    audioUrl: dbMessage.audio_url,
    fileName: dbMessage.file_name,
    fileContent: dbMessage.file_content, // Added
    fileTitle: dbMessage.file_title, // Added
    fileType: dbMessage.file_type,
    parentId: dbMessage.parent_id,
    promptTokens: dbMessage.prompt_tokens,
    completionTokens: dbMessage.completion_tokens,
    cost: dbMessage.cost,
    modelId: dbMessage.model_id,
  };
}

// Convert database conversation to app conversation format
function dbConversationToConversation(dbConversation: DatabaseConversation): Conversation {
  return {
    id: dbConversation.id,
    userId: dbConversation.user_id,
    title: dbConversation.title,
    createdAt: new Date(dbConversation.created_at),
    updatedAt: new Date(dbConversation.updated_at),
    lastMessageAt: new Date(dbConversation.last_message_at),
    modelId: dbConversation.model_id,
    maxTokens: dbConversation.max_tokens,
    cost: dbConversation.cost,
  };
}

// Create a new conversation
export async function createConversation(
  userId: string,
  title: string = 'New Chat',
  modelId: string,
  maxTokens: number
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title,
      model_id: modelId,
      max_tokens: maxTokens,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return dbConversationToConversation(data);
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return data.map(dbConversationToConversation);
}

// Get messages for a specific conversation
export async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data.map(dbMessageToMessage);
}

// Save a new message
export async function saveMessage(
  conversationId: string,
  userId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: message.role,
      content: message.content,
      type: message.type,
      image_url: message.imageUrl,
      audio_url: message.audioUrl,
      file_name: message.fileName,
      file_content: message.fileContent, // Added
      file_title: message.fileTitle, // Added
      file_type: message.fileType,
      parent_id: message.parentId,
      model_id: message.modelId,
      prompt_tokens: message.promptTokens || 0,
      completion_tokens: message.completionTokens || 0,
      cost: message.cost || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return dbMessageToMessage(data);
}

// Update an existing message
export async function updateMessage(
  messageId: string,
  updates: Partial<Pick<Message, 'content' | 'promptTokens' | 'completionTokens' | 'cost'>>
): Promise<void> {
  const updateData: any = {};
  
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.promptTokens !== undefined) updateData.prompt_tokens = updates.promptTokens;
  if (updates.completionTokens !== undefined) updateData.completion_tokens = updates.completionTokens;
  if (updates.cost !== undefined) updateData.cost = updates.cost;

  const { error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId);

  if (error) {
    console.error('Error updating message:', error);
    throw new Error(`Failed to update message: ${error.message}`);
  }
}

// Update conversation metadata
export async function updateConversation(
  conversationId: string,
  updates: Partial<Pick<Conversation, 'title' | 'cost' | 'lastMessageAt'>>
): Promise<void> {
  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.lastMessageAt !== undefined) updateData.last_message_at = updates.lastMessageAt.toISOString();

  const { error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation:', error);
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
}

// Delete a conversation and all its messages
export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}

// Generate a title for a conversation based on the first user message
export function generateConversationTitle(firstMessage: string): string {
  // Remove common prefixes and clean up the message
  const cleaned = firstMessage
    .replace(/^(help me with|can you|please|could you|i need|i want to|how do i|what is|explain)/i, '')
    .trim();
  
  // Take first 50 characters and add ellipsis if needed
  const title = cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  
  // Fallback to "New Chat" if the title is empty or too short
  return title.length > 5 ? title : 'New Chat';
}