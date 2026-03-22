-- Migration: Add subscription and Stripe fields to users table
-- Run this in the Supabase SQL Editor

-- Add subscription columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
  ON public.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Create index for tier-based queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier 
  ON public.users(subscription_tier);

-- Add check constraint for valid tiers
ALTER TABLE public.users
  ADD CONSTRAINT check_subscription_tier 
  CHECK (subscription_tier IN ('free', 'premium'));

-- Add check constraint for valid subscription statuses
ALTER TABLE public.users
  ADD CONSTRAINT check_subscription_status
  CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'));

COMMENT ON COLUMN public.users.subscription_tier IS 'User subscription tier: free or premium';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.users.subscription_status IS 'Current Stripe subscription status';
COMMENT ON COLUMN public.users.subscription_expires_at IS 'When the current subscription period ends';
