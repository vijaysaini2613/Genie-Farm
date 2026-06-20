-- ====================================================================
-- SBZEE FRESH E-COMMERCE DATABASE SCHEMA
-- Copy and run this inside the Supabase SQL Editor.
-- ====================================================================

-- 1. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE SOCIETIES TABLE (List of supported delivery locations)
create table public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sector text,
  city text not null,
  state text not null,
  pincode text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed professional societies matching Bhiwadi, Khairthal delivery zones
insert into public.societies (name, sector, city, state, pincode) values
  ('Ashiana Aangan', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Cosmos Greens', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Advik', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Tarang', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Terra Castle', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Satyam Green', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Town', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Avalon Royal Park', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('BDI Tulip Villas', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Nirmay', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('RLF The Park', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Krish Harmony Villas', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Gardens', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Hill View Garden', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Trehan Independent Floors', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Krish Vatika', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Krish Nikunj', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Oxirich Sunskriti 2', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Nimai Greens', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Anand Lok', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Terra Heritage', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Omaxe Panorama', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('MVL Coral', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('HFL Presidency Estate', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('BDI Sunshine City', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Trimont Rosewood', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Aqasia Enclave', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Ashiana Village', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Avalon Rangoli', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019'),
  ('Trehan Heights', 'Bhiwadi', 'Bhiwadi, Khairthal', 'Rajasthan', '301019')
on conflict (name) do nothing;


-- 3. CREATE PROFILES TABLE (Linked to Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  wallet_balance numeric(10,2) not null default 0.00,
  default_address_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 4. CREATE ADDRESSES TABLE
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  society_id uuid references public.societies(id) on delete restrict not null,
  flat_house_no text not null, -- Flat, floor, tower/building
  name text not null,          -- Recipient name for this address
  phone text not null,         -- Recipient phone number
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 5. CREATE PRODUCTS TABLE
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Vegetables', 'Fruits')),
  sub_category text,               -- e.g., 'Daily Veggies', 'Leafy Greens', 'Exotic'
  mrp numeric(10,2) not null,      -- Original price (e.g. 50.00)
  price numeric(10,2) not null,    -- Selling price (e.g. 38.00)
  unit text not null,              -- e.g., '500g', '1 kg', '1 pack'
  weight_range text,               -- e.g., '(400g-600g)', '(900-1100g)'
  stock integer not null default 0,
  image_url text,                  -- URL path to storage
  
  -- Premium Details
  description text,
  benefits text,
  storage_tips text,
  shelf_life text,
  origin text,
  
  is_flash_deal boolean default false,
  flash_deal_threshold numeric(10,2) default 0.00, -- "Shop for ₹X more to claim"
  
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 6. CREATE COUPONS TABLE
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'flat')),
  discount_value numeric(10,2) not null,
  min_order_value numeric(10,2) not null default 0.00,
  is_active boolean default true,
  expires_at timestamp with time zone
);


-- 7. CREATE ORDERS TABLE
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  total_amount numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0.00,
  delivery_fee numeric(10,2) not null default 0.00,
  platform_fee numeric(10,2) not null default 0.00,
  final_amount numeric(10,2) not null,
  
  payment_method text not null check (payment_method in ('UPI', 'COD', 'WALLET')),
  payment_status text not null check (payment_status in ('Pending', 'Completed', 'Failed')) default 'Pending',
  
  delivery_address text not null, -- Captured snapshot of address at checkout
  delivery_instructions text,
  ring_doorbell boolean default false,
  
  delivery_status text not null check (delivery_status in ('Pending', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled')) default 'Pending',
  delivery_slot text not null default 'Tomorrow 5:00 AM - 8:00 AM',
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 8. CREATE ORDER ITEMS TABLE
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,   -- Snapshot of product name at purchase
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null  -- Snapshot of price at purchase
);


-- 9. CREATE WALLET TRANSACTIONS TABLE
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null, -- Positive for add money, negative for pay order
  type text not null check (type in ('deposit', 'payment', 'refund')),
  reference_order_id uuid references public.orders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & TRIGGERS
-- ====================================================================

-- Trigger: Auto-create a Profile when a User signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, role, wallet_balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.phone,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    0.00
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.societies enable row level security;
alter table public.coupons enable row level security;

-- Profiles Policies
create policy "Allow public read of profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

-- Addresses Policies
create policy "Allow users to read own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "Allow users to insert own addresses" on public.addresses for insert with check (auth.uid() = user_id);
create policy "Allow users to update own addresses" on public.addresses for update using (auth.uid() = user_id);
create policy "Allow users to delete own addresses" on public.addresses for delete using (auth.uid() = user_id);

-- Products Policies (Anyone can read, only admin can write)
create policy "Allow public read of products" on public.products for select using (true);
create policy "Allow admin write of products" on public.products for all using (
  auth.role() = 'service_role' or (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ))
);

-- Orders Policies
create policy "Allow users to read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Allow users to create own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Allow admin read/write of all orders" on public.orders for all using (
  auth.role() = 'service_role' or (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ))
);

-- Order Items Policies
create policy "Allow users to read own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Allow users to create own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);

-- Societies Policies
create policy "Allow public read of societies" on public.societies for select using (true);
create policy "Allow admin edit of societies" on public.societies for all using (
  auth.role() = 'service_role' or (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ))
);
