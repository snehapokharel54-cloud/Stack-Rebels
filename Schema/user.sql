CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255)  NOT NULL UNIQUE,
    full_name     VARCHAR(255)  NOT NULL,
    avatar_url    TEXT,
    phone         VARCHAR(50),
    is_superhost  BOOLEAN       NOT NULL DEFAULT FALSE,
    is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);