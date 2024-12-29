-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    CONSTRAINT organizations_name_unique UNIQUE(name)
);

-- Create organization_members table for managing roles within organizations
CREATE TABLE IF NOT EXISTS organization_members (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('administrator', 'manager', 'reader')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organization_members_user_org_unique UNIQUE(organization_id, user_id)
);

-- Add organization_id to teams table
ALTER TABLE teams 
ADD COLUMN organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_teams_organization_id ON teams(organization_id);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- Update RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY organization_access_policy ON organizations
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = organizations.id 
            AND organization_members.user_id = current_user_id()
        )
    );

-- Create policies for organization_members
CREATE POLICY organization_members_access_policy ON organization_members
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om 
            WHERE om.organization_id = organization_members.organization_id 
            AND om.user_id = current_user_id() 
            AND om.role = 'administrator'
        )
    );

-- Create policies for teams
CREATE POLICY teams_access_policy ON teams
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = teams.organization_id 
            AND organization_members.user_id = current_user_id()
        )
    );
