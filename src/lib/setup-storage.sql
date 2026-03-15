-- Configurar Bucket para Materiais
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais', 'materiais', true) ON CONFLICT (id) DO NOTHING;

-- Limpar apólices antigas caso existam
DROP POLICY IF EXISTS "Todos podem visualizar fotos de materiais" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem enviar fotos de materiais" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir fotos de materiais" ON storage.objects;

-- Criar apolices para o storage (tabela de objetos)
CREATE POLICY "Todos podem visualizar fotos de materiais" ON storage.objects
FOR SELECT USING (bucket_id = 'materiais');

CREATE POLICY "Usuários autenticados podem enviar fotos de materiais" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'materiais' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar fotos de materiais" ON storage.objects
FOR UPDATE USING (bucket_id = 'materiais' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem excluir fotos de materiais" ON storage.objects
FOR DELETE USING (bucket_id = 'materiais' AND auth.uid() IS NOT NULL);
