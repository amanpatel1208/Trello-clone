DO $$
DECLARE
    m RECORD;
    b_id INT;
    l_id INT;
    c_id INT;
    img_urls TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1600',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600',
        'https://images.unsplash.com/photo-1506744626753-1fa28f6e5200?w=1600',
        'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=1600',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1600',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600',
        'https://images.unsplash.com/photo-1481481620618-f647c5a1bc40?w=1600',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600',
        'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1600'
    ];
    board_titles TEXT[] := ARRAY['Q4 Objectives', 'Personal Dashboard', 'Design System', 'Freelance Projects', 'Backend Migration', 'Reading List', 'Content Calendar', 'Vacation Planning', 'Sprint 42', 'Finance Tracker'];
    list_titles TEXT[] := ARRAY['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
    card_titles TEXT[] := ARRAY['Research phase', 'Draft proposal', 'Review metrics', 'Approve designs', 'Publish content', 'Analyze data', 'Fix critical bug', 'Refactor code', 'Deploy to staging', 'Monitor logs'];
    img_idx INT := 1;
    b_idx INT := 1;
    c_idx INT := 1;
    l_count INT;
    c_count INT;
BEGIN
    -- 1. Update all existing solid color boards to beautiful images
    UPDATE boards SET bg_type = 'image', bg_value = img_urls[1 + (id % 10)] WHERE bg_type = 'color';

    -- 2. Ensure every member has 2 more boards
    FOR m IN SELECT id FROM members ORDER BY id LOOP
        
        -- Create 2 boards for this member
        FOR i IN 1..2 LOOP
            INSERT INTO boards (member_id, title, bg_type, bg_value) 
            VALUES (m.id, board_titles[b_idx], 'image', img_urls[img_idx])
            RETURNING id INTO b_id;
            
            -- Star the generated board for the member
            INSERT INTO starred_boards (member_id, board_id) VALUES (m.id, b_id) ON CONFLICT DO NOTHING;

            b_idx := b_idx + 1;
            IF b_idx > 10 THEN b_idx := 1; END IF;
            
            img_idx := img_idx + 1;
            IF img_idx > 10 THEN img_idx := 1; END IF;

            -- Create 3 lists per board
            FOR l_count IN 1..3 LOOP
                INSERT INTO lists (board_id, title, position, color)
                VALUES (b_id, list_titles[l_count], l_count, '#eb5a46')
                RETURNING id INTO l_id;

                -- Create 4 cards per list
                FOR c_count IN 1..4 LOOP
                    INSERT INTO cards (list_id, title, description, cover_type, cover_value, position, due_date, is_complete)
                    VALUES (
                        l_id, 
                        card_titles[c_idx] || ' for project', 
                        'This is a generated task card with multiple details. Need to make sure all prerequisites are met before starting this.', 
                        CASE WHEN c_count % 3 = 0 THEN 'image' ELSE NULL END, 
                        CASE WHEN c_count % 3 = 0 THEN img_urls[c_idx] ELSE NULL END, 
                        c_count, 
                        NOW() + (c_idx || ' days')::interval, 
                        CASE WHEN l_count = 3 THEN true ELSE false END
                    ) RETURNING id INTO c_id;
                    
                    c_idx := c_idx + 1;
                    IF c_idx > 10 THEN c_idx := 1; END IF;

                    -- Add a label (1 to 6)
                    INSERT INTO card_labels (card_id, label_id) VALUES (c_id, 1 + (c_id % 6)) ON CONFLICT DO NOTHING;
                    
                    -- Add a member (1 to 5)
                    INSERT INTO card_members (card_id, member_id) VALUES (c_id, 1 + (c_id % 5)) ON CONFLICT DO NOTHING;

                    -- Add a checklist item
                    INSERT INTO checklist_items (card_id, text, is_complete, position) VALUES 
                    (c_id, 'Initial review', true, 1),
                    (c_id, 'Final execution', false, 2);

                    -- Add an activity log
                    INSERT INTO activity_logs (card_id, action_type, performed_by, details) VALUES
                    (c_id, 'CREATE_CARD', m.id, '{"title":"Generated Task"}');
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
