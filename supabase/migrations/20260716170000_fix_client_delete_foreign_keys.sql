-- Make client deletion reliable across legacy and newer tables.
-- Nullable references keep their records and clear client_id; required
-- client-owned records are removed with the client.

DO $$
DECLARE
  foreign_key record;
  delete_action text;
BEGIN
  FOR foreign_key IN
    SELECT
      constraint_row.oid,
      constraint_row.conname,
      constraint_row.conrelid,
      constraint_row.conkey,
      constraint_row.confdeltype,
      constraint_row.condeferrable,
      constraint_row.condeferred,
      child_namespace.nspname AS child_schema,
      child_table.relname AS child_table,
      pg_get_constraintdef(constraint_row.oid, true) AS definition,
      bool_and(NOT child_column.attnotnull) AS all_columns_nullable
    FROM pg_constraint constraint_row
    JOIN pg_class child_table
      ON child_table.oid = constraint_row.conrelid
    JOIN pg_namespace child_namespace
      ON child_namespace.oid = child_table.relnamespace
    JOIN LATERAL unnest(constraint_row.conkey) AS key_column(attnum)
      ON true
    JOIN pg_attribute child_column
      ON child_column.attrelid = constraint_row.conrelid
     AND child_column.attnum = key_column.attnum
    WHERE constraint_row.contype = 'f'
      AND constraint_row.confrelid = 'public.clients'::regclass
      -- a = NO ACTION, r = RESTRICT. CASCADE/SET NULL are already safe.
      AND constraint_row.confdeltype IN ('a', 'r')
    GROUP BY
      constraint_row.oid,
      constraint_row.conname,
      constraint_row.conrelid,
      constraint_row.conkey,
      constraint_row.confdeltype,
      constraint_row.condeferrable,
      constraint_row.condeferred,
      child_namespace.nspname,
      child_table.relname
  LOOP
    delete_action := CASE
      WHEN foreign_key.all_columns_nullable THEN 'SET NULL'
      ELSE 'CASCADE'
    END;

    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      foreign_key.child_schema,
      foreign_key.child_table,
      foreign_key.conname
    );

    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I %s ON DELETE %s%s%s',
      foreign_key.child_schema,
      foreign_key.child_table,
      foreign_key.conname,
      regexp_replace(foreign_key.definition, ' DEFERRABLE.*$', ''),
      delete_action,
      CASE WHEN foreign_key.condeferrable THEN ' DEFERRABLE' ELSE '' END,
      CASE WHEN foreign_key.condeferred THEN ' INITIALLY DEFERRED' ELSE '' END
    );
  END LOOP;
END
$$;
