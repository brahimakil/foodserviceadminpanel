export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  price?: number;
  isBestSeller: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logo?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  type: 'hero' | 'section' | 'sidebar' | 'footer';
  page: 'home' | 'products' | 'about' | 'contact' | 'all';
  position: string;
  isActive: boolean;
  order: number;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

export interface PDFCatalog {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  coverPage?: string; // Image URL for cover page
  backPage?: string;  // Image URL for back page
  categories: PDFCategoryOrder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PDFCategoryOrder {
  categoryId: string;
  categoryName: string;
  order: number;
  startNewPage: boolean;
  products: PDFProductOrder[];
}

export interface PDFProductOrder {
  productId: string;
  productTitle: string;
  order: number;
  includeInCatalog: boolean;
}
