import { signal } from '@angular/core';
import { of } from 'rxjs';
import { admin, client, failure, fileSelected, mount, product } from '../../../testing/fixtures';
import { AuthService, CatalogService, UsersService } from '../../core/services';
import { AdminCatalogPageComponent } from './pages/admin-catalog-page/admin-catalog-page.component';
import { AdminUsersPageComponent } from './pages/admin-users-page/admin-users-page.component';

describe('Administración del catálogo', () => {
  afterEach(() => vi.restoreAllMocks());

  async function open() {
    const catalog = {
      list: vi.fn(() => of([product])),
      create: vi.fn(() => of([product])),
      update: vi.fn(() => of([product])),
      delete: vi.fn(() => of([product])),
      uploadProductImageWithUrl: vi.fn(() => ({
        request: of({}),
        url: product.image_url
      }))
    };
    const fixture = await mount(AdminCatalogPageComponent, [{ provide: CatalogService, useValue: catalog }]);
    return { page: fixture.componentInstance, catalog };
  }

  it('exige un formulario válido y una imagen, normaliza listas y publica el producto', async () => {
    const { page, catalog } = await open();
    expect(page.products()).toEqual([product]);
    await page.submit();
    expect(page.form.controls.name.touched).toBe(true);
    expect(catalog.create).not.toHaveBeenCalled();

    page.form.patchValue({
      name: product.name, category: product.category, description: product.description,
      materials: 'PLA, , PETG ', colors: ' Negro, Blanco', price_from: product.price_from,
      delivery: product.delivery, tags: ', oficina,'
    });
    await page.submit();
    expect(page.errorMessage()).toContain('Selecciona una imagen');

    const file = new File(['image'], 'organizador.png', { type: 'image/png' });
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: () => 'blob:preview' }));
    try {
      page.onImageSelected(fileSelected(file));
      expect(page.imagePreviewUrl()).toBe('blob:preview');
      await page.submit();
    } finally {
      vi.unstubAllGlobals();
    }

    expect(catalog.uploadProductImageWithUrl).toHaveBeenCalledWith(expect.any(String), file);
    expect(catalog.create).toHaveBeenCalledWith(expect.objectContaining({
      materials: product.materials, colors: product.colors, tags: product.tags,
      image_url: expect.stringContaining(product.image_url)
    }));
    expect(page.selectedImageFile()).toBeNull();
    expect(page.successMessage()).toContain('creado correctamente');
  });

  it('rechaza imágenes no admitidas o demasiado grandes', async () => {
    const { page } = await open();
    page.onImageSelected(fileSelected());
    expect(page.selectedImageFile()).toBeNull();
    page.onImageSelected(fileSelected(new File(['pdf'], 'file.pdf', { type: 'application/pdf' })));
    expect(page.errorMessage()).toContain('JPG, PNG o WEBP');
    const largeImage = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.webp', { type: 'image/webp' });
    page.onImageSelected(fileSelected(largeImage));
    expect(page.errorMessage()).toContain('5 MB');
    expect(page.selectedImageFile()).toBeNull();
  });

  it('edita un producto sin volver a subir la imagen y maneja los fallos de guardado', async () => {
    const { page, catalog } = await open();
    page.editProduct(product);
    page.form.controls.is_active.setValue(false);
    catalog.update.mockReturnValueOnce(failure('Actualización rechazada'));
    await page.submit();
    expect(page.errorMessage()).toBe('Actualización rechazada');
    expect(page.editingProduct()).toBe(product);
    expect(page.isSaving()).toBe(false);
    await page.submit();
    expect(catalog.update).toHaveBeenLastCalledWith(product.id, expect.objectContaining({
      image_url: product.image_url, is_active: false
    }));
    expect(catalog.uploadProductImageWithUrl).not.toHaveBeenCalled();
    expect(page.successMessage()).toContain('actualizado correctamente');
  });

  it('elimina después de confirmar y presenta fallos de borrado o de consulta', async () => {
    const { page, catalog } = await open();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    await page.deleteProduct(product);
    expect(catalog.delete).not.toHaveBeenCalled();
    catalog.delete.mockReturnValueOnce(failure('Eliminación rechazada'));
    await page.deleteProduct(product);
    expect(page.errorMessage()).toBe('Eliminación rechazada');
    catalog.list.mockReturnValueOnce(of([]));
    await page.deleteProduct(product);
    expect(catalog.delete).toHaveBeenCalledWith(product.id);
    expect(page.products()).toEqual([]);
    catalog.list.mockReturnValueOnce(failure('Consulta rechazada'));
    await page.loadProducts();
    expect(page.errorMessage()).toBe('Consulta rechazada');
    expect(page.isLoading()).toBe(false);
  });
});

describe('Administración de usuarios', () => {
  async function open() {
    const users = {
      list: vi.fn(() => of([client, admin])),
      update: vi.fn(() => of([client]))
    };
    const updateCurrentUser = vi.fn().mockResolvedValue(admin);
    const fixture = await mount(AdminUsersPageComponent, [
      { provide: UsersService, useValue: users },
      { provide: AuthService, useValue: { currentUser: signal(admin), updateCurrentUser } }
    ]);
    return { page: fixture.componentInstance, users, updateCurrentUser };
  }

  it('valida el teléfono y actualiza otro perfil sin tocar la sesión del administrador', async () => {
    const { page, users, updateCurrentUser } = await open();
    expect(page.selectedUser()).toBe(client);
    page.form.controls.phone.setValue('invalido');
    await page.submit();
    expect(page.hasFieldError('phone')).toBe(true);
    expect(page.getFieldError('phone')).toContain('telefono');
    expect(page.getFieldError('unknown')).toBe('');
    expect(users.update).not.toHaveBeenCalled();
    page.form.patchValue({ phone: '+52 123 456 7890', role: 'ADMIN' });
    await page.submit();
    expect(users.update).toHaveBeenCalledWith(client.id, expect.objectContaining({
      phone: '+52 123 456 7890', role: 'ADMIN', is_active: true
    }));
    expect(updateCurrentUser).not.toHaveBeenCalled();
    expect(page.isSaving()).toBe(false);
  });

  it('guarda el propio perfil mediante AuthService y restablece el formulario desde el usuario', async () => {
    const { page, users, updateCurrentUser } = await open();
    page.editUser({ ...admin, phone: '12345678' });
    expect(page.form.controls.phone.value).toBe('12345678');
    page.resetForm();
    expect(page.form.controls.phone.value).toBe('');
    await page.submit();
    expect(updateCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN', phone: null }));
    expect(users.update).not.toHaveBeenCalled();
  });

  it('solo actualiza perfiles conocidos y muestra errores de escritura o lectura', async () => {
    const { page, users } = await open();
    users.update.mockReturnValueOnce(failure('Escritura rechazada'));
    await page.submit();
    expect(page.errorMessage()).toBe('Escritura rechazada');
    page.editingId.set('desconocido');
    await page.submit();
    expect(page.errorMessage()).toContain('Selecciona un perfil');
    page.editingId.set(null);
    await page.submit();
    expect(page.errorMessage()).toContain('Supabase Auth');
    users.list.mockReturnValueOnce(of([]));
    await page.loadUsers();
    page.resetForm();
    expect(page.selectedUser()).toBeNull();
    users.list.mockReturnValueOnce(failure('Consulta rechazada'));
    await page.loadUsers();
    expect(page.errorMessage()).toBe('Consulta rechazada');
    expect(page.isLoading()).toBe(false);
  });
});
