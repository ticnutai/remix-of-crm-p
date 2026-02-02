-- בדיקת כפילויות בטבלת client_stage_tasks
-- שלב 1: מציאת כפילויות (אותו client_id, stage_id, title)

-- הצגת כפילויות
SELECT 
  client_id,
  stage_id,
  title,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as ids
FROM client_stage_tasks
GROUP BY client_id, stage_id, title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- שלב 2: מחיקת כפילויות - שומר רק את הרשומה הישנה ביותר
-- DELETE שורות זמניות לפני הרצה אמיתית
/*
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, stage_id, title
      ORDER BY created_at ASC
    ) as rn
  FROM client_stage_tasks
)
DELETE FROM client_stage_tasks
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
*/

-- הסרת הערה מהקוד למעלה כדי להריץ את המחיקה
