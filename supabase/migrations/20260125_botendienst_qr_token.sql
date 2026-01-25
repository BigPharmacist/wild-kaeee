-- Migration: QR-Code Token für Touren
-- Ermöglicht anonymen Zugriff auf Touren via Token

-- 1. Neues Feld für access_token
ALTER TABLE delivery_tours
ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- 2. Index für schnelle Token-Suche
CREATE INDEX IF NOT EXISTS idx_delivery_tours_access_token
ON delivery_tours(access_token);

-- 3. RPC-Funktion für Token-basierten Zugriff (SECURITY DEFINER = läuft mit DB-Rechten)
CREATE OR REPLACE FUNCTION get_tour_by_token(tour_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tour', row_to_json(t.*),
    'stops', (
      SELECT json_agg(
        json_build_object(
          'id', s.id,
          'tour_id', s.tour_id,
          'customer_id', s.customer_id,
          'customer_name', s.customer_name,
          'street', s.street,
          'postal_code', s.postal_code,
          'city', s.city,
          'latitude', s.latitude,
          'longitude', s.longitude,
          'status', s.status,
          'priority', s.priority,
          'package_count', s.package_count,
          'cash_amount', s.cash_amount,
          'cash_collected', s.cash_collected,
          'cash_collected_amount', s.cash_collected_amount,
          'cash_notes', s.cash_notes,
          'stop_notes', s.stop_notes,
          'sort_order', s.sort_order,
          'completed_at', s.completed_at,
          'customer', (
            SELECT row_to_json(c.*)
            FROM delivery_customers c
            WHERE c.id = s.customer_id
          ),
          'photos', (
            SELECT json_agg(row_to_json(p.*))
            FROM delivery_stop_photos p
            WHERE p.stop_id = s.id
          ),
          'signature', (
            SELECT json_agg(row_to_json(sig.*))
            FROM delivery_signatures sig
            WHERE sig.stop_id = s.id
          )
        )
        ORDER BY s.sort_order
      )
      FROM delivery_stops s
      WHERE s.tour_id = t.id
    )
  ) INTO result
  FROM delivery_tours t
  WHERE t.access_token = tour_token
    AND t.status IN ('draft', 'active'); -- Nur aktive/draft Touren

  RETURN result;
END;
$$;

-- 4. RPC-Funktion zum Aktualisieren eines Stops per Token
CREATE OR REPLACE FUNCTION update_stop_by_token(
  tour_token UUID,
  stop_id UUID,
  new_status TEXT DEFAULT NULL,
  new_cash_collected BOOLEAN DEFAULT NULL,
  new_cash_collected_amount NUMERIC DEFAULT NULL,
  new_cash_notes TEXT DEFAULT NULL,
  new_stop_notes TEXT DEFAULT NULL,
  new_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tour_id_val UUID;
  updated_stop JSON;
BEGIN
  -- Prüfen ob Token gültig und Stop zur Tour gehört
  SELECT t.id INTO tour_id_val
  FROM delivery_tours t
  JOIN delivery_stops s ON s.tour_id = t.id
  WHERE t.access_token = tour_token
    AND s.id = stop_id
    AND t.status = 'active';

  IF tour_id_val IS NULL THEN
    RETURN json_build_object('error', 'Invalid token or stop not found');
  END IF;

  -- Stop aktualisieren
  UPDATE delivery_stops
  SET
    status = COALESCE(new_status, status),
    cash_collected = COALESCE(new_cash_collected, cash_collected),
    cash_collected_amount = COALESCE(new_cash_collected_amount, cash_collected_amount),
    cash_notes = COALESCE(new_cash_notes, cash_notes),
    stop_notes = COALESCE(new_stop_notes, stop_notes),
    completed_at = COALESCE(new_completed_at, completed_at)
  WHERE id = stop_id
  RETURNING row_to_json(delivery_stops.*) INTO updated_stop;

  RETURN updated_stop;
END;
$$;

-- 5. RPC-Funktion zum Hochladen einer Signatur per Token
CREATE OR REPLACE FUNCTION add_signature_by_token(
  tour_token UUID,
  p_stop_id UUID,
  p_signature_url TEXT,
  p_signer_name TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tour_id_val UUID;
  new_signature JSON;
BEGIN
  -- Prüfen ob Token gültig
  SELECT t.id INTO tour_id_val
  FROM delivery_tours t
  JOIN delivery_stops s ON s.tour_id = t.id
  WHERE t.access_token = tour_token
    AND s.id = p_stop_id
    AND t.status = 'active';

  IF tour_id_val IS NULL THEN
    RETURN json_build_object('error', 'Invalid token or stop not found');
  END IF;

  -- Signatur einfügen
  INSERT INTO delivery_signatures (stop_id, signature_url, signer_name, latitude, longitude)
  VALUES (p_stop_id, p_signature_url, p_signer_name, p_latitude, p_longitude)
  RETURNING row_to_json(delivery_signatures.*) INTO new_signature;

  RETURN new_signature;
END;
$$;

-- 6. RPC-Funktion zum Hochladen eines Fotos per Token
CREATE OR REPLACE FUNCTION add_photo_by_token(
  tour_token UUID,
  p_stop_id UUID,
  p_photo_url TEXT,
  p_caption TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tour_id_val UUID;
  new_photo JSON;
BEGIN
  -- Prüfen ob Token gültig
  SELECT t.id INTO tour_id_val
  FROM delivery_tours t
  JOIN delivery_stops s ON s.tour_id = t.id
  WHERE t.access_token = tour_token
    AND s.id = p_stop_id
    AND t.status = 'active';

  IF tour_id_val IS NULL THEN
    RETURN json_build_object('error', 'Invalid token or stop not found');
  END IF;

  -- Foto einfügen
  INSERT INTO delivery_stop_photos (stop_id, photo_url, caption)
  VALUES (p_stop_id, p_photo_url, p_caption)
  RETURNING row_to_json(delivery_stop_photos.*) INTO new_photo;

  RETURN new_photo;
END;
$$;

-- 7. Berechtigungen für anon user
GRANT EXECUTE ON FUNCTION get_tour_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION update_stop_by_token(UUID, UUID, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION add_signature_by_token(UUID, UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
GRANT EXECUTE ON FUNCTION add_photo_by_token(UUID, UUID, TEXT, TEXT) TO anon;
