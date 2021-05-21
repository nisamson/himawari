CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    username TEXT NOT NULL PRIMARY KEY,
    display_name TEXT NOT NULL,
    email CITEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    hash TEXT NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX users_by_display_name ON users (display_name);
CREATE INDEX users_by_email ON users (email);