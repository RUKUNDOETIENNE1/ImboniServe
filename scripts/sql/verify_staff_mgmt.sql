DO $$
BEGIN
  IF to_regclass('"StaffRole"') IS NULL THEN
    RAISE EXCEPTION 'Missing table StaffRole';
  END IF;
  IF to_regclass('"UserStaffRole"') IS NULL THEN
    RAISE EXCEPTION 'Missing table UserStaffRole';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'primaryBranchId'
  ) THEN
    RAISE EXCEPTION 'Missing column User.primaryBranchId';
  END IF;
END $$;
