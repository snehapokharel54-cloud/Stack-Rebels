CREATE TABLE bookings (
    id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id   UUID      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in      DATE      NOT NULL,
    check_out     DATE      NOT NULL,
    total_nights  INTEGER   NOT NULL CHECK (total_nights > 0),
    total_price   INTEGER   NOT NULL CHECK (total_price >= 0),
    status        VARCHAR(50) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in)
);