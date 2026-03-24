CREATE TABLE property_images (
    id                   UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id          UUID      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255),
    image_url            TEXT      NOT NULL,
    thumbnail_url        TEXT,
    is_primary           BOOLEAN   NOT NULL DEFAULT FALSE,
    display_order        INTEGER   NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);