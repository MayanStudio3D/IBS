ALTER TABLE public.ibs_pedido_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendedores veem seus itens e ADMIN vê todos" ON public.ibs_pedido_itens;
DROP POLICY IF EXISTS "Permitir INSERT em itens de pedido do usuário" ON public.ibs_pedido_itens;

CREATE POLICY "Vendedores veem seus itens e ADMIN vê todos" ON public.ibs_pedido_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ibs_pedidos
    WHERE ibs_pedidos.id = ibs_pedido_itens.pedido_id
    AND (ibs_pedidos.vendedor_id = auth.uid() OR public.ibs_is_admin())
  )
);

CREATE POLICY "Permitir INSERT em itens de pedido do usuário" ON public.ibs_pedido_itens
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ibs_pedidos
    WHERE ibs_pedidos.id = ibs_pedido_itens.pedido_id
    AND (ibs_pedidos.vendedor_id = auth.uid() OR public.ibs_is_admin())
  )
);

CREATE POLICY "Permitir UPDATE em itens de pedido do usuário" ON public.ibs_pedido_itens
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.ibs_pedidos
    WHERE ibs_pedidos.id = ibs_pedido_itens.pedido_id
    AND (ibs_pedidos.vendedor_id = auth.uid() OR public.ibs_is_admin())
  )
);

CREATE POLICY "Permitir DELETE em itens de pedido do usuário" ON public.ibs_pedido_itens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.ibs_pedidos
    WHERE ibs_pedidos.id = ibs_pedido_itens.pedido_id
    AND (ibs_pedidos.vendedor_id = auth.uid() OR public.ibs_is_admin())
  )
);
