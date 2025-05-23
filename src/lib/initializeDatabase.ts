// src/lib/initializeDatabase.ts
import { supabase, isSupabaseConfigured } from './supabase';

// SQL para criação da tabela products e da stored procedure
// ESTE SQL DEVE SER EXECUTADO DIRETAMENTE NO SEU PAINEL SUPABASE SQL EDITOR
// OU ATRAVÉS DE UMA MIGRAÇÃO PARA GARANTIR QUE O ESQUEMA ESTEJA CORRETO.
// A função initializeDatabase abaixo apenas tenta chamar a stored procedure.

/*
-- Primeiro, crie a extensão se ainda não existir (geralmente já existe em projetos Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela products SE ELA NÃO EXISTIR, já com as colunas de imagens e novas flags de personalização
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  discount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description_images TEXT[] DEFAULT '{}',      -- Coluna para imagens da descrição
  specification_images TEXT[] DEFAULT '{}',    -- Coluna para imagens das especificações
  delivery_images TEXT[] DEFAULT '{}',         -- Coluna para imagens de entrega
  allow_customization BOOLEAN DEFAULT false,   -- Flag geral de personalização (pode ser mantida ou removida)
  allowcustomname BOOLEAN DEFAULT false,       -- NOVA FLAG para nome personalizado
  allowcustommodality BOOLEAN DEFAULT false,   -- NOVA FLAG para modalidade personalizada
  allowcustomcolorselection BOOLEAN DEFAULT false, -- NOVA FLAG para seleção de cor
  colors TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '[]'::jsonb
);

-- Se a tabela products JÁ EXISTE, garanta que as colunas de imagens e novas flags de personalização existam:
ALTER TABLE products
ADD COLUMN IF NOT EXISTS description_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specification_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allowcustomname BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowcustommodality BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowcustomcolorselection BOOLEAN DEFAULT false;


-- Stored Procedure para criar/alterar a tabela products
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    discount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description_images TEXT[] DEFAULT '{}',
    specification_images TEXT[] DEFAULT '{}',
    delivery_images TEXT[] DEFAULT '{}',
    allow_customization BOOLEAN DEFAULT false,
    allowcustomname BOOLEAN DEFAULT false,      -- NOVA FLAG
    allowcustommodality BOOLEAN DEFAULT false,  -- NOVA FLAG
    allowcustomcolorselection BOOLEAN DEFAULT false, -- NOVA FLAG
    colors TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '[]'::jsonb
  );

  -- Garante que as colunas de imagem e novas flags existam se a tabela já foi criada
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_images TEXT[] DEFAULT '{}';
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specification_images TEXT[] DEFAULT '{}';
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS delivery_images TEXT[] DEFAULT '{}';
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allowcustomname BOOLEAN DEFAULT false;
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allowcustommodality BOOLEAN DEFAULT false;
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allowcustomcolorselection BOOLEAN DEFAULT false;
END;
$$ LANGUAGE plpgsql;

-- (Opcional) Conceder permissão se for chamar via RPC pela role anon
-- GRANT EXECUTE ON FUNCTION create_products_table() TO anon;
*/

export const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Skipping database initialization: Supabase is not properly configured.');
    return;
  }

  try {
    // Tenta executar a stored procedure.
    // É crucial que a procedure 'create_products_table' exista no Supabase
    // E que a role utilizada tenha permissão para executá-la.
    // Se você configurou o schema manualmente, pode comentar esta chamada RPC.
    const { error: rpcError } = await supabase.rpc('create_products_table');

    if (rpcError) {
      console.warn('Failed to execute create_products_table RPC. This is okay if the table and columns already exist or were created/altered manually. Error:', rpcError.message);
    } else {
      console.log('create_products_table RPC executed or table schema already up-to-date.');
    }

  } catch (error) {
    console.error('Error during database initialization attempt:', error);
  }
};