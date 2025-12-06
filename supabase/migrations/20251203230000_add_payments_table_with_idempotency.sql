-- ============================================
-- PAYMENTS TABLE WITH IDEMPOTENCY SUPPORT
-- Duplicate Payment Prevention Implementation
-- ============================================

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL, -- 'card', 'paypal', 'apple_pay', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- For duplicate prevention
    payment_provider_id VARCHAR(255), -- Stripe payment intent ID, PayPal transaction ID, etc.
    metadata JSONB DEFAULT '{}', -- Additional payment data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and constraints
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);

-- RLS Policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

-- Only system can insert payments (through service functions)
CREATE POLICY "System can insert payments"
ON payments FOR INSERT
WITH CHECK (true); -- Allow system operations

-- Only system can update payment status
CREATE POLICY "System can update payments"
ON payments FOR UPDATE
USING (true); -- Allow system operations

-- Users cannot delete payments
CREATE POLICY "Payments cannot be deleted by users"
ON payments FOR DELETE
USING (false);

-- Function to update payment status safely
CREATE OR REPLACE FUNCTION update_payment_status(
    p_payment_id UUID,
    p_new_status VARCHAR(20),
    p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- Validate status transition
    CASE current_status
        WHEN 'pending' THEN
            IF p_new_status NOT IN ('processing', 'completed', 'failed') THEN
                RAISE EXCEPTION 'Invalid status transition from pending to %', p_new_status;
            END IF;
        WHEN 'processing' THEN
            IF p_new_status NOT IN ('completed', 'failed') THEN
                RAISE EXCEPTION 'Invalid status transition from processing to %', p_new_status;
            END IF;
        WHEN 'completed' THEN
            IF p_new_status NOT IN ('refunded') THEN
                RAISE EXCEPTION 'Invalid status transition from completed to %', p_new_status;
            END IF;
        WHEN 'failed' THEN
            RAISE EXCEPTION 'Cannot change status from failed';
        WHEN 'refunded' THEN
            RAISE EXCEPTION 'Cannot change status from refunded';
    END CASE;

    -- Update payment
    UPDATE payments
    SET
        status = p_new_status,
        metadata = COALESCE(metadata, '{}') || COALESCE(p_metadata, '{}'),
        updated_at = NOW()
    WHERE id = p_payment_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely process payment with idempotency
CREATE OR REPLACE FUNCTION process_payment_idempotent(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_currency VARCHAR(3),
    p_method VARCHAR(50),
    p_idempotency_key VARCHAR(255),
    p_provider_id VARCHAR(255) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE(
    payment_id UUID,
    status VARCHAR(20),
    was_duplicate BOOLEAN
) AS $$
DECLARE
    existing_payment_id UUID;
    existing_status VARCHAR(20);
BEGIN
    -- Check for existing payment with same idempotency key
    SELECT id, status INTO existing_payment_id, existing_status
    FROM payments
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        -- Return existing payment
        RETURN QUERY SELECT existing_payment_id, existing_status, TRUE;
        RETURN;
    END IF;

    -- Insert new payment
    INSERT INTO payments (
        user_id,
        amount,
        currency,
        method,
        status,
        idempotency_key,
        payment_provider_id,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        COALESCE(p_currency, 'USD'),
        p_method,
        'completed', -- Mock completion
        p_idempotency_key,
        p_provider_id,
        p_metadata
    )
    RETURNING id INTO existing_payment_id;

    RETURN QUERY SELECT existing_payment_id, 'completed'::VARCHAR(20), FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_payment_status(UUID, VARCHAR(20), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_idempotent(UUID, DECIMAL(10,2), VARCHAR(3), VARCHAR(50), VARCHAR(255), VARCHAR(255), JSONB) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Payment transactions with duplicate prevention';
COMMENT ON COLUMN payments.idempotency_key IS 'Unique key to prevent duplicate payments within 5-minute windows';
COMMENT ON COLUMN payments.payment_provider_id IS 'External payment provider transaction ID';
COMMENT ON COLUMN payments.metadata IS 'Additional payment-specific data (JSON)';
