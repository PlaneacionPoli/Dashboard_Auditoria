-- Migración: tabla de diligenciamiento online de hallazgos
-- Ejecutar en: Supabase Studio > SQL Editor, o via CLI: supabase db query < este_archivo.sql

-- Tabla principal
create table if not exists public.hallazgos_diligencia (
    codigo_hallazgo        text        primary key,
    tipo_accion            text,
    accion_correctiva      text,
    correccion_descripcion text,
    mejora_descripcion     text,
    avance_porcentaje      smallint    check (avance_porcentaje between 0 and 100),
    tipo_validacion        text,
    resultado_validacion   text,
    updated_at             timestamptz not null default now()
);

-- Actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists hallazgos_diligencia_updated_at on public.hallazgos_diligencia;
create trigger hallazgos_diligencia_updated_at
    before update on public.hallazgos_diligencia
    for each row execute procedure public.set_updated_at();

-- Habilitar RLS
alter table public.hallazgos_diligencia enable row level security;

-- Política SELECT: cualquier visitante puede leer
create policy "anon_select"
    on public.hallazgos_diligencia
    for select
    to anon
    using (true);

-- Política INSERT: cualquier visitante puede insertar
create policy "anon_insert"
    on public.hallazgos_diligencia
    for insert
    to anon
    with check (true);

-- Política UPDATE: cualquier visitante puede actualizar
-- (para restringir por usuario en el futuro, reemplazar `true` por `auth.uid() = user_id`)
create policy "anon_update"
    on public.hallazgos_diligencia
    for update
    to anon
    using (true)
    with check (true);
