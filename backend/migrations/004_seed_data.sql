INSERT INTO users (id, google_id, email, name, avatar_url, access_token, refresh_token)
VALUES
  (
    'a1b2c3d4-0001-4000-a000-000000000001',
    'google_seed_user_001',
    'priya.sharma@example.com',
    'Priya Sharma',
    '',
    '',
    ''
  ),
  (
    'a1b2c3d4-0002-4000-a000-000000000002',
    'google_seed_user_002',
    'alex.johnson@example.com',
    'Alex Johnson',
    '',
    '',
    ''
  ),
  (
    'a1b2c3d4-0003-4000-a000-000000000003',
    'google_seed_user_003',
    'maya.chen@example.com',
    'Maya Chen',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;


INSERT INTO tasks (id, title, description, status, priority, due_date, created_by, assigned_to, created_at)
VALUES
  -- ── TO DO ────────────────────────────────────────────────────────
  (
    'b0000000-0000-4000-b000-000000000001',
    'Design new client intake form',
    'Create a modern intake form for new salon clients. Should capture contact info, hair type, preferred services, and allergy information.',
    'todo', 'high',
    CURRENT_DATE + INTERVAL '3 days',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    'a1b2c3d4-0002-4000-a000-000000000002',  -- assigned to Alex
    NOW() - INTERVAL '2 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000002',
    'Order hair color supplies for June',
    'Restock balayage kits, toner shades (ash blonde, platinum), and developer volumes 20 & 30.',
    'todo', 'medium',
    CURRENT_DATE + INTERVAL '5 days',
    'a1b2c3d4-0002-4000-a000-000000000002',  -- created by Alex
    'a1b2c3d4-0003-4000-a000-000000000003',  -- assigned to Maya
    NOW() - INTERVAL '1 day'
  ),
  (
    'b0000000-0000-4000-b000-000000000003',
    'Fix booking calendar double-slot bug',
    'Clients are able to book the same time slot twice when two sessions overlap at the 15-minute boundary. Investigate race condition.',
    'todo', 'high',
    CURRENT_DATE + INTERVAL '2 days',
    'a1b2c3d4-0003-4000-a000-000000000003',  -- created by Maya
    'a1b2c3d4-0001-4000-a000-000000000001',  -- assigned to Priya
    NOW() - INTERVAL '3 hours'
  ),
  (
    'b0000000-0000-4000-b000-000000000004',
    'Write blog post: Summer hair care tips',
    'Draft a 600-word blog post about protecting hair from sun, chlorine, and humidity. Include product recommendations.',
    'todo', 'low',
    CURRENT_DATE + INTERVAL '14 days',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    NULL,                                      -- unassigned
    NOW() - INTERVAL '6 hours'
  ),
  (
    'b0000000-0000-4000-b000-000000000005',
    'Update staff schedule for holiday weekend',
    'Coordinate with the team for the upcoming long weekend. Ensure adequate coverage for Saturday walk-ins.',
    'todo', 'medium',
    CURRENT_DATE + INTERVAL '7 days',
    'a1b2c3d4-0002-4000-a000-000000000002',  -- created by Alex
    'a1b2c3d4-0001-4000-a000-000000000001',  -- assigned to Priya
    NOW() - INTERVAL '4 hours'
  ),

  -- ── IN PROGRESS ─────────────────────────────────────────────────
  (
    'b0000000-0000-4000-b000-000000000006',
    'Redesign the appointment confirmation email',
    'The current email template looks dated. Use the new brand colors and add a "Add to Calendar" button.',
    'in_progress', 'medium',
    CURRENT_DATE + INTERVAL '4 days',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    'a1b2c3d4-0003-4000-a000-000000000003',  -- assigned to Maya
    NOW() - INTERVAL '2 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000007',
    'Implement loyalty points system',
    'Build a simple points tracker: 1 point per dollar spent, 100 points = $10 discount. Display balance on the client profile page.',
    'in_progress', 'high',
    CURRENT_DATE + INTERVAL '10 days',
    'a1b2c3d4-0003-4000-a000-000000000003',  -- created by Maya
    'a1b2c3d4-0002-4000-a000-000000000002',  -- assigned to Alex
    NOW() - INTERVAL '4 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000008',
    'Set up Instagram auto-posting for portfolio',
    'Connect the salon portfolio page to Instagram so new photos are cross-posted automatically.',
    'in_progress', 'low',
    CURRENT_DATE + INTERVAL '8 days',
    'a1b2c3d4-0002-4000-a000-000000000002',  -- created by Alex
    'a1b2c3d4-0002-4000-a000-000000000002',  -- assigned to Alex (self-assigned)
    NOW() - INTERVAL '3 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000009',
    'Migrate client records to new CRM',
    'Export data from the spreadsheet, clean duplicates, and import into the new CRM. Estimated ~450 records.',
    'in_progress', 'high',
    CURRENT_DATE + INTERVAL '1 day',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    'a1b2c3d4-0001-4000-a000-000000000001',  -- assigned to Priya (self-assigned)
    NOW() - INTERVAL '5 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000010',
    'Create promotional flyer for grand opening event',
    'Design a print-ready A5 flyer. Include the date, featured stylists, and 20% first-visit discount offer.',
    'in_progress', 'medium',
    CURRENT_DATE + INTERVAL '6 days',
    'a1b2c3d4-0003-4000-a000-000000000003',  -- created by Maya
    'a1b2c3d4-0001-4000-a000-000000000001',  -- assigned to Priya
    NOW() - INTERVAL '1 day'
  ),

  -- ── COMPLETED ───────────────────────────────────────────────────
  (
    'b0000000-0000-4000-b000-000000000011',
    'Set up Google Business Profile',
    'Created and verified the salon Google Business listing with hours, photos, and service descriptions.',
    'completed', 'high',
    CURRENT_DATE - INTERVAL '3 days',
    'a1b2c3d4-0002-4000-a000-000000000002',  -- created by Alex
    'a1b2c3d4-0003-4000-a000-000000000003',  -- assigned to Maya
    NOW() - INTERVAL '10 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000012',
    'Install and configure POS terminal',
    'New Square POS terminal installed at the front desk. Linked to business bank account and tested with a $1 transaction.',
    'completed', 'high',
    CURRENT_DATE - INTERVAL '5 days',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    'a1b2c3d4-0002-4000-a000-000000000002',  -- assigned to Alex
    NOW() - INTERVAL '8 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000013',
    'Train junior stylists on balayage technique',
    'Conducted a 2-hour hands-on training session. All three juniors successfully completed a practice head.',
    'completed', 'medium',
    CURRENT_DATE - INTERVAL '1 day',
    'a1b2c3d4-0003-4000-a000-000000000003',  -- created by Maya
    'a1b2c3d4-0003-4000-a000-000000000003',  -- assigned to Maya (self-assigned)
    NOW() - INTERVAL '6 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000014',
    'Fix water pressure in wash station 3',
    'Called the plumber, replaced the aerator and mixing valve. Water pressure restored to normal.',
    'completed', 'low',
    CURRENT_DATE - INTERVAL '7 days',
    'a1b2c3d4-0002-4000-a000-000000000002',  -- created by Alex
    'a1b2c3d4-0001-4000-a000-000000000001',  -- assigned to Priya
    NOW() - INTERVAL '12 days'
  ),
  (
    'b0000000-0000-4000-b000-000000000015',
    'Update website pricing page',
    'Refreshed the pricing page with new service tiers, added keratin treatment pricing, and fixed broken links.',
    'completed', 'medium',
    CURRENT_DATE - INTERVAL '2 days',
    'a1b2c3d4-0001-4000-a000-000000000001',  -- created by Priya
    'a1b2c3d4-0003-4000-a000-000000000003',  -- assigned to Maya
    NOW() - INTERVAL '7 days'
  )
ON CONFLICT (id) DO NOTHING;