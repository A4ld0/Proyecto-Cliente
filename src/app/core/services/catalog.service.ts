import { Injectable, inject } from '@angular/core';
import { CatalogProduct, CatalogProductPayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'catalog_products';
  private readonly bucket = 'catalog-products';

  list(options?: { activeOnly?: boolean }) {
    return this.supabase.select<CatalogProduct>(this.table, {
      filters: options?.activeOnly ? [{ column: 'is_active', value: true }] : undefined,
      order: { column: 'created_at', ascending: false }
    });
  }

  create(payload: CatalogProductPayload) {
    return this.supabase.insert<CatalogProduct>(this.table, payload);
  }

  update(id: string, payload: Partial<CatalogProductPayload>) {
    return this.supabase.update<CatalogProduct>(this.table, payload, [{ column: 'id', value: id }]);
  }

  delete(id: string) {
    return this.supabase.delete<CatalogProduct>(this.table, [{ column: 'id', value: id }]);
  }

  uploadProductImage(productId: string, file: File) {
    return this.supabase.uploadStorageObject(
      this.bucket,
      `${productId}/${Date.now()}.${this.getImageExtension(file)}`,
      file
    );
  }

  getProductImageUrl(productId: string, file: File): string {
    const path = `${productId}/${Date.now()}.${this.getImageExtension(file)}`;
    return this.supabase.getPublicStorageUrl(this.bucket, path);
  }

  uploadProductImageWithUrl(productId: string, file: File) {
    const path = `${productId}/${Date.now()}.${this.getImageExtension(file)}`;

    return {
      request: this.supabase.uploadStorageObject(this.bucket, path, file),
      url: this.supabase.getPublicStorageUrl(this.bucket, path)
    };
  }

  private getImageExtension(file: File): string {
    if (file.type === 'image/png') {
      return 'png';
    }

    if (file.type === 'image/webp') {
      return 'webp';
    }

    return 'jpg';
  }
}
