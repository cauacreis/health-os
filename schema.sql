-- ═══════════════════════════════════════════════════════════════
-- HEALTH OS — Schema Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── Perfis de usuário (extensão do auth.users) ────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT,
  age           INTEGER CHECK (age BETWEEN 10 AND 120),
  weight        NUMERIC(5,1) CHECK (weight BETWEEN 20 AND 400),
  height        INTEGER CHECK (height BETWEEN 50 AND 280),
  sex           TEXT DEFAULT 'male' CHECK (sex IN ('male','female')),
  goal          TEXT DEFAULT 'muscleGain',
  program       TEXT DEFAULT 'upperLower5',
  activity      NUMERIC(4,3) DEFAULT 1.55,
  photo_url     TEXT,
  steps_today   INTEGER DEFAULT 0,
  water_today   INTEGER DEFAULT 0,
  meals_today   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Entradas do calendário ────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_entries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('workout','cardio','rest')),
  label      TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, type)
);

-- ── Log de treinos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL,
  day_id       INTEGER,
  day_name     TEXT,
  program_name TEXT,
  exercises    JSONB DEFAULT '[]',
  completed    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Log alimentar ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  name       TEXT NOT NULL,
  calories   INTEGER NOT NULL CHECK (calories >= 0),
  meal       TEXT CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  note       TEXT,
  time       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Log de sono ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  hours      NUMERIC(3,1) CHECK (hours BETWEEN 0 AND 24),
  quality    INTEGER CHECK (quality BETWEEN 1 AND 5),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Log de bioimpedância ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  body_fat      NUMERIC(4,1),
  muscle_mass   NUMERIC(4,1),
  visceral_fat  NUMERIC(4,1),
  bone_mass     NUMERIC(4,2),
  water_pct     NUMERIC(4,1),
  bmr           INTEGER,
  metabolic_age INTEGER,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Log de cardio ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cardio_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  type       TEXT,
  zone       TEXT,
  minutes    INTEGER CHECK (minutes > 0),
  avg_hr     INTEGER,
  kcal       INTEGER,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Planos alimentares ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Itens de planos alimentares ───────────────────────────────
CREATE TABLE IF NOT EXISTS meal_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  food_name    TEXT NOT NULL,
  calories     INTEGER CHECK (calories >= 0),
  protein      NUMERIC(5,1),
  carbs        NUMERIC(5,1),
  fat          NUMERIC(5,1),
  done         BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — cada usuário só vê/edita os próprios dados
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log         ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own_profile_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- calendar_entries
CREATE POLICY "own_calendar_select" ON calendar_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_calendar_insert" ON calendar_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_calendar_update" ON calendar_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_calendar_delete" ON calendar_entries FOR DELETE USING (auth.uid() = user_id);

-- workout_logs
CREATE POLICY "own_workout_select" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_workout_insert" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_workout_update" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_workout_delete" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- food_log (corrigido: adicionado UPDATE que estava faltando)
CREATE POLICY "own_food_select" ON food_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_food_insert" ON food_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_food_update" ON food_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_food_delete" ON food_log FOR DELETE USING (auth.uid() = user_id);

-- sleep_log (corrigido: adicionado DELETE que estava faltando)
CREATE POLICY "own_sleep_select" ON sleep_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_sleep_insert" ON sleep_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_sleep_update" ON sleep_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_sleep_delete" ON sleep_log FOR DELETE USING (auth.uid() = user_id);

-- bio_log (corrigido: adicionados UPDATE e DELETE que estavam faltando)
CREATE POLICY "own_bio_select" ON bio_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_bio_insert" ON bio_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_bio_update" ON bio_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_bio_delete" ON bio_log FOR DELETE USING (auth.uid() = user_id);

-- cardio_log (corrigido: adicionados UPDATE e DELETE que estavam faltando)
CREATE POLICY "own_cardio_select" ON cardio_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_cardio_insert" ON cardio_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_cardio_update" ON cardio_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_cardio_delete" ON cardio_log FOR DELETE USING (auth.uid() = user_id);

-- meal_plans
CREATE POLICY "own_meal_plans_select" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_meal_plans_insert" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_meal_plans_update" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_meal_plans_delete" ON meal_plans FOR DELETE USING (auth.uid() = user_id);

-- meal_log
CREATE POLICY "own_meal_log_select" ON meal_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_meal_log_insert" ON meal_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_meal_log_update" ON meal_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_meal_log_delete" ON meal_log FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- TRIGGER: cria perfil automaticamente ao registrar
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- nunca bloqueia o cadastro por falha no perfil
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- STORAGE BUCKET para fotos de perfil
-- ════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ════════════════════════════════════════════════════════════════
-- MIGRATIONS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_type TEXT DEFAULT 'full';