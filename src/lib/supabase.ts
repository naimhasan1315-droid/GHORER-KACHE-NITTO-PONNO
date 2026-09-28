import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, CATEGORY_IMAGES, HERO_IMAGE } from './constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: number;
  name: string;
  name_en: string | null;
  category: string;
  price: number;
  unit: string;
  image_url: string | null;
  description: string | null;
  in_stock: boolean;
};

export type CartItem = Product & { qty: number };

export type OrderRow = {
  id: number;
  customer_name: string;
  address: string;
  phone: string | null;
  total: number;
  payment_method: string;
  payment_ref: string | null;
  status: string;
  created_at: string;
};

export type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  qty: number;
};
