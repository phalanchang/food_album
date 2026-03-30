-- 食事記録にAI栄養評価カラムを追加
ALTER TABLE meals ADD COLUMN nutrition_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE meals ADD COLUMN nutrition_result JSONB;
ALTER TABLE meals ADD COLUMN evaluated_at TIMESTAMPTZ;
