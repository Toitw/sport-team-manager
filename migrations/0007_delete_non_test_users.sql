
-- Delete all related data for non-test users
DELETE FROM match_commentary WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM match_cards WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM match_scorers WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM match_substitutions WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM match_lineups WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM match_reserves WHERE match_id IN (SELECT id FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com')));
DELETE FROM events WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com'));
DELETE FROM news WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com'));
DELETE FROM players WHERE team_id IN (SELECT id FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com'));
DELETE FROM teams WHERE created_by_id IN (SELECT id FROM users WHERE email != 'test@example.com');
DELETE FROM users WHERE email != 'test@example.com';
