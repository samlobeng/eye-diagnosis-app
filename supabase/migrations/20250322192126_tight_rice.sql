/*
  # Add privacy settings table

  1. New Tables
    - `privacy_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `two_factor_auth` (boolean)
      - `biometric_lock` (boolean)
      - `app_lock` (boolean)
      - `data_collection` (boolean)
      - `analytics` (boolean)
      - `personalization` (boolean)
      - `share_health_data` (boolean)
      - `share_with_doctors` (boolean)
      - `anonymous_data` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `privacy_settings` table
    - Add policies for authenticated users to manage their own settings
*/

-- Create privacy settings table
create table if not exists privacy_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  two_factor_auth boolean default false,
  biometric_lock boolean default true,
  app_lock boolean default false,
  data_collection boolean default true,
  analytics boolean default true,
  personalization boolean default true,
  share_health_data boolean default false,
  share_with_doctors boolean default true,
  anonymous_data boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table privacy_settings enable row level security;

-- Create policies
create policy "Users can view their own privacy settings"
  on privacy_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own privacy settings"
  on privacy_settings
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own privacy settings"
  on privacy_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create function to automatically create privacy settings for new users
create or replace function public.handle_new_user_privacy()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.privacy_settings (user_id)
  values (new.id);
  return new;
end;
$$;

-- Create trigger to create privacy settings when a new profile is created
create trigger on_profile_created_privacy
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_privacy();