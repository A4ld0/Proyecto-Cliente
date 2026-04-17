import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';

@Component({
  selector: 'app-client-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './client-profile-page.component.html',
  styleUrl: './client-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientProfilePageComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    full_name: {
      required: 'Ingresa tu nombre.',
      minlength: 'El nombre debe tener al menos 3 caracteres.',
      maxlength: 'El nombre no debe exceder 80 caracteres.'
    },
    phone: {
      pattern: 'Escribe un telefono valido.',
      maxlength: 'El telefono no debe exceder 20 caracteres.'
    }
  };

  readonly form = new FormGroup({
    full_name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)]
    }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[0-9+\s()-]{7,20}$/), Validators.maxLength(20)]
    }),
    is_active: new FormControl({ value: true, disabled: true }, { nonNullable: true }),
    role: new FormControl({ value: '', disabled: true }, { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();

      if (user) {
        this.form.patchValue({
          full_name: user.full_name,
          email: user.email ?? '',
          phone: user.phone ?? '',
          is_active: user.is_active,
          role: user.role
        });
      }
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.updateCurrentUser({
        full_name: this.form.controls.full_name.getRawValue(),
        phone: this.form.controls.phone.getRawValue()
      });

      this.successMessage.set('Tus datos se actualizaron correctamente.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar tus cambios.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  hasFieldError(controlName: string): boolean {
    return isFieldInvalid(this.form, controlName);
  }

  getFieldError(controlName: string): string {
    return getFieldErrorMessage(this.form, controlName, this.validationMessages[controlName] ?? {});
  }
}
