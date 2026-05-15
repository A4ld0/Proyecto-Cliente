import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CatalogService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { CatalogProduct, CatalogProductPayload } from '../../../../interfaces';

@Component({
  selector: 'app-admin-catalog-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-catalog-page.component.html',
  styleUrl: './admin-catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCatalogPageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSize = 5 * 1024 * 1024;

  readonly products = signal<CatalogProduct[]>([]);
  readonly editingProduct = signal<CatalogProduct | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(90)]
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
    }),
    materials: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    colors: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price_from: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    delivery: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)]
    }),
    tags: new FormControl('', { nonNullable: true }),
    is_active: new FormControl(true, { nonNullable: true })
  });

  constructor() {
    void this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.products.set(await firstValueFrom(this.catalogService.list()));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar el catalogo.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  editProduct(product: CatalogProduct): void {
    this.editingProduct.set(product);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(product.image_url);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.form.patchValue({
      name: product.name,
      category: product.category,
      description: product.description,
      materials: product.materials.join(', '),
      colors: product.colors.join(', '),
      price_from: product.price_from,
      delivery: product.delivery,
      tags: product.tags.join(', '),
      is_active: product.is_active
    });
  }

  resetForm(): void {
    this.editingProduct.set(null);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set('');
    this.form.reset({
      name: '',
      category: '',
      description: '',
      materials: '',
      colors: '',
      price_from: 0,
      delivery: '',
      tags: '',
      is_active: true
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!file) {
      return;
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      this.errorMessage.set('Usa imagenes JPG, PNG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > this.maxImageSize) {
      this.errorMessage.set('La imagen no debe pesar mas de 5 MB.');
      input.value = '';
      return;
    }

    this.selectedImageFile.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.editingProduct() && !this.selectedImageFile()) {
      this.errorMessage.set('Selecciona una imagen para crear el producto.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const editingProduct = this.editingProduct();
      const productId = editingProduct?.id ?? crypto.randomUUID();
      const imageUrl = await this.resolveImageUrl(productId, editingProduct?.image_url ?? '');
      const payload = this.buildPayload(imageUrl);

      if (editingProduct) {
        await firstValueFrom(this.catalogService.update(editingProduct.id, payload));
        this.successMessage.set('Producto actualizado correctamente.');
      } else {
        await firstValueFrom(this.catalogService.create({ ...payload, image_url: imageUrl }));
        this.successMessage.set('Producto creado correctamente.');
      }

      this.resetForm();
      await this.loadProducts();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar el producto.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteProduct(product: CatalogProduct): Promise<void> {
    if (!window.confirm(`Deseas eliminar "${product.name}" del catalogo?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await firstValueFrom(this.catalogService.delete(product.id));
      this.successMessage.set('Producto eliminado correctamente.');
      await this.loadProducts();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos eliminar el producto.'));
    }
  }

  private async resolveImageUrl(productId: string, currentImageUrl: string): Promise<string> {
    const file = this.selectedImageFile();

    if (!file) {
      return currentImageUrl;
    }

    const upload = this.catalogService.uploadProductImageWithUrl(productId, file);
    await firstValueFrom(upload.request);
    return `${upload.url}?v=${Date.now()}`;
  }

  private buildPayload(imageUrl: string): CatalogProductPayload {
    const rawValue = this.form.getRawValue();

    return {
      name: rawValue.name,
      category: rawValue.category,
      description: rawValue.description,
      image_url: imageUrl,
      materials: this.parseList(rawValue.materials),
      colors: this.parseList(rawValue.colors),
      price_from: Number(rawValue.price_from),
      delivery: rawValue.delivery,
      tags: this.parseList(rawValue.tags),
      is_active: rawValue.is_active
    };
  }

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
