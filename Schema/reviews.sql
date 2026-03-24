CREATE TABLE reviews (
    id           UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id   UUID      NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    property_id  UUID      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reviewer_id  UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating       INTEGER   NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment      TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);