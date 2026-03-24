CREATE TABLE amenities (
    id        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name      VARCHAR(100) NOT NULL UNIQUE,
    icon_name VARCHAR(100),
    category  VARCHAR(100)
);