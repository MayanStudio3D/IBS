import { supabase } from './supabase';

/**
 * Lógica de dedução de estoque para a IBS.
 * Esta função localiza o material pelo nome (ignorando case) e subtrai a metragem.
 */
export async function processarBaixaEstoque(pedidoId: string) {
  try {
    // 1. Buscar os itens do pedido
    const { data: itens, error: itensErr } = await supabase
      .from('ibs_pedido_itens')
      .select('descricao, m2_total')
      .eq('pedido_id', pedidoId);

    if (itensErr || !itens) throw itensErr || new Error('Itens não encontrados');

    for (const item of itens) {
      // 2. Localizar o material no estoque (busca por nome exato ou similar)
      const { data: material, error: matErr } = await supabase
        .from('ibs_estoque')
        .select('id, m2_saldo, nome')
        .ilike('nome', `%${item.descricao.trim()}%`)
        .single();

      if (matErr || !material) {
        console.warn(`Material "${item.descricao}" não encontrado no estoque para baixa.`);
        continue;
      }

      const novoSaldo = Number(material.m2_saldo) - Number(item.m2_total);

      // 3. Atualizar saldo no estoque
      const { error: updErr } = await supabase
        .from('ibs_estoque')
        .update({ 
          m2_saldo: novoSaldo,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', material.id);

      if (updErr) throw updErr;

      // 4. Registrar log da movimentação
      const { error: logErr } = await supabase
        .from('ibs_estoque_movimentos')
        .insert({
          material_id: material.id,
          tipo: 'SAIDA',
          quantidade: item.m2_total,
          pedido_id: pedidoId,
          observacao: `Saída automática pelo Pedido ${pedidoId.substring(0,8)}`
        });

      if (logErr) throw logErr;

      console.log(`Baixa de estoque processada: ${material.nome} (-${item.m2_total} $m^2$)`);
    }

    return { success: true };
  } catch (err) {
    console.error('Erro ao processar baixa de estoque:', err);
    return { success: false, error: err };
  }
}

/**
 * Lógica de estorno de estoque para a IBS.
 * Esta função localiza o material pelo nome (ignorando case) e readiciona a metragem do pedido.
 */
export async function estornarBaixaEstoque(pedidoId: string) {
  try {
    // 1. Buscar os itens do pedido
    const { data: itens, error: itensErr } = await supabase
      .from('ibs_pedido_itens')
      .select('descricao, m2_total')
      .eq('pedido_id', pedidoId);

    if (itensErr || !itens) throw itensErr || new Error('Itens não encontrados');

    for (const item of itens) {
      // 2. Localizar o material no estoque
      const { data: material, error: matErr } = await supabase
        .from('ibs_estoque')
        .select('id, m2_saldo, nome')
        .ilike('nome', `%${item.descricao.trim()}%`)
        .single();

      if (matErr || !material) {
        console.warn(`Material "${item.descricao}" não encontrado no estoque para estorno.`);
        continue;
      }

      const novoSaldo = Number(material.m2_saldo) + Number(item.m2_total);

      // 3. Atualizar saldo no estoque
      const { error: updErr } = await supabase
        .from('ibs_estoque')
        .update({ 
          m2_saldo: novoSaldo,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', material.id);

      if (updErr) throw updErr;

      // 4. Registrar log da movimentação (ESTORNO)
      const { error: logErr } = await supabase
        .from('ibs_estoque_movimentos')
        .insert({
          material_id: material.id,
          tipo: 'ENTRADA',
          quantidade: item.m2_total,
          pedido_id: pedidoId,
          observacao: `Estorno de Pedido Cancelado/Revertido ${pedidoId.substring(0,8)}`
        });

      if (logErr) throw logErr;

      console.log(`Estorno de estoque processado: ${material.nome} (+${item.m2_total} $m^2$)`);
    }

    return { success: true };
  } catch (err) {
    console.error('Erro ao processar estorno de estoque:', err);
    return { success: false, error: err };
  }
}

/**
 * Adiciona matéria-prima ao sistema.
 */
export async function adicionarMateriaPrima(materialId: string, quantidade: number, observacao: string) {
  try {
    const { data: material, error: fetchErr } = await supabase
      .from('ibs_estoque')
      .select('m2_saldo')
      .eq('id', materialId)
      .single();

    if (fetchErr) throw fetchErr;

    const novoSaldo = Number(material.m2_saldo) + quantidade;

    await supabase
      .from('ibs_estoque')
      .update({ m2_saldo: novoSaldo, atualizado_em: new Date().toISOString() })
      .eq('id', materialId);

    await supabase
      .from('ibs_estoque_movimentos')
      .insert({
        material_id: materialId,
        tipo: 'ENTRADA',
        quantidade: quantidade,
        observacao: observacao
      });

    return { success: true };
  } catch (err) {
    console.error('Erro ao adicionar matéria-prima:', err);
    return { success: false, error: err };
  }
}
