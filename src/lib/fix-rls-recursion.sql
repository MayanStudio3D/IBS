-- 1. Criar função para verificar se o usuário é ADMIN sem disparar recursão de RLS
-- O SECURITY DEFINER faz a função rodar com privilégios de quem a criou (vignesh ou postgres), ignorando RLS interno
CREATE OR REPLACE FUNCTION public.ibs_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.ibs_perfis
    WHERE id = auth.uid() AND cargo = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpar e Recriar Políticas para ibs_perfis (RECURSÃO ZERO)
ALTER TABLE public.ibs_perfis DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.ibs_perfis;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.ibs_perfis;
DROP POLICY IF EXISTS "Admins podem gerenciar tudo" ON public.ibs_perfis;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.ibs_perfis
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins podem gerenciar perfis" ON public.ibs_perfis
FOR ALL USING (public.ibs_is_admin());

ALTER TABLE public.ibs_perfis ENABLE ROW LEVEL SECURITY;

-- 3. Limpar e Recriar Políticas para ibs_clientes
ALTER TABLE public.ibs_clientes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendedores veem seus clientes e ADMIN vê todos" ON public.ibs_clientes;

CREATE POLICY "Vendedores veem seus clientes e ADMIN vê todos" ON public.ibs_clientes
FOR ALL USING (
  auth.uid() = vendedor_id OR public.ibs_is_admin()
);
ALTER TABLE public.ibs_clientes ENABLE ROW LEVEL SECURITY;

-- 4. Limpar e Recriar Políticas para ibs_pedidos
ALTER TABLE public.ibs_pedidos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos;

CREATE POLICY "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos
FOR ALL USING (
  auth.uid() = vendedor_id OR public.ibs_is_admin()
);
ALTER TABLE public.ibs_pedidos ENABLE ROW LEVEL SECURITY;

-- 5. Limpar e Recriar Políticas para ibs_estoque
ALTER TABLE public.ibs_estoque DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos os funcionários veem estoque" ON public.ibs_estoque;
DROP POLICY IF EXISTS "Somente ADMIN altera estoque" ON public.ibs_estoque;

CREATE POLICY "Todos os funcionários veem estoque" ON public.ibs_estoque
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Somente ADMIN altera estoque" ON public.ibs_estoque
FOR ALL USING (public.ibs_is_admin());
ALTER TABLE public.ibs_estoque ENABLE ROW LEVEL SECURITY;
