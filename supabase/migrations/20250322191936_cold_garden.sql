/*
  # Add notification settings table

  1. New Tables
    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `scan_reminders` (boolean)
      - `health_reports` (boolean)
      - `condition_alerts` (boolean)
      - `order_updates` (boolean)
      - `delivery_status` (boolean)
      - `recommendations` (boolean)
      - `app_updates` (boolean)
      - `news` (boolean)
      - `offers` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notification_settings` table
    - Add policies for authenticated users to manage their own settings
*/

-- Create notification settings table
create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  scan_reminders boolean default true,
  health_reports boolean default true,
  condition_alerts boolean default true,
  order_updates boolean default true,
  delivery_status boolean default true,
  recommendations boolean default false,
  app_updates boolean default true,
  news boolean default false,
  offers boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table notification_settings enable row level security;

-- Create policies
create policy "Users can view their own notification settings"
  on notification_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own notification settings"
  on notification_settings
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own notification settings"
  on notification_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create function to automatically create notification settings for new users
create or replace function public.handle_new_user_notifications()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id);
  return new;
end;
$$;

-- Create trigger to create notification settings when a new profile is created
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_notifications();