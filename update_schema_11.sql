ALTER TABLE public.ibs_perfis ADD COLUMN IF NOT EXISTS telefone text;
CREATE TABLE IF NOT EXISTS public.ibs_configuracoes (
  id integer PRIMARY KEY DEFAULT 1,
  logo_url text,
  sistema_subtitulo text
);
INSERT INTO public.ibs_configuracoes (id, logo_url, sistema_subtitulo)
VALUES (1, '', 'IMPERIAL BARRA STONE')
ON CONFLICT (id) DO NOTHING;
