-- Create indexes for organization-related queries
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_created ON teams(organization_id, created_at);

-- Add comment for documentation
COMMENT ON TABLE organizations IS 'Organizations table for multi-tenant isolation';
COMMENT ON TABLE organization_members IS 'Organization members with role-based access control';

-- Add constraints to ensure data integrity
ALTER TABLE organization_members
ADD CONSTRAINT unique_org_user UNIQUE (organization_id, user_id);

-- Add constraints for role values
ALTER TABLE organization_members
ADD CONSTRAINT valid_org_role CHECK (role IN ('administrator', 'manager', 'reader'));
