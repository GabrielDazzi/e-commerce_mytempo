// src/lib/initializeDatabase.ts
import { supabase, isSupabaseConfigured } from './supabase';

// SQL para criação da tabela products e da stored procedure
// Este SQL deve ser executado diretamente no seu painel Supabase
// ou através de uma migração. A função initializeDatabase abaixo
// apenas tenta chamar a stored procedure.

/*
-- Primeiro, crie a extensão se ainda não existir (geralmente já existe em projetos Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stored Procedure para criar a tabela products
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,                       -- snake_case
    stock INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    discount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- snake_case
    description_images TEXT[] DEFAULT '{}',      -- snake_case
    specification_images TEXT[] DEFAULT '{}',    -- snake_case
    delivery_images TEXT[] DEFAULT '{}',         -- snake_case
    allow_customization BOOLEAN DEFAULT false, -- snake_case
    colors TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '[]'::jsonb   -- Nova coluna para especificações dinâmicas
  );
END;
$$ LANGUAGE plpgsql;

-- (Opcional) Para permitir que o usuário anônimo (anon role) chame esta função,
-- você pode precisar conceder permissão, embora geralmente a inicialização
-- seja feita com um role mais privilegiado ou manualmente.
-- GRANT EXECUTE ON FUNCTION create_products_table() TO anon;
*/

// Esta função tenta chamar a stored procedure.
// A criação da tabela e da procedure em si deve ser feita no Supabase.
export const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Skipping database initialization: Supabase is not properly configured.');
    return;
  }

  try {
    // Tenta executar a stored procedure que cria a tabela products, se necessário.
    // Nota: A procedure 'create_products_table' precisa já existir no seu banco Supabase.
    const { error: rpcError } = await supabase.rpc('create_products_table');

    if (rpcError) {
      console.warn('Failed to execute create_products_table RPC. This is okay if the table already exists or was created manually. Error:', rpcError.message);
      // Você pode querer verificar se a tabela 'products' existe como um fallback
      // const { data, error: tableCheckError } = await supabase.from('products').select('id').limit(1);
      // if (tableCheckError) console.error('Error checking products table:', tableCheckError);
      // else console.log('Products table seems to exist.');
    } else {
      console.log('create_products_table RPC executed successfully (this does not guarantee table creation if it already existed, which is fine).');
    }

  } catch (error) {
    console.error('Error during database initialization attempt:', error);
  }
};