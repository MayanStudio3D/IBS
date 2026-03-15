import { supabase } from './supabase';

export type UserRole = 'ADMIN' | 'VENDEDOR';

export interface UserProfile {
  id: string;
  nome_completo: string;
  cargo: UserRole;
}

/**
 * Busca o papel do usuário na tabela ibs_perfis.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('ibs_perfis')
      .select('cargo')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('Perfil não encontrado para o usuário, assumindo VENDEDOR:', error?.message);
      return 'VENDEDOR';
    }

    return data.cargo as UserRole;
  } catch (err) {
    console.error('Erro ao buscar cargo do usuário:', err);
    return 'VENDEDOR';
  }
}
