CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX memberships_user_idx ON memberships(user_id);
CREATE TABLE boards (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  dashboard jsonb NOT NULL CHECK (jsonb_typeof(dashboard) = 'array'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX boards_workspace_idx ON boards(workspace_id, updated_at DESC);
CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by text NOT NULL REFERENCES "user"(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invitations_workspace_idx ON invitations(workspace_id);
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  author_id text NOT NULL REFERENCES "user"(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_task_idx ON comments(board_id, task_id, created_at);
CREATE TABLE activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id uuid REFERENCES boards(id) ON DELETE SET NULL,
  actor_id text NOT NULL REFERENCES "user"(id),
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_workspace_idx ON activity(workspace_id, created_at DESC);
CREATE TABLE imports (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id),
  source_id text NOT NULL,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  PRIMARY KEY (workspace_id, user_id, source_id)
);
CREATE UNIQUE INDEX one_owner_per_workspace ON memberships(workspace_id) WHERE role='owner';
