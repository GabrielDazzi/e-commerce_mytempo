
import { supabase } from './supabase';

// Create the products table if it doesn't exist
export const initializeDatabase = async () => {
  try {
    // Check if the products table exists
    const { data: existingTables, error: checkError } = await supabase
      .from('_realtime')
      .select('*');
    
    if (checkError) {
      console.warn('Failed to check if table exists, might need to run SQL setup manually:', checkError);
      return;
    }
    
    // Create products table if it doesn't exist
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

// SQL for creating the products table:
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

-- Create stored procedure for creating the table
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
  -- Create extension for UUID generation if it doesn't exist
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Create the products table if it doesn't exist
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
