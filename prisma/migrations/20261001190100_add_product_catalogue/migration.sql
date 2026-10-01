-- Product catalogue and combos supplied by Thabile on 2026-10-01.
-- Runs once. Stock starts at 0 and is added through Stock orders. SKUs that already exist are left alone.

INSERT INTO "FinishedProduct" ("id", "sku", "name", "sellPrice", "updatedAt") VALUES
  (gen_random_uuid()::text, 'FACE-CREAM-2KG',     '2kg Face Cream',                 450,  now()),
  (gen_random_uuid()::text, 'THIGH-CREAM-2KG',    '2kg Dark Inner Thighs Cream',    450,  now()),
  (gen_random_uuid()::text, 'SCRUB-CHARCOAL-2KG', '2kg Charcoal Scrub',             450,  now()),
  (gen_random_uuid()::text, 'SCRUB-TURMERIC-2KG', '2kg Turmeric Scrub',             450,  now()),
  (gen_random_uuid()::text, 'OIL-ROOIBOS-1L',     '1L Rooibos Oil',                 450,  now()),
  (gen_random_uuid()::text, 'OIL-ALOE-1L',        '1L Aloe Vera Oil',               450,  now()),
  (gen_random_uuid()::text, 'OIL-CARROT-1L',      '1L Carrot Oil',                  450,  now()),
  (gen_random_uuid()::text, 'SERUM-GLOW-1L',      '1L Glow Serum',                  450,  now()),
  (gen_random_uuid()::text, 'SOAP-6PK',           'Soaps (pack of 6)',              250,  now()),
  (gen_random_uuid()::text, 'SOAP-BLACK-6PK',     'African Black Soap (pack of 6)', 250,  now()),
  (gen_random_uuid()::text, 'OIL-ALOE-5L',        '5L Aloe Vera Oil',               900,  now()),
  (gen_random_uuid()::text, 'OIL-CARROT-5L',      '5L Carrot Oil',                  900,  now()),
  (gen_random_uuid()::text, 'SERUM-GLOW-5L',      '5L Glow Serum',                  900,  now()),
  (gen_random_uuid()::text, 'FACE-CREAM-5KG',     '5kg Face Cream',                 1000, now()),
  (gen_random_uuid()::text, 'SCRUB-CHARCOAL-5KG', '5kg Charcoal Scrub',             1000, now()),
  (gen_random_uuid()::text, 'SCRUB-TURMERIC-5KG', '5kg Turmeric Scrub',             1000, now()),
  (gen_random_uuid()::text, 'THIGH-CREAM-5KG',    '5kg Dark Inner Thighs Cream',    1000, now()),
  -- Stocked for the Tertiary combos; no single-soap price was given, so set one before selling these on their own.
  (gen_random_uuid()::text, 'SOAP-SINGLE',        'Soap (single)',                  0,    now())
ON CONFLICT ("sku") DO NOTHING;

INSERT INTO "FinishedProduct" ("id", "sku", "name", "sellPrice", "isCombo", "updatedAt") VALUES
  (gen_random_uuid()::text, 'COMBO-PRIMARY',            'Primary Combo',              1100, true, now()),
  (gen_random_uuid()::text, 'COMBO-SECONDARY-CHARCOAL', 'Secondary Combo (Charcoal)', 1600, true, now()),
  (gen_random_uuid()::text, 'COMBO-SECONDARY-TURMERIC', 'Secondary Combo (Turmeric)', 1600, true, now()),
  (gen_random_uuid()::text, 'COMBO-TERTIARY-CHARCOAL',  'Tertiary Combo (Charcoal)',  2100, true, now()),
  (gen_random_uuid()::text, 'COMBO-TERTIARY-TURMERIC',  'Tertiary Combo (Turmeric)',  2100, true, now())
ON CONFLICT ("sku") DO NOTHING;

