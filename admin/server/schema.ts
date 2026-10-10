// Database schema (PRD section 5, simplified). Plain SQL that runs on Postgres and PGlite (used for tests and local dev).
// Deviation from the PRD: raw_events is a plain indexed table (purged by age) rather than day-partitioned; partition it
// once volume passes a few million events a month. Dashboards read the compact device_days / feature_days tables, not raw_events.
export const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
CREATE TABLE devices (
  device_id uuid PRIMARY KEY,
  first_seen timestamptz NOT NULL, last_seen timestamptz NOT NULL,
  country text, region text, city text,
  os text, browser text, browser_version text, device_type text,
  language text, tz text, screen_band text, app_version text,
  player_id uuid, consent_version text, consent_at timestamptz,
  sessions_count int NOT NULL DEFAULT 0, active_seconds int NOT NULL DEFAULT 0, lives_count int NOT NULL DEFAULT 0,
  countries text[] NOT NULL DEFAULT '{}',
  last_feature text, is_test boolean NOT NULL DEFAULT false
);
CREATE INDEX devices_last_seen ON devices (last_seen);
CREATE INDEX devices_country ON devices (country);

CREATE TABLE sessions (
  session_id uuid PRIMARY KEY, device_id uuid NOT NULL,
  started_at timestamptz NOT NULL, ended_at timestamptz, last_event_at timestamptz NOT NULL,
  active_seconds int NOT NULL DEFAULT 0, screens jsonb NOT NULL DEFAULT '{}',
  entry_referrer text, utm jsonb, is_test boolean NOT NULL DEFAULT false
);
CREATE INDEX sessions_device ON sessions (device_id, started_at);
CREATE INDEX sessions_started ON sessions (started_at);

CREATE TABLE lives (
  life_id uuid PRIMARY KEY, device_id uuid NOT NULL,
  started_at timestamptz NOT NULL, ended_at timestamptz,
  age_reached int, ending_id text, archetype text, gender text, district text, is_test boolean NOT NULL DEFAULT false
);
CREATE INDEX lives_device ON lives (device_id);

CREATE TABLE raw_events (
  event_id uuid PRIMARY KEY, received_at timestamptz NOT NULL, ts timestamptz NOT NULL,
  device_id uuid NOT NULL, session_id uuid NOT NULL, life_id uuid,
  name text NOT NULL, props jsonb NOT NULL DEFAULT '{}',
  country text, region text, city text, is_test boolean NOT NULL DEFAULT false
);
CREATE INDEX raw_events_received ON raw_events (received_at);
CREATE INDEX raw_events_device ON raw_events (device_id, ts);
CREATE INDEX raw_events_name ON raw_events (name, ts);

-- One row per device per day: the base for DAU/WAU/MAU, new vs returning, retention and geography.
CREATE TABLE device_days (
  day date NOT NULL, device_id uuid NOT NULL,
  active_seconds int NOT NULL DEFAULT 0, sessions int NOT NULL DEFAULT 0,
  country text, region text, city text, device_type text, app_version text,
  is_new boolean NOT NULL DEFAULT false, is_test boolean NOT NULL DEFAULT false,
  PRIMARY KEY (day, device_id)
);
CREATE INDEX device_days_device ON device_days (device_id);

CREATE TABLE feature_days (
  day date NOT NULL, feature text NOT NULL, device_id uuid NOT NULL,
  uses int NOT NULL DEFAULT 0, score_sum double precision NOT NULL DEFAULT 0, score_n int NOT NULL DEFAULT 0,
  is_test boolean NOT NULL DEFAULT false,
  PRIMARY KEY (day, feature, device_id)
);
CREATE INDEX feature_days_feature ON feature_days (feature, day);

-- Playtime by where it was spent, and a local-time heatmap (dow 0=Sunday). Keyed by device so erasure can remove a player's share.
CREATE TABLE playtime_split (day date NOT NULL, device_id uuid NOT NULL, bucket text NOT NULL, seconds bigint NOT NULL DEFAULT 0, PRIMARY KEY (day, device_id, bucket));
CREATE TABLE activity_heat (day date NOT NULL, device_id uuid NOT NULL, dow int NOT NULL, hour int NOT NULL, seconds bigint NOT NULL DEFAULT 0, PRIMARY KEY (day, device_id, dow, hour));

CREATE TABLE rate_limits (key text NOT NULL, window_start bigint NOT NULL, n int NOT NULL DEFAULT 0, PRIMARY KEY (key, window_start));
CREATE TABLE erased_devices (hash text PRIMARY KEY, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE ingest_stats (day date NOT NULL, accepted bigint NOT NULL DEFAULT 0, duplicate bigint NOT NULL DEFAULT 0, invalid bigint NOT NULL DEFAULT 0, rate_limited bigint NOT NULL DEFAULT 0, PRIMARY KEY (day));

CREATE TABLE admin_users (
  admin_id uuid PRIMARY KEY, email text NOT NULL UNIQUE, role text NOT NULL CHECK (role IN ('owner','analyst','support','engineer')),
  password_hash text NOT NULL, totp_secret text, disabled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admin_sessions (token_hash text PRIMARY KEY, admin_id uuid NOT NULL REFERENCES admin_users(admin_id), created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now());
CREATE TABLE login_attempts (key text NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE INDEX login_attempts_key ON login_attempts (key, at);

CREATE TABLE audit_log (id bigserial PRIMARY KEY, admin_id uuid, admin_email text, action text NOT NULL, target text, detail jsonb, at timestamptz NOT NULL DEFAULT now(), ip_hash text);
-- append-only, except for the retention job, which sets nal.purge for its own transaction
CREATE FUNCTION audit_log_immutable() RETURNS trigger AS $$ BEGIN IF TG_OP = 'DELETE' AND current_setting('nal.purge', true) = 'on' THEN RETURN OLD; END IF; RAISE EXCEPTION 'audit_log is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
`,
  },
]
