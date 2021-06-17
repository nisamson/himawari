
CREATE TABLE contests (
    id SERIAL8 NOT NULL PRIMARY KEY,
    owner VARCHAR(128) NOT NULL REFERENCES users,
    name VARCHAR(1024) NOT NULL CHECK (char_length(name) > 0),
    created TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON contests (owner, name);

CREATE TABLE entries (
    id SERIAL8 NOT NULL PRIMARY KEY,
    contest INT8 NOT NULL REFERENCES contests (id) ON DELETE CASCADE,
    name VARCHAR(1024) NOT NULL CHECK (char_length(name) > 0),
    creator VARCHAR(1024) NOT NULL CHECK (char_length(creator) > 0),
    url VARCHAR(1024),
    description VARCHAR(65535)
);

CREATE TABLE contest_judges (
    contest INT8 NOT NULL REFERENCES contests ON DELETE CASCADE,
    judge VARCHAR(128) NOT NULL REFERENCES users ON DELETE CASCADE,
    PRIMARY KEY (contest, judge)
);

CREATE INDEX judge_contests ON contest_judges (judge, contest);

CREATE FUNCTION all_judges(IN contest contests.id%TYPE)
RETURNS TABLE (judge users.username%TYPE)
RETURNS NULL ON NULL INPUT
STABLE
LANGUAGE SQL
AS $$
    (SELECT owner FROM contests WHERE id = contest)
    UNION DISTINCT
    (SELECT judge FROM contest_judges WHERE contest_judges.contest = $1)
    $$;

CREATE FUNCTION user_contests(IN username users.username%TYPE)
RETURNS SETOF contests
RETURNS NULL ON NULL INPUT
STABLE
LANGUAGE SQL
AS $$
    (SELECT * FROM contests WHERE owner = username)
    UNION DISTINCT
    (SELECT C.* FROM contests C, contest_judges CJ WHERE CJ.judge = username AND C.id = CJ.contest)
$$;