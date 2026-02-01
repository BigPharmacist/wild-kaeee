-- Umo Editor Dokumente Tabelle
-- Migration für Word-ähnliche Dokumente in Kaeee

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  title TEXT NOT NULL DEFAULT 'Unbenanntes Dokument',
  content JSONB,  -- Umo Editor speichert als JSON

  document_type TEXT DEFAULT 'word',  -- 'word', 'brief', 'rechnung', etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_documents_pharmacy ON documents(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);

-- RLS aktivieren
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Nur eigene Apotheke
CREATE POLICY "Users can CRUD own pharmacy documents"
  ON documents
  FOR ALL
  USING (pharmacy_id IN (
    SELECT pharmacy_id FROM staff WHERE auth_user_id = auth.uid()
  ));
