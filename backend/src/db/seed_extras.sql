-- 1. Ensure columns exist
ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add sample data
DO $$
DECLARE
  board_marketing INT;
  board_roadmap INT;
  board_events INT;
  list_mkt_todo INT;
  list_mkt_doing INT;
  list_mkt_done INT;
  list_rdm_ideas INT;
  list_evt_planning INT;
  card_social INT;
  card_news INT;
  card_brainstorm INT;
  card_venue INT;
  card_catering INT;
BEGIN
  -- A. Boards for existing members (1: Aman, 2: Priya, 3: Rahul, 4: Sneha, 5: Chahal)
  INSERT INTO boards (member_id, title, bg_type, bg_value) 
  VALUES (1, 'Marketing Campaign 2026', 'image', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600') 
  RETURNING id INTO board_marketing;

  INSERT INTO boards (member_id, title, bg_type, bg_value) 
  VALUES (2, 'Product Roadmap Q3', 'gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') 
  RETURNING id INTO board_roadmap;

  INSERT INTO boards (member_id, title, bg_type, bg_value) 
  VALUES (3, 'Event Planning', 'color', '#eb5a46') 
  RETURNING id INTO board_events;

  -- Add members to starred_boards
  INSERT INTO starred_boards (member_id, board_id) VALUES 
  (1, board_marketing),
  (2, board_roadmap),
  (3, board_events);

  -- B. Lists
  INSERT INTO lists (board_id, title, position, color) VALUES 
  (board_marketing, 'To Do', 1, '#ff9f1a') RETURNING id INTO list_mkt_todo;
  INSERT INTO lists (board_id, title, position, color) VALUES 
  (board_marketing, 'Doing', 2, '#0079bf') RETURNING id INTO list_mkt_doing;
  INSERT INTO lists (board_id, title, position, color) VALUES 
  (board_marketing, 'Done', 3, '#61bd4f') RETURNING id INTO list_mkt_done;
  
  INSERT INTO lists (board_id, title, position, color) VALUES 
  (board_roadmap, 'Q3 Ideas', 1, '#8e44ad') RETURNING id INTO list_rdm_ideas;

  INSERT INTO lists (board_id, title, position, color) VALUES 
  (board_events, 'Planning', 1, '#eb5a46') RETURNING id INTO list_evt_planning;

  -- C. Cards (with due dates, covers)
  INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
  VALUES (list_mkt_todo, 'Launch Social Media Ads', 'Create ad variants for Facebook and Instagram. Target Q3 demographics.', 'image', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', 1, NOW() + INTERVAL '5 days', false) 
  RETURNING id INTO card_social;

  INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
  VALUES (list_mkt_doing, 'Draft Newsletter', 'Write copy for the upcoming feature release newsletter.', 'color', '#00c2e0', 1, NOW() + INTERVAL '2 days', false) 
  RETURNING id INTO card_news;

  INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
  VALUES (list_rdm_ideas, 'Feature Brainstorming', 'Gather feedback from user interviews to brainstorm new features.', 'gradient', 'linear-gradient(to right, #11998e, #38ef7d)', 1, NOW() + INTERVAL '14 days', false) 
  RETURNING id INTO card_brainstorm;

  INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
  VALUES (list_evt_planning, 'Book Venue', 'Find a cool venue that can host 50 people with catering options.', null, null, 1, NOW() - INTERVAL '1 day', true) 
  RETURNING id INTO card_venue;

  INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
  VALUES (list_evt_planning, 'Order Catering', 'Contact local restaurants for quotes.', 'color', '#ff9f1a', 2, NOW() + INTERVAL '3 days', false) 
  RETURNING id INTO card_catering;

  -- D. Labels (using existing label IDs generated in schema: 1:bug, 2:feature, 3:urgent, 4:frontend, 5:backend, 6:design)
  -- Or just matching by IDs if they are 1-6. We can safely assume 1-6 exist.
  INSERT INTO card_labels (card_id, label_id) VALUES 
  (card_social, 3), (card_social, 6),
  (card_news, 4), 
  (card_brainstorm, 2), (card_brainstorm, 6),
  (card_venue, 3);

  -- E. Members (assigning random members)
  INSERT INTO card_members (card_id, member_id) VALUES 
  (card_social, 1), (card_social, 2),
  (card_news, 1),
  (card_brainstorm, 3), (card_brainstorm, 4),
  (card_venue, 5),
  (card_catering, 1), (card_catering, 5);

  -- F. Checklists
  INSERT INTO checklist_items (card_id, text, is_complete, position) VALUES 
  (card_social, 'Design ad creatives', true, 1),
  (card_social, 'Write ad copy', false, 2),
  (card_social, 'Setup Audience in Meta Ads Manager', false, 3),
  
  (card_news, 'Draft subject lines', true, 1),
  (card_news, 'Review by editor', false, 2),
  
  (card_venue, 'Contact Hall A', true, 1),
  (card_venue, 'Contact Hall B', true, 2),
  (card_venue, 'Pay Deposit', true, 3);

  -- G. Attachments
  INSERT INTO attachments (card_id, url, name) VALUES 
  (card_social, 'https://unsplash.com/photos/1234', 'Ad_Reference.jpg'),
  (card_brainstorm, 'https://docs.google.com/document/d/sample', 'Brainstorming_Doc.pdf');

  -- H. Comments
  INSERT INTO comments (card_id, author_id, text) VALUES 
  (card_social, 2, 'I can take the design part!'),
  (card_news, 1, 'Make sure we keep it under 300 words.'),
  (card_venue, 5, 'Deposit has been paid. We are good to go!');

  -- I. Activity Logs
  INSERT INTO activity_logs (card_id, action_type, performed_by, details) VALUES
  (card_social, 'CREATE_CARD', 1, '{"title":"Launch Social Media Ads"}'),
  (card_social, 'ADD_MEMBER', 1, '{"member":"Priya Verma"}'),
  (card_social, 'ADD_LABEL', 1, '{"label":"urgent"}'),
  (card_venue, 'COMPLETE_CHECKLIST_ITEM', 5, '{"item":"Pay Deposit"}'),
  (card_venue, 'MARK_CARD_COMPLETE', 5, '{"title":"Book Venue"}');
  
END $$;
