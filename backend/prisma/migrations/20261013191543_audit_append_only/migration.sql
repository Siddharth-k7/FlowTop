-- The audit log is append only. The API has no route that edits or deletes it;
-- this makes the database refuse it too, whatever the caller: a bug, a script,
-- or someone with a database console.
-- Hand-written: Prisma does not model triggers, and leaves them in place.
--
-- TRUNCATE is not blocked: the e2e tests use it to reset their own database.
-- A retention policy that must remove old rows would drop this trigger inside a
-- reviewed migration, never quietly.

CREATE FUNCTION audit_event_refuse_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is append only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_event_append_only
  BEFORE UPDATE OR DELETE ON "audit_event"
  FOR EACH ROW EXECUTE FUNCTION audit_event_refuse_change();
