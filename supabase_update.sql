-- ==========================================
-- SCRIPT DE MISE À JOUR : FOURNISSEURS & TODOS
-- ==========================================

-- 1. Table des fournisseurs
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT, -- ex: Câbles, Outillage, Connecteurs
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Table de la Todo List
CREATE TABLE IF NOT EXISTS daily_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task TEXT NOT NULL,
    type TEXT DEFAULT 'task', -- 'task' ou 'material'
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Activation du Temps Réel (Realtime)
-- Note : Si ces tables existent déjà dans la publication, ignorer les erreurs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'suppliers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'daily_todos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE daily_todos;
    END IF;
END $$;

-- 4. Sécurité (RLS)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_todos ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (Public) pour simplifier le chantier
DROP POLICY IF EXISTS "Public Supplier Access" ON suppliers;
CREATE POLICY "Public Supplier Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Todo Access" ON daily_todos;
CREATE POLICY "Public Todo Access" ON daily_todos FOR ALL USING (true) WITH CHECK (true);

-- 5. Données d'exemple (Optionnel)
INSERT INTO suppliers (name, category, contact_name, phone) 
VALUES ('Rexel', 'Câbles & Élec', 'Jean Dupont', '01 23 45 67 89')
ON CONFLICT DO NOTHING;
