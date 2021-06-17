CREATE EXTENSION citext;

CREATE TABLE users (
   username VARCHAR(128) NOT NULL PRIMARY KEY CHECK (char_length(username) > 0),
   display_name VARCHAR(128) NOT NULL CHECK (char_length(display_name) > 0),
   email CITEXT UNIQUE NOT NULL CHECK (char_length(email) > 0),
   email_validated BOOLEAN NOT NULL DEFAULT FALSE,
   hash TEXT NOT NULL,
   created TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_display_name ON users (display_name);