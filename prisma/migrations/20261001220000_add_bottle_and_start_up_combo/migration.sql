-- Runs once. Adds 100ml bottles (R10), 125g face cream, and the Start Up Combo (R600).

-- 100ml bottles, sold at R10 each.
INSERT INTO "FinishedProduct" ("id", "name", "unitSize", "sellPrice", "updatedAt")
SELECT gen_random_uuid()::text, 'Bottle', '100ml', 10, now()
WHERE NOT EXISTS (
  SELECT 1 FROM "FinishedProduct"
  WHERE NOT "isCombo" AND lower(btrim("name")) = 'bottle' AND lower(replace("unitSize", ' ', '')) = '100ml'
);

-- The Tertiary combos' "100ml bottles" line now takes bottles from stock instead of only listing them.
UPDATE "ComboItem"
SET "productId" = (
      SELECT "id" FROM "FinishedProduct"
      WHERE NOT "isCombo" AND lower(btrim("name")) = 'bottle' AND lower(replace("unitSize", ' ', '')) = '100ml'
      ORDER BY "createdAt" LIMIT 1),
    "description" = NULL
WHERE "productId" IS NULL
  AND "description" ~* '^\s*100\s*ml\s+bottles?\s*$';

-- 125g face cream, stocked for the Start Up Combo. No single price was given, so set one before selling these on their own.
INSERT INTO "FinishedProduct" ("id", "name", "unitSize", "sellPrice", "updatedAt")
SELECT gen_random_uuid()::text, 'Face Cream', '125g', 0, now()
WHERE NOT EXISTS (
  SELECT 1 FROM "FinishedProduct"
  WHERE NOT "isCombo" AND lower(btrim("name")) = 'face cream' AND lower(replace("unitSize", ' ', '')) = '125g'
);

-- Start Up Combo, R600.
INSERT INTO "FinishedProduct" ("id", "name", "sellPrice", "isCombo", "updatedAt")
SELECT gen_random_uuid()::text, 'Start Up Combo', 600, true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM "FinishedProduct" WHERE "isCombo" AND lower(btrim("name")) = 'start up combo'
);

-- Its contents. Soaps and 125g face cream come out of stock; the mixed oils are listed only.
-- If a product can't be found, its line is kept as a listed item rather than dropped.
INSERT INTO "ComboItem" ("id", "comboId", "productId", "description", "quantity", "position")
SELECT gen_random_uuid()::text, combo."id", product."id",
       CASE WHEN product."id" IS NULL THEN line.fallback END,
       line.quantity, line.position
FROM (
  SELECT "id" FROM "FinishedProduct"
  WHERE "isCombo" AND lower(btrim("name")) = 'start up combo'
  ORDER BY "createdAt" LIMIT 1
) AS combo
CROSS JOIN (VALUES
  ('soap',       'single', 'Soaps (single)',    6, 0),
  (NULL,         NULL,     'Oils (mixed)',      6, 1),
  ('face cream', '125g',   'Face cream (125g)', 6, 2)
) AS line(product_name, unit_size, fallback, quantity, position)
LEFT JOIN LATERAL (
  SELECT p."id" FROM "FinishedProduct" p
  WHERE NOT p."isCombo"
    AND lower(btrim(p."name")) = line.product_name
    AND lower(replace(p."unitSize", ' ', '')) = line.unit_size
  ORDER BY p."createdAt" LIMIT 1
) AS product ON true
WHERE NOT EXISTS (SELECT 1 FROM "ComboItem" existing WHERE existing."comboId" = combo."id");
