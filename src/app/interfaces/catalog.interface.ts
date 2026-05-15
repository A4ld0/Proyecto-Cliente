export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  materials: string[];
  colors: string[];
  price_from: number;
  delivery: string;
  tags: string[];
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CatalogProductPayload {
  name: string;
  category: string;
  description: string;
  image_url: string;
  materials: string[];
  colors: string[];
  price_from: number;
  delivery: string;
  tags: string[];
  is_active: boolean;
}
