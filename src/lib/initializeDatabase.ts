import { supabase, isSupabaseConfigured } from './supabase';

// Cria a tabela products, se ela ainda não existir
export const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Skipping database initialization: Supabase is not properly configured.');
    return;
  }

  try {
    // Executa a stored procedure que cria a tabela products, se necessário
    const { error: createError } = await supabase.rpc('create_products_table');

    if (createError) {
      console.warn('Failed to create products table, might need to run SQL setup manually:', createError);
    } else {
      console.log('Database initialized successfully');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// SQL para criação da tabela products:
/*
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  imageUrl TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  discount INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descriptionImages TEXT[] DEFAULT '{}',
  specificationImages TEXT[] DEFAULT '{}',
  deliveryImages TEXT[] DEFAULT '{}',
  allowCustomization BOOLEAN DEFAULT false,
  colors TEXT[] DEFAULT '{}'
);

-- Criação da stored procedure no Supabase
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
  -- Cria a extensão para geração de UUIDs, se necessário
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Cria a tabela products, se ainda não existir
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    imageUrl TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    discount INTEGER DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descriptionImages TEXT[] DEFAULT '{}',
    specificationImages TEXT[] DEFAULT '{}',
    deliveryImages TEXT[] DEFAULT '{}',
    allowCustomization BOOLEAN DEFAULT false,
    colors TEXT[] DEFAULT '{}'
  );
END;
$$ LANGUAGE plpgsql;
*/
