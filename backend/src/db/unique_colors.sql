WITH numbered_lists AS (
    SELECT id, board_id, row_number() over(partition by board_id order by id) as rn
    FROM lists
)
UPDATE lists
SET color = (ARRAY['#eb5a46', '#0079bf', '#61bd4f', '#ff9f1a', '#8e44ad', 
                   '#27ae60', '#2980b9', '#f39c12', '#d35400', '#c0392b',
                   '#16a085', '#8e44ad', '#34495e', '#7f8c8d', '#f1c40f'])[1 + ((numbered_lists.rn - 1) % 15)]
FROM numbered_lists
WHERE lists.id = numbered_lists.id;

WITH numbered_cards AS (
    SELECT id, list_id, row_number() over(partition by list_id order by id) as rn
    FROM cards
    WHERE cover_type = 'color'
)
UPDATE cards
SET cover_value = (ARRAY['#00c2e0', '#ff9f1a', '#eb5a46', '#8e44ad', '#61bd4f',
                         '#f53b57', '#3c40c6', '#0fb9b1', '#fa8231', '#1e272e',
                         '#ffd32a', '#05c46b', '#575fcf', '#ef5777', '#4bcffa'])[1 + ((numbered_cards.rn - 1) % 15)]
FROM numbered_cards
WHERE cards.id = numbered_cards.id;
