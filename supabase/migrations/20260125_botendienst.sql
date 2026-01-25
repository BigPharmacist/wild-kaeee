-- Botendienst Migration
-- Delivery Service Feature for Pharmacy App

-- ============================================
-- 1. DELIVERY CUSTOMERS (Kundenstamm)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,

  -- Kundendaten
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  phone TEXT,

  -- Geokodierung (einmalig, wird wiederverwendet)
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Persistente Hinweise (bleiben über alle Lieferungen)
  delivery_notes TEXT,  -- "Hinter Blumenkasten ablegen erlaubt"
  access_info TEXT,     -- "Klingel defekt, bitte klopfen"

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Suche nach Apotheke und Name
CREATE INDEX IF NOT EXISTS idx_delivery_customers_pharmacy ON delivery_customers(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_delivery_customers_name ON delivery_customers(name);

-- ============================================
-- 2. DELIVERY TOURS (Touren)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  driver_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  source_pdf_url TEXT,
  ocr_raw_text TEXT,
  optimized_at TIMESTAMPTZ,
  total_distance_km NUMERIC(10,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

-- Index für Tour-Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_tours_pharmacy ON delivery_tours(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tours_date ON delivery_tours(date);
CREATE INDEX IF NOT EXISTS idx_delivery_tours_status ON delivery_tours(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tours_driver ON delivery_tours(driver_staff_id);

-- ============================================
-- 3. DELIVERY STOPS (Stops)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES delivery_tours(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES delivery_customers(id),  -- Verknüpfung zum Kunden!
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Adresse (Kopie vom Kunden, falls Kunde NULL)
  customer_name TEXT,
  street TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rescheduled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Lieferung
  package_count INTEGER DEFAULT 1,  -- Anzahl Packungen
  cash_amount NUMERIC(10,2) DEFAULT 0,  -- "Aktuelle Kredite" = zu kassieren
  cash_collected BOOLEAN DEFAULT FALSE,

  -- Dokumentation pro Lieferung
  stop_notes TEXT,  -- Notiz für diesen Stop (einmalig)

  -- Abschluss
  completed_at TIMESTAMPTZ,
  completed_latitude NUMERIC(10,7),
  completed_longitude NUMERIC(10,7),

  -- Rückstellung
  rescheduled_to DATE,
  rescheduled_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES staff(id)
);

-- Indices für Stop-Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_stops_tour ON delivery_stops(tour_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_customer ON delivery_stops(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_status ON delivery_stops(status);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_sort ON delivery_stops(tour_id, sort_order);

-- ============================================
-- 4. DELIVERY STOP PHOTOS (Fotos)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_stop_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID REFERENCES delivery_stops(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,  -- URL in Supabase Storage
  caption TEXT,             -- "Hinter Blumenkasten abgelegt"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

-- Index für Foto-Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_stop_photos_stop ON delivery_stop_photos(stop_id);

-- ============================================
-- 5. DELIVERY SIGNATURES (Unterschriften)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID REFERENCES delivery_stops(id) ON DELETE CASCADE NOT NULL,
  signature_url TEXT NOT NULL,  -- PNG in Supabase Storage
  signer_name TEXT,             -- Name des Empfängers
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7)
);

-- Index für Unterschriften-Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_signatures_stop ON delivery_signatures(stop_id);

-- ============================================
-- 6. DELIVERY DRIVER LOCATIONS (GPS-Positionen)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES delivery_tours(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  accuracy NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Positions-Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_driver_locations_tour ON delivery_driver_locations(tour_id);
CREATE INDEX IF NOT EXISTS idx_delivery_driver_locations_staff ON delivery_driver_locations(staff_id);
CREATE INDEX IF NOT EXISTS idx_delivery_driver_locations_created ON delivery_driver_locations(created_at DESC);

-- ============================================
-- 7. VIEW: Letzte Fahrer-Positionen
-- ============================================
CREATE OR REPLACE VIEW delivery_driver_latest_locations AS
SELECT DISTINCT ON (staff_id)
  dl.id,
  dl.tour_id,
  dl.staff_id,
  dl.latitude,
  dl.longitude,
  dl.accuracy,
  dl.created_at,
  s.first_name,
  s.last_name,
  t.name AS tour_name,
  t.status AS tour_status
FROM delivery_driver_locations dl
JOIN staff s ON s.id = dl.staff_id
LEFT JOIN delivery_tours t ON t.id = dl.tour_id
ORDER BY staff_id, created_at DESC;

-- ============================================
-- 8. STORAGE BUCKETS
-- ============================================
-- Bucket für Lieferfotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket für Unterschriften
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-signatures', 'delivery-signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket für Tour-PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-pdfs', 'delivery-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE delivery_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_stop_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_driver_locations ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's pharmacy_ids
CREATE OR REPLACE FUNCTION get_user_pharmacy_ids()
RETURNS SETOF UUID AS $$
  SELECT pharmacy_id FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- DELIVERY_CUSTOMERS Policies
CREATE POLICY "Users can view customers of their pharmacy"
  ON delivery_customers FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can insert customers for their pharmacy"
  ON delivery_customers FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can update customers of their pharmacy"
  ON delivery_customers FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can delete customers of their pharmacy"
  ON delivery_customers FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- DELIVERY_TOURS Policies
CREATE POLICY "Users can view tours of their pharmacy"
  ON delivery_tours FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can insert tours for their pharmacy"
  ON delivery_tours FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can update tours of their pharmacy"
  ON delivery_tours FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY "Users can delete tours of their pharmacy"
  ON delivery_tours FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- DELIVERY_STOPS Policies
CREATE POLICY "Users can view stops of their tours"
  ON delivery_stops FOR SELECT
  USING (tour_id IN (
    SELECT id FROM delivery_tours WHERE pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can insert stops for their tours"
  ON delivery_stops FOR INSERT
  WITH CHECK (tour_id IN (
    SELECT id FROM delivery_tours WHERE pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can update stops of their tours"
  ON delivery_stops FOR UPDATE
  USING (tour_id IN (
    SELECT id FROM delivery_tours WHERE pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can delete stops of their tours"
  ON delivery_stops FOR DELETE
  USING (tour_id IN (
    SELECT id FROM delivery_tours WHERE pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

-- DELIVERY_STOP_PHOTOS Policies
CREATE POLICY "Users can view photos of their stops"
  ON delivery_stop_photos FOR SELECT
  USING (stop_id IN (
    SELECT ds.id FROM delivery_stops ds
    JOIN delivery_tours dt ON dt.id = ds.tour_id
    WHERE dt.pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can insert photos for their stops"
  ON delivery_stop_photos FOR INSERT
  WITH CHECK (stop_id IN (
    SELECT ds.id FROM delivery_stops ds
    JOIN delivery_tours dt ON dt.id = ds.tour_id
    WHERE dt.pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can delete photos of their stops"
  ON delivery_stop_photos FOR DELETE
  USING (stop_id IN (
    SELECT ds.id FROM delivery_stops ds
    JOIN delivery_tours dt ON dt.id = ds.tour_id
    WHERE dt.pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

-- DELIVERY_SIGNATURES Policies
CREATE POLICY "Users can view signatures of their stops"
  ON delivery_signatures FOR SELECT
  USING (stop_id IN (
    SELECT ds.id FROM delivery_stops ds
    JOIN delivery_tours dt ON dt.id = ds.tour_id
    WHERE dt.pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

CREATE POLICY "Users can insert signatures for their stops"
  ON delivery_signatures FOR INSERT
  WITH CHECK (stop_id IN (
    SELECT ds.id FROM delivery_stops ds
    JOIN delivery_tours dt ON dt.id = ds.tour_id
    WHERE dt.pharmacy_id IN (SELECT get_user_pharmacy_ids())
  ));

-- DELIVERY_DRIVER_LOCATIONS Policies
-- Admins can see all locations of their pharmacy's drivers
CREATE POLICY "Admins can view driver locations of their pharmacy"
  ON delivery_driver_locations FOR SELECT
  USING (
    staff_id IN (
      SELECT s.id FROM staff s
      WHERE s.pharmacy_id IN (SELECT get_user_pharmacy_ids())
    )
  );

-- Drivers can only see their own locations
CREATE POLICY "Drivers can view their own locations"
  ON delivery_driver_locations FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
  );

-- Users can insert their own locations
CREATE POLICY "Users can insert their own locations"
  ON delivery_driver_locations FOR INSERT
  WITH CHECK (
    staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- 10. STORAGE POLICIES
-- ============================================

-- Delivery Photos - Anyone authenticated can upload, users can view their pharmacy's
CREATE POLICY "Authenticated users can upload delivery photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'delivery-photos');

CREATE POLICY "Users can view delivery photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'delivery-photos');

CREATE POLICY "Users can delete their delivery photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'delivery-photos');

-- Delivery Signatures - Same pattern
CREATE POLICY "Authenticated users can upload delivery signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'delivery-signatures');

CREATE POLICY "Users can view delivery signatures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'delivery-signatures');

-- Delivery PDFs - Same pattern
CREATE POLICY "Authenticated users can upload delivery pdfs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'delivery-pdfs');

CREATE POLICY "Users can view delivery pdfs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'delivery-pdfs');

-- ============================================
-- 11. TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_delivery_customers_updated_at ON delivery_customers;
CREATE TRIGGER update_delivery_customers_updated_at
  BEFORE UPDATE ON delivery_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_tours;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_stops;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_driver_locations;
