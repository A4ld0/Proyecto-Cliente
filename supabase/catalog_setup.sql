create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  image_url text not null,
  materials text[] not null default '{}',
  colors text[] not null default '{}',
  price_from numeric not null default 0,
  delivery text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_products enable row level security;

create policy "Anyone can read active catalog products"
on public.catalog_products
for select
to anon, authenticated
using (
  is_active = true
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
);

create policy "Admins can manage catalog products"
on public.catalog_products
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
);

create policy "Anyone can read catalog product images"
on storage.objects
for select
to public
using (bucket_id = 'catalog-products');

create policy "Admins can upload catalog product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catalog-products'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
);

create policy "Admins can update catalog product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catalog-products'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
)
with check (
  bucket_id = 'catalog-products'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
  )
);
