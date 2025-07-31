/*
  # Create initial chat data RPC function

  1. New Functions
    - `get_initial_chat_data(p_user_id uuid)` - Returns combined conversations and messages data
      - Fetches all conversations for a user (ordered by last_message_at DESC)
      - Fetches messages for the most recent conversation only
      - Returns single JSON object with both datasets

  2. Performance Benefits
    - Reduces network round trips from 2 to 1
    - Eliminates request waterfall on initial load
    - Improves cold start performance

  3. Security
    - Function respects existing RLS policies
    - Only returns data for the specified user
*/

CREATE OR REPLACE FUNCTION get_initial_chat_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
    latest_conversation_id uuid;
    conversations_json json;
    messages_json json;
BEGIN
    -- Get all conversations for the user and order them
    SELECT json_agg(c.* ORDER BY c.last_message_at DESC) INTO conversations_json
    FROM conversations c
    WHERE c.user_id = p_user_id;

    -- Find the ID of the most recent conversation from the already fetched data
    -- This is a more efficient way to get the latest conversation id
    IF json_array_length(conversations_json) > 0 THEN
        latest_conversation_id := (conversations_json->0->>'id')::uuid;

        -- Get messages for only the most recent conversation
        SELECT json_agg(m.* ORDER BY m.created_at ASC) INTO messages_json
        FROM messages m
        WHERE m.conversation_id = latest_conversation_id;
    ELSE
        -- If no conversations, messages will be an empty array
        messages_json := '[]'::json;
    END IF;

    -- Combine everything into a single JSON object
    RETURN json_build_object(
        'conversations', COALESCE(conversations_json, '[]'::json),
        'messages', COALESCE(messages_json, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql;