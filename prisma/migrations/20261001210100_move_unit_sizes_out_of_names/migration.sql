-- Move unit sizes out of product names into the Unit size field,
-- e.g. "2kg Face Cream" -> name "Face Cream", unit size "2kg". Never overwrites a different unit size.

-- Size at the start: "2kg Face Cream", "1L Rooibos Oil", "5Kg Charcoal Scrub"
UPDATE "FinishedProduct"
SET "unitSize"  = (regexp_match("name", '^(\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l))\s+', 'i'))[1],
    "name"      = regexp_replace("name", '^\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\s+', '', 'i'),
    "updatedAt" = now()
WHERE "name" ~* '^\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\s+\S'
  AND coalesce(btrim("unitSize"), '') = '';

-- Size in brackets at the end: "Whipped Shea Body Butter (200ml)"
UPDATE "FinishedProduct"
SET "unitSize"  = coalesce(nullif(btrim("unitSize"), ''),
                           (regexp_match("name", '\((\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l))\)\s*$', 'i'))[1]),
    "name"      = regexp_replace("name", '\s*\(\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\)\s*$', '', 'i'),
    "updatedAt" = now()
WHERE "name" ~* '\(\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\)\s*$'
  AND (coalesce(btrim("unitSize"), '') = ''
       OR lower(replace("unitSize", ' ', '')) =
          lower(replace((regexp_match("name", '\((\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l))\)\s*$', 'i'))[1], ' ', '')));

-- Soap packs from the catalogue
UPDATE "FinishedProduct" SET "name" = 'Soap', "unitSize" = 'Pack of 6', "updatedAt" = now()
WHERE "name" = 'Soaps (pack of 6)' AND coalesce(btrim("unitSize"), '') = '';

UPDATE "FinishedProduct" SET "name" = 'African Black Soap', "unitSize" = 'Pack of 6', "updatedAt" = now()
WHERE "name" = 'African Black Soap (pack of 6)' AND coalesce(btrim("unitSize"), '') = '';

UPDATE "FinishedProduct" SET "name" = 'Soap', "unitSize" = 'Single', "updatedAt" = now()
WHERE "name" = 'Soap (single)' AND coalesce(btrim("unitSize"), '') = '';
