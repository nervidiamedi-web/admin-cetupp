/**
 * Supabase Database Type Definitions
 * Exact representation of the existing database tables:
 * - dashboard_admins
 * - orders
 * - order_items
 * - products
 */

export interface Product {
  id: string; // uuid
  slug: string;
  name: string;
  category: string;
  size: string | null;
  badge: string | null;
  description: string | null;
  price: number; // in LKR (e.g. 9900)
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string; // uuid
  created_at: string;
  status: OrderStatus;
  total: number;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
}

export interface OrderItem {
  id: number; // bigint
  order_id: string; // uuid FK -> orders.id
  product_id: string; // uuid FK -> products.id
  quantity: number;
  unit_price: number;
  product_name: string;
  subtotal: number;
  products?: Product | null;
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

export interface DashboardAdmin {
  user_id: string; // uuid FK -> auth.users.id
  created_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  lowStockProducts: number;
}
