export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atendimentos_assistidos: {
        Row: {
          criado_em: string
          id: string
          mp_payment_id: string | null
          observacoes: string | null
          peca_id: string | null
          status: string
          status_pagamento: string
          tipo: string
          usuario_id: string
          valor: number | null
        }
        Insert: {
          criado_em?: string
          id?: string
          mp_payment_id?: string | null
          observacoes?: string | null
          peca_id?: string | null
          status?: string
          status_pagamento?: string
          tipo: string
          usuario_id: string
          valor?: number | null
        }
        Update: {
          criado_em?: string
          id?: string
          mp_payment_id?: string | null
          observacoes?: string | null
          peca_id?: string | null
          status?: string
          status_pagamento?: string
          tipo?: string
          usuario_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_assistidos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_assistidos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          avaliado_id: string | null
          avaliador_id: string
          comentario: string | null
          criado_em: string
          id: string
          nota: number
          tipo_alvo: string
          transacao_id: string
        }
        Insert: {
          avaliado_id?: string | null
          avaliador_id: string
          comentario?: string | null
          criado_em?: string
          id?: string
          nota: number
          tipo_alvo: string
          transacao_id: string
        }
        Update: {
          avaliado_id?: string | null
          avaliador_id?: string
          comentario?: string | null
          criado_em?: string
          id?: string
          nota?: number
          tipo_alvo?: string
          transacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_avaliado_id_fkey"
            columns: ["avaliado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback: {
        Row: {
          criado_em: string
          id: string
          origem: string
          usado: boolean
          usuario_id: string
          valido_ate: string
          valor: number
        }
        Insert: {
          criado_em?: string
          id?: string
          origem: string
          usado?: boolean
          usuario_id: string
          valido_ate: string
          valor: number
        }
        Update: {
          criado_em?: string
          id?: string
          origem?: string
          usado?: boolean
          usuario_id?: string
          valido_ate?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashback_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cliques_compartilhamento: {
        Row: {
          compartilhamento_id: string
          criado_em: string
          id: string
        }
        Insert: {
          compartilhamento_id: string
          criado_em?: string
          id?: string
        }
        Update: {
          compartilhamento_id?: string
          criado_em?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliques_compartilhamento_compartilhamento_id_fkey"
            columns: ["compartilhamento_id"]
            isOneToOne: false
            referencedRelation: "compartilhamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          criado_em: string
          id: string
          paga: boolean
          parceira_id: string
          percentual: number
          tipo: string
          transacao_id: string
          valor: number
        }
        Insert: {
          criado_em?: string
          id?: string
          paga?: boolean
          parceira_id: string
          percentual: number
          tipo: string
          transacao_id: string
          valor: number
        }
        Update: {
          criado_em?: string
          id?: string
          paga?: boolean
          parceira_id?: string
          percentual?: number
          tipo?: string
          transacao_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_parceira_id_fkey"
            columns: ["parceira_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      compartilhamentos: {
        Row: {
          criado_em: string
          id: string
          peca_id: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          peca_id?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          peca_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compartilhamentos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compartilhamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncias_banimento: {
        Row: {
          avisos: number
          banido_em: string | null
          criado_em: string
          evidencia: string | null
          id: string
          motivo: string
          vendedora_id: string
        }
        Insert: {
          avisos?: number
          banido_em?: string | null
          criado_em?: string
          evidencia?: string | null
          id?: string
          motivo: string
          vendedora_id: string
        }
        Update: {
          avisos?: number
          banido_em?: string | null
          criado_em?: string
          evidencia?: string | null
          id?: string
          motivo?: string
          vendedora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "denuncias_banimento_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          criado_em: string
          id: string
          peca_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          peca_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          peca_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          reserva_id: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          reserva_id?: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          reserva_id?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          cor: string
          criado_em: string
          descricao: string
          dono_id: string
          estado: string
          exclusividade: boolean
          foto_editorial_aprovada: boolean
          foto_editorial_url: string | null
          fotos_originais: string[]
          fotos_tratadas: string[]
          id: string
          medida_busto_cm: number | null
          medida_cintura_cm: number | null
          medida_comprimento_cm: number | null
          medida_quadril_cm: number | null
          motivo_reprovacao: string | null
          preco_anunciado: number
          status: string
          tamanho: string
          tecido: string | null
          tipo: string
          venda_assistida: boolean
          video_url: string | null
        }
        Insert: {
          cor: string
          criado_em?: string
          descricao: string
          dono_id: string
          estado: string
          exclusividade?: boolean
          foto_editorial_aprovada?: boolean
          foto_editorial_url?: string | null
          fotos_originais?: string[]
          fotos_tratadas?: string[]
          id?: string
          medida_busto_cm?: number | null
          medida_cintura_cm?: number | null
          medida_comprimento_cm?: number | null
          medida_quadril_cm?: number | null
          motivo_reprovacao?: string | null
          preco_anunciado: number
          status?: string
          tamanho: string
          tecido?: string | null
          tipo: string
          venda_assistida?: boolean
          video_url?: string | null
        }
        Update: {
          cor?: string
          criado_em?: string
          descricao?: string
          dono_id?: string
          estado?: string
          exclusividade?: boolean
          foto_editorial_aprovada?: boolean
          foto_editorial_url?: string | null
          fotos_originais?: string[]
          fotos_tratadas?: string[]
          id?: string
          medida_busto_cm?: number | null
          medida_cintura_cm?: number | null
          medida_comprimento_cm?: number | null
          medida_quadril_cm?: number | null
          motivo_reprovacao?: string | null
          preco_anunciado?: number
          status?: string
          tamanho?: string
          tecido?: string | null
          tipo?: string
          venda_assistida?: boolean
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_dono_id_fkey"
            columns: ["dono_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          compartilhamento_id: string | null
          compradora_id: string
          criado_em: string
          id: string
          locacao_fim: string | null
          locacao_inicio: string | null
          peca_id: string
          prazo_confirmacao: string
          status: string
          termos_aceitos: boolean
          termos_versao: string | null
          valor_aceito: number | null
          valor_proposta: number | null
        }
        Insert: {
          compartilhamento_id?: string | null
          compradora_id: string
          criado_em?: string
          id?: string
          locacao_fim?: string | null
          locacao_inicio?: string | null
          peca_id: string
          prazo_confirmacao?: string
          status?: string
          termos_aceitos?: boolean
          termos_versao?: string | null
          valor_aceito?: number | null
          valor_proposta?: number | null
        }
        Update: {
          compartilhamento_id?: string | null
          compradora_id?: string
          criado_em?: string
          id?: string
          locacao_fim?: string | null
          locacao_inicio?: string | null
          peca_id?: string
          prazo_confirmacao?: string
          status?: string
          termos_aceitos?: boolean
          termos_versao?: string | null
          valor_aceito?: number | null
          valor_proposta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_compartilhamento_id_fkey"
            columns: ["compartilhamento_id"]
            isOneToOne: false
            referencedRelation: "compartilhamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_compradora_id_fkey"
            columns: ["compradora_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          cashback_utilizado: number
          contato_liberado_em: string | null
          criado_em: string
          estornado_em: string | null
          estornado_por: string | null
          estorno_motivo: string | null
          id: string
          mp_payment_id: string | null
          percentual_taxa: number
          reserva_id: string
          status_pagamento: string
          usar_cashback_solicitado: boolean
          valor_base: number
          valor_taxa: number
        }
        Insert: {
          cashback_utilizado?: number
          contato_liberado_em?: string | null
          criado_em?: string
          estornado_em?: string | null
          estornado_por?: string | null
          estorno_motivo?: string | null
          id?: string
          mp_payment_id?: string | null
          percentual_taxa: number
          reserva_id: string
          status_pagamento?: string
          usar_cashback_solicitado?: boolean
          valor_base: number
          valor_taxa: number
        }
        Update: {
          cashback_utilizado?: number
          contato_liberado_em?: string | null
          criado_em?: string
          estornado_em?: string | null
          estornado_por?: string | null
          estorno_motivo?: string | null
          id?: string
          mp_payment_id?: string | null
          percentual_taxa?: number
          reserva_id?: string
          status_pagamento?: string
          usar_cashback_solicitado?: boolean
          valor_base?: number
          valor_taxa?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: true
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          auth_user_id: string | null
          banido_em: string | null
          cidade: string | null
          criado_em: string
          id: string
          nome: string
          papel: string[]
          pix: string | null
          recrutado_por: string | null
          whatsapp: string
        }
        Insert: {
          auth_user_id?: string | null
          banido_em?: string | null
          cidade?: string | null
          criado_em?: string
          id?: string
          nome: string
          papel?: string[]
          pix?: string | null
          recrutado_por?: string | null
          whatsapp: string
        }
        Update: {
          auth_user_id?: string | null
          banido_em?: string | null
          cidade?: string | null
          criado_em?: string
          id?: string
          nome?: string
          papel?: string[]
          pix?: string | null
          recrutado_por?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_recrutado_por_fkey"
            columns: ["recrutado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirmar_pagamento_atendimento: {
        Args: { p_atendimento_id: string }
        Returns: {
          criado_em: string
          id: string
          mp_payment_id: string | null
          observacoes: string | null
          peca_id: string | null
          status: string
          status_pagamento: string
          tipo: string
          usuario_id: string
          valor: number | null
        }
      }
      iniciar_pagamento_pix_atendimento: {
        Args: { p_atendimento_id: string; p_mp_payment_id: string }
        Returns: {
          criado_em: string
          id: string
          mp_payment_id: string | null
          observacoes: string | null
          peca_id: string | null
          status: string
          status_pagamento: string
          tipo: string
          usuario_id: string
          valor: number | null
        }
      }
      confirmar_pagamento_taxa: {
        Args: { p_transacao_id: string; p_usar_cashback?: boolean }
        Returns: {
          cashback_utilizado: number
          contato_liberado_em: string | null
          criado_em: string
          id: string
          mp_payment_id: string | null
          percentual_taxa: number
          reserva_id: string
          status_pagamento: string
          usar_cashback_solicitado: boolean
          valor_base: number
          valor_taxa: number
        }
      }
      current_usuario_id: { Args: Record<PropertyKey, never>; Returns: string }
      expirar_reservas_vencidas: { Args: Record<PropertyKey, never>; Returns: number }
      iniciar_pagamento_pix: {
        Args: { p_mp_payment_id: string; p_transacao_id: string; p_usar_cashback?: boolean }
        Returns: {
          cashback_utilizado: number
          contato_liberado_em: string | null
          criado_em: string
          id: string
          mp_payment_id: string | null
          percentual_taxa: number
          reserva_id: string
          status_pagamento: string
          usar_cashback_solicitado: boolean
          valor_base: number
          valor_taxa: number
        }
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      periodos_ocupados: {
        Args: { p_peca_id: string }
        Returns: { locacao_fim: string; locacao_inicio: string }[]
      }
      piso_percentual: { Args: { p_criado_em: string }; Returns: number }
      registrar_denuncia: {
        Args: { p_evidencia?: string; p_motivo: string; p_vendedora_id: string }
        Returns: {
          avisos: number
          banido_em: string | null
          criado_em: string
          evidencia: string | null
          id: string
          motivo: string
          vendedora_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
