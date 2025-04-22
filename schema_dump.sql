--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_pomodoro_todos_updated_at(); Type: FUNCTION; Schema: public; Owner: josephwaugh
--

CREATE FUNCTION public.update_pomodoro_todos_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pomodoro_todos_updated_at() OWNER TO josephwaugh;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: custom_themes; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.custom_themes (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    description text,
    image_url text NOT NULL,
    is_public boolean DEFAULT false,
    prompt text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    moderation_status character varying(20) DEFAULT 'pending'::character varying,
    moderation_notes text,
    moderation_date timestamp without time zone,
    reported_count integer DEFAULT 0,
    last_reported_at timestamp without time zone,
    CONSTRAINT custom_themes_moderation_status_check CHECK (((moderation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.custom_themes OWNER TO josephwaugh;

--
-- Name: custom_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.custom_themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.custom_themes_id_seq OWNER TO josephwaugh;

--
-- Name: custom_themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.custom_themes_id_seq OWNED BY public.custom_themes.id;


--
-- Name: failed_login_attempts; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.failed_login_attempts (
    id integer NOT NULL,
    login_identifier character varying(255) NOT NULL,
    ip_address character varying(45) NOT NULL,
    attempt_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_login_attempts OWNER TO josephwaugh;

--
-- Name: failed_login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.failed_login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.failed_login_attempts_id_seq OWNER TO josephwaugh;

--
-- Name: failed_login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.failed_login_attempts_id_seq OWNED BY public.failed_login_attempts.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO josephwaugh;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO josephwaugh;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: playlist_songs; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.playlist_songs (
    playlist_id integer NOT NULL,
    song_id integer NOT NULL,
    "position" integer
);


ALTER TABLE public.playlist_songs OWNER TO josephwaugh;

--
-- Name: playlists; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.playlists (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.playlists OWNER TO josephwaugh;

--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.playlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.playlists_id_seq OWNER TO josephwaugh;

--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.pomodoro_sessions (
    id integer NOT NULL,
    user_id integer,
    duration integer NOT NULL,
    task character varying(255),
    completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pomodoro_sessions OWNER TO josephwaugh;

--
-- Name: pomodoro_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.pomodoro_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pomodoro_sessions_id_seq OWNER TO josephwaugh;

--
-- Name: pomodoro_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.pomodoro_sessions_id_seq OWNED BY public.pomodoro_sessions.id;


--
-- Name: pomodoro_todos; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.pomodoro_todos (
    id integer NOT NULL,
    user_id integer NOT NULL,
    todo_id text NOT NULL,
    text text NOT NULL,
    completed boolean DEFAULT false,
    recorded_in_stats boolean DEFAULT false,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pomodoro_todos OWNER TO josephwaugh;

--
-- Name: pomodoro_todos_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.pomodoro_todos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pomodoro_todos_id_seq OWNER TO josephwaugh;

--
-- Name: pomodoro_todos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.pomodoro_todos_id_seq OWNED BY public.pomodoro_todos.id;


--
-- Name: reset_tokens; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.reset_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reset_tokens OWNER TO josephwaugh;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reset_tokens_id_seq OWNER TO josephwaugh;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.reset_tokens_id_seq OWNED BY public.reset_tokens.id;


--
-- Name: songs; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.songs (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    artist character varying(100) NOT NULL,
    album character varying(100),
    duration integer,
    image_url text,
    url character varying(512),
    youtube_id character varying(30),
    source character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.songs OWNER TO josephwaugh;

--
-- Name: songs_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.songs_id_seq OWNER TO josephwaugh;

--
-- Name: songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.songs_id_seq OWNED BY public.songs.id;


--
-- Name: theme_reports; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.theme_reports (
    id integer NOT NULL,
    theme_id integer NOT NULL,
    user_id integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_at timestamp without time zone,
    reviewed_by integer,
    CONSTRAINT theme_reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'dismissed'::character varying])::text[])))
);


ALTER TABLE public.theme_reports OWNER TO josephwaugh;

--
-- Name: theme_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.theme_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.theme_reports_id_seq OWNER TO josephwaugh;

--
-- Name: theme_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.theme_reports_id_seq OWNED BY public.theme_reports.id;


--
-- Name: themes; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.themes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image_url text NOT NULL,
    is_default boolean DEFAULT false,
    is_premium boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    moderation_status character varying(20) DEFAULT 'pending'::character varying,
    is_public boolean DEFAULT false,
    moderation_date timestamp without time zone,
    moderation_notes text,
    reported_count integer DEFAULT 0,
    last_reported_at timestamp without time zone,
    CONSTRAINT themes_moderation_status_check CHECK (((moderation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.themes OWNER TO josephwaugh;

--
-- Name: themes_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.themes_id_seq OWNER TO josephwaugh;

--
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.themes_id_seq OWNED BY public.themes.id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.user_settings (
    id integer NOT NULL,
    user_id integer,
    pomodoro_duration integer DEFAULT 25,
    short_break_duration integer DEFAULT 5,
    long_break_duration integer DEFAULT 15,
    pomodoros_until_long_break integer DEFAULT 4,
    auto_start_breaks boolean DEFAULT true,
    auto_start_pomodoros boolean DEFAULT true,
    dark_mode boolean DEFAULT false,
    sound_enabled boolean DEFAULT true,
    notification_enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    theme_id integer
);


ALTER TABLE public.user_settings OWNER TO josephwaugh;

--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.user_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_settings_id_seq OWNER TO josephwaugh;

--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    avatar_url character varying(255),
    google_id character varying(255),
    facebook_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    username character varying(50) NOT NULL,
    bio text,
    github_id character varying(255),
    is_verified boolean DEFAULT false,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO josephwaugh;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO josephwaugh;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: josephwaugh
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.verification_tokens OWNER TO josephwaugh;

--
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: josephwaugh
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.verification_tokens_id_seq OWNER TO josephwaugh;

--
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: josephwaugh
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- Name: custom_themes id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.custom_themes ALTER COLUMN id SET DEFAULT nextval('public.custom_themes_id_seq'::regclass);


--
-- Name: failed_login_attempts id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.failed_login_attempts ALTER COLUMN id SET DEFAULT nextval('public.failed_login_attempts_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: pomodoro_sessions id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_sessions ALTER COLUMN id SET DEFAULT nextval('public.pomodoro_sessions_id_seq'::regclass);


--
-- Name: pomodoro_todos id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_todos ALTER COLUMN id SET DEFAULT nextval('public.pomodoro_todos_id_seq'::regclass);


--
-- Name: reset_tokens id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.reset_tokens_id_seq'::regclass);


--
-- Name: songs id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.songs ALTER COLUMN id SET DEFAULT nextval('public.songs_id_seq'::regclass);


--
-- Name: theme_reports id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports ALTER COLUMN id SET DEFAULT nextval('public.theme_reports_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- Name: custom_themes custom_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.custom_themes
    ADD CONSTRAINT custom_themes_pkey PRIMARY KEY (id);


--
-- Name: failed_login_attempts failed_login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.failed_login_attempts
    ADD CONSTRAINT failed_login_attempts_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: playlist_songs playlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_pkey PRIMARY KEY (playlist_id, song_id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_todos pomodoro_todos_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_todos
    ADD CONSTRAINT pomodoro_todos_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);


--
-- Name: theme_reports theme_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports
    ADD CONSTRAINT theme_reports_pkey PRIMARY KEY (id);


--
-- Name: theme_reports theme_reports_theme_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports
    ADD CONSTRAINT theme_reports_theme_id_user_id_key UNIQUE (theme_id, user_id);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: failed_login_attempts unique_attempt; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.failed_login_attempts
    ADD CONSTRAINT unique_attempt UNIQUE (login_identifier, ip_address, attempt_time);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: idx_custom_themes_is_public; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_custom_themes_is_public ON public.custom_themes USING btree (is_public);


--
-- Name: idx_custom_themes_user_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_custom_themes_user_id ON public.custom_themes USING btree (user_id);


--
-- Name: idx_failed_attempts_identifier; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_failed_attempts_identifier ON public.failed_login_attempts USING btree (login_identifier);


--
-- Name: idx_failed_attempts_time; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_failed_attempts_time ON public.failed_login_attempts USING btree (attempt_time);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_playlist_songs_playlist_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_playlist_songs_playlist_id ON public.playlist_songs USING btree (playlist_id);


--
-- Name: idx_playlist_songs_song_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_playlist_songs_song_id ON public.playlist_songs USING btree (song_id);


--
-- Name: idx_pomodoro_sessions_user_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions USING btree (user_id);


--
-- Name: idx_themes_is_default; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_themes_is_default ON public.themes USING btree (is_default);


--
-- Name: idx_user_settings_user_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_user_settings_user_id ON public.user_settings USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_facebook_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_users_facebook_id ON public.users USING btree (facebook_id);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_verification_tokens_token; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_verification_tokens_token ON public.verification_tokens USING btree (token);


--
-- Name: idx_verification_tokens_user_id; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX idx_verification_tokens_user_id ON public.verification_tokens USING btree (user_id);


--
-- Name: pomodoro_todos_user_id_idx; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE INDEX pomodoro_todos_user_id_idx ON public.pomodoro_todos USING btree (user_id);


--
-- Name: pomodoro_todos_user_id_todo_id_idx; Type: INDEX; Schema: public; Owner: josephwaugh
--

CREATE UNIQUE INDEX pomodoro_todos_user_id_todo_id_idx ON public.pomodoro_todos USING btree (user_id, todo_id);


--
-- Name: pomodoro_todos pomodoro_todos_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: josephwaugh
--

CREATE TRIGGER pomodoro_todos_updated_at_trigger BEFORE UPDATE ON public.pomodoro_todos FOR EACH ROW EXECUTE FUNCTION public.update_pomodoro_todos_updated_at();


--
-- Name: custom_themes custom_themes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.custom_themes
    ADD CONSTRAINT custom_themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: playlist_songs playlist_songs_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: playlist_songs playlist_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pomodoro_todos pomodoro_todos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.pomodoro_todos
    ADD CONSTRAINT pomodoro_todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reset_tokens reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: theme_reports theme_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports
    ADD CONSTRAINT theme_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: theme_reports theme_reports_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports
    ADD CONSTRAINT theme_reports_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: theme_reports theme_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.theme_reports
    ADD CONSTRAINT theme_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_tokens verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: josephwaugh
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

