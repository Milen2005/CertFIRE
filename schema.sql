-- CertFIRE Supabase Database Schema
-- Paste and run this script inside your Supabase project's SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PARTICIPANT', 'ORGANIZER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create fests table
CREATE TABLE IF NOT EXISTS public.fests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    venue TEXT,
    capacity INTEGER DEFAULT 100,
    image TEXT,
    is_draft BOOLEAN DEFAULT false,
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fest_id UUID NOT NULL REFERENCES public.fests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'ISSUED', 'REVOKED')),
    cert_issued BOOLEAN NOT NULL DEFAULT false,
    certificate_id TEXT UNIQUE,
    template_url TEXT,
    participant_name TEXT,
    participant_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, fest_id)
);

-- 4. Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fest_id UUID NOT NULL REFERENCES public.fests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Disable Row Level Security (RLS) for testing/development simplicity
-- (Or configure policies on the Supabase Dashboard if you wish to enforce RLS)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 7. Add participant details to existing registrations table if needed
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS participant_name TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS participant_email TEXT;
