import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isConfigured = this.authService.isConfigured;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    full_name: {
      required: 'Ingresa el nombre del cliente.',
      minlength: 'El nombre debe tener al menos 3 caracteres.',
      maxlength: 'El nombre no debe exceder 80 caracteres.'
    },
    email: {
      required: 'Ingresa el correo.',
      email: 'Escribe un correo valido.'
    },
    password: {
      required: 'Ingresa la contraseña.',
      minlength: 'La contraseña debe tener al menos 8 caracteres.',
      pattern: 'Usa al menos una letra y un numero.'
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
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      ]
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[0-9+\s()-]{7,20}$/), Validators.maxLength(20)]
    })
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.register({
        ...this.form.getRawValue(),
        role: 'CLIENT'
      });

      const hasSession = !!this.authService.currentUser();
      await this.router.navigateByUrl(hasSession ? '/client/dashboard' : '/login');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos crear tu cuenta.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  signInWithGoogle(): void {
    this.errorMessage.set('');
    this.authService.signInWithGoogle();
  }

  hasFieldError(controlName: string): boolean {
    return isFieldInvalid(this.form, controlName);
  }

  getFieldError(controlName: string): string {
    return getFieldErrorMessage(this.form, controlName, this.validationMessages[controlName] ?? {});
  }
}
