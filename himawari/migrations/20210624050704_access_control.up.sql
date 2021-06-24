CREATE TYPE access_role as ENUM ('none', 'collaborator', 'owner', 'moderator', 'admin');

CREATE FUNCTION contest_access_for_user(IN username users.username%TYPE, IN contest contests.id%TYPE, OUT role access_role)
    RETURNS access_role
    RETURNS NULL ON NULL INPUT
    STABLE
    LANGUAGE plpgsql
AS
$$
BEGIN
    role := 'none';

    IF (SELECT owner FROM contests C WHERE C.id = contest) = username THEN
        role := 'owner';
    ELSIF (username IN (SELECT all_judges(contest))) THEN
        role := 'collaborator';
    END IF;
END;
$$;