-- Product lines are taken from stock when a combo sells; text lines (packaging) are listed only.
INSERT INTO "ComboItem" ("id", "comboId", "productId", "description", "quantity", "position")
SELECT gen_random_uuid()::text, combo."id", product."id", line.description, line.quantity, line.position
FROM (VALUES
  ('COMBO-PRIMARY',            'FACE-CREAM-2KG',     NULL::text,              1,  0),
  ('COMBO-PRIMARY',            'SERUM-GLOW-1L',      NULL,                    1,  1),
  ('COMBO-PRIMARY',            NULL,                 '30ml dropper bottles',  20, 2),
  ('COMBO-PRIMARY',            NULL,                 'Face cream containers', 15, 3),

  ('COMBO-SECONDARY-CHARCOAL', 'FACE-CREAM-2KG',     NULL,                    1,  0),
  ('COMBO-SECONDARY-CHARCOAL', 'SCRUB-CHARCOAL-2KG', NULL,                    1,  1),
  ('COMBO-SECONDARY-CHARCOAL', 'SERUM-GLOW-1L',      NULL,                    1,  2),
  ('COMBO-SECONDARY-CHARCOAL', NULL,                 '30ml dropper bottles',  20, 3),
  ('COMBO-SECONDARY-CHARCOAL', NULL,                 '125g containers',       30, 4),

  ('COMBO-SECONDARY-TURMERIC', 'FACE-CREAM-2KG',     NULL,                    1,  0),
  ('COMBO-SECONDARY-TURMERIC', 'SCRUB-TURMERIC-2KG', NULL,                    1,  1),
  ('COMBO-SECONDARY-TURMERIC', 'SERUM-GLOW-1L',      NULL,                    1,  2),
  ('COMBO-SECONDARY-TURMERIC', NULL,                 '30ml dropper bottles',  20, 3),
  ('COMBO-SECONDARY-TURMERIC', NULL,                 '125g containers',       30, 4),

  ('COMBO-TERTIARY-CHARCOAL',  'OIL-CARROT-1L',      NULL,                    1,  0),
  ('COMBO-TERTIARY-CHARCOAL',  'OIL-ROOIBOS-1L',     NULL,                    1,  1),
  ('COMBO-TERTIARY-CHARCOAL',  'SCRUB-CHARCOAL-2KG', NULL,                    1,  2),
  ('COMBO-TERTIARY-CHARCOAL',  'THIGH-CREAM-2KG',    NULL,                    1,  3),
  ('COMBO-TERTIARY-CHARCOAL',  'SOAP-SINGLE',        NULL,                    10, 4),
  ('COMBO-TERTIARY-CHARCOAL',  NULL,                 '100ml bottles',         20, 5),
  ('COMBO-TERTIARY-CHARCOAL',  NULL,                 '250g containers',       20, 6),

  ('COMBO-TERTIARY-TURMERIC',  'OIL-CARROT-1L',      NULL,                    1,  0),
  ('COMBO-TERTIARY-TURMERIC',  'OIL-ROOIBOS-1L',     NULL,                    1,  1),
  ('COMBO-TERTIARY-TURMERIC',  'SCRUB-TURMERIC-2KG', NULL,                    1,  2),
  ('COMBO-TERTIARY-TURMERIC',  'THIGH-CREAM-2KG',    NULL,                    1,  3),
  ('COMBO-TERTIARY-TURMERIC',  'SOAP-SINGLE',        NULL,                    10, 4),
  ('COMBO-TERTIARY-TURMERIC',  NULL,                 '100ml bottles',         20, 5),
  ('COMBO-TERTIARY-TURMERIC',  NULL,                 '250g containers',       20, 6)
) AS line(combo_sku, product_sku, description, quantity, position)
JOIN "FinishedProduct" combo ON combo."sku" = line.combo_sku AND combo."isCombo"
LEFT JOIN "FinishedProduct" product ON product."sku" = line.product_sku
WHERE NOT EXISTS (SELECT 1 FROM "ComboItem" existing WHERE existing."comboId" = combo."id");
