-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  name text NOT NULL,
  date_of_birth date,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT children_pkey PRIMARY KEY (id),
  CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id)
);
CREATE TABLE public.fund_directives (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL UNIQUE,
  guardian_name text,
  guardian_contact text,
  instructions text,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT fund_directives_pkey PRIMARY KEY (id),
  CONSTRAINT fund_directives_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.goal_owners (
  goal_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  child_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT goal_owners_pkey PRIMARY KEY (goal_id, owner_id),
  CONSTRAINT goal_owners_goal_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id),
  CONSTRAINT goal_owners_owner_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT goal_owners_child_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  goal_type USER-DEFINED NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount >= 0::numeric),
  target_date date NOT NULL,
  monthly_contribution numeric NOT NULL CHECK (monthly_contribution >= 0::numeric),
  is_paused boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT goals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.investment_portfolios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL UNIQUE,
  portfolio_type USER-DEFINED NOT NULL,
  allocation_percentage integer NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  current_value numeric DEFAULT 0 CHECK (current_value >= 0::numeric),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT investment_portfolios_pkey PRIMARY KEY (id),
  CONSTRAINT investment_portfolios_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  amount numeric NOT NULL,
  date timestamp with time zone DEFAULT now(),
  type USER-DEFINED NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  full_name text,
  phone text,
  role USER-DEFINED NOT NULL DEFAULT 'child'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);