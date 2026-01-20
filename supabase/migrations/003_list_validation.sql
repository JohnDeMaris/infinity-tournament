-- Migration: Add list validation result column
-- Phase 3: List Validation

-- ============================================================================
-- REGISTRATIONS: Add list_validation_result column
-- ============================================================================

-- Add list_validation_result JSONB column
-- Structure: {"valid": boolean, "errors": string[], "warnings": string[]}
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS list_validation_result JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.registrations.list_validation_result IS
  'Cached validation result: {valid: boolean, errors: string[], warnings: string[]}';
