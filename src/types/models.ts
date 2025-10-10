export type Role = 'admin' | 'cashier' | 'finance';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
  password_hash?: string; // only in DB
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  price: number;
  tax_code?: string | null;
  barcode?: string | null;
  is_active: boolean;
  stock_qty: number;
  created_at: string; // ISO
  updated_at: string; // ISO
  image_url?: string | null; // URL publik untuk 1 gambar utama
  images?: string[];   
}

export interface SaleItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  line_discount_amount?: number;
  line_total: number;
}

export interface Sale {
  id: string;
  invoice_no: string;
  date: string; // dd/MM/YYYY (Jakarta)
  time: string; // HH:mm:ss (Jakarta)
  branch_id?: string | null; // default JKT-01
  cashier_id: string;
  cashier_name: string;
  items: SaleItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: string; // qris, edc_debit
  payment_ref?: string | null;
  qris_payload?: string | null;
  qris_acquirer?: string | null;
  qris_rrn?: string | null;
  edc_issuer?: string | null;
  edc_approval_code?: string | null;
  status: 'PAID' | 'VOID' | 'REFUND' | 'FAILED';
  created_at: string; // ISO
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  user: Omit<User, 'password_hash'>;
}
