import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import cases from '../../../../tests/data/registration-cases.json';
import { mount } from '../../../testing/fixtures';
import { AuthService } from '../../core/services';
import { User } from '../../interfaces';
import { RegisterPageComponent } from './pages/register-page/register-page.component';

describe('RF-01: particiones y límites de registro con datos externos', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(cases)('$id', async ({ field, value, repeat, valid, error }) => {
    const register = vi.fn().mockResolvedValue(undefined);
    const fixture = await mount(RegisterPageComponent, [
      {
        provide: AuthService,
        useValue: { isConfigured: signal(true), currentUser: signal<User | null>(null), register }
      }
    ]);
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const page = fixture.componentInstance;
    const input = {
      full_name: 'Cliente Uno', email: 'cliente1@example.test', password: 'Prueba123', phone: '',
      [field]: repeat === undefined ? value : value.repeat(repeat)
    };
    page.form.setValue(input);

    expect(page.form.valid).toBe(valid);
    await page.submit();

    if (valid) {
      expect(register).toHaveBeenCalledExactlyOnceWith({ ...input, role: 'CLIENT' });
      expect(navigateByUrl).toHaveBeenCalledExactlyOnceWith('/login');
    } else {
      expect(page.form.get(field)?.hasError(error!)).toBe(true);
      expect(page.form.get(field)?.touched).toBe(true);
      expect(register).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    }
  });
});
