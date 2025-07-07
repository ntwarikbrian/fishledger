-- Script to clean up all database objects without dropping the database

-- First, disable all triggers
SET session_replication_role = 'replica';

-- Drop all triggers
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
    END LOOP;
END $$;

-- Drop all functions
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT ns.nspname AS schema_name, p.proname AS function_name,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                      func_record.schema_name, 
                      func_record.function_name,
                      func_record.args);
    END LOOP;
END $$;

-- Drop all tables (this will also drop constraints, indexes, etc.)
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_record.tablename);
    END LOOP;
END $$;

-- Drop all row level security policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Reset session replication role
SET session_replication_role = 'origin';

-- Notify completion
DO $$ 
BEGIN
    RAISE NOTICE 'Database cleanup completed successfully.';
END $$;