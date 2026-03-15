-- Garantir que as tabelas IBS tenham RLS ativo e políticas restritas
ALTER TABLE public.ibs_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibs_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibs_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibs_pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibs_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas para ibs_perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.ibs_perfis;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.ibs_perfis
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.ibs_perfis;
CREATE POLICY "Admins podem ver todos os perfis" ON public.ibs_perfis
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ibs_perfis 
    WHERE id = auth.uid() AND cargo = 'ADMIN'
  )
);

-- Políticas para ibs_estoque
DROP POLICY IF EXISTS "Todos os funcionários veem estoque" ON public.ibs_estoque;
CREATE POLICY "Todos os funcionários veem estoque" ON public.ibs_estoque
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Somente ADMIN altera estoque" ON public.ibs_estoque;
CREATE POLICY "Somente ADMIN altera estoque" ON public.ibs_estoque
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ibs_perfis 
    WHERE id = auth.uid() AND cargo = 'ADMIN'
  )
);

-- Políticas para ibs_clientes
DROP POLICY IF EXISTS "Vendedores veem seus clientes e ADMIN vê todos" ON public.ibs_clientes;
CREATE POLICY "Vendedores veem seus clientes e ADMIN vê todos" ON public.ibs_clientes
FOR ALL USING (
  auth.uid() = vendedor_id OR 
  EXISTS (
    SELECT 1 FROM public.ibs_perfis 
    WHERE id = auth.uid() AND cargo = 'ADMIN'
  )
);

-- Políticas para ibs_pedidos
DROP POLICY IF EXISTS "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos;
CREATE POLICY "Vendedores veem seus pedidos e ADMIN vê todos" ON public.ibs_pedidos
FOR ALL USING (
  auth.uid() = vendedor_id OR 
  EXISTS (
    SELECT 1 FROM public.ibs_perfis 
    WHERE id = auth.uid() AND cargo = 'ADMIN'
  )
);
