@@ .. @@
+-- First, drop the old version of the function if it exists
+DROP FUNCTION IF EXISTS get_initial_chat_data(uuid);
+
+-- Now, create the new version
 CREATE OR REPLACE FUNCTION get_initial_chat_data(p_user_id uuid)