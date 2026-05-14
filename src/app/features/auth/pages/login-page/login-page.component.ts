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
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isConfigured = this.authService.isConfigured;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    email: {
      required: 'Ingresa tu correo.',
      email: 'Escribe un correo valido.'
    },
    password: {
      required: 'Ingresa tu contraseña.',
      minlength: 'La contraseña debe tener al menos 6 caracteres.'
    }
  };

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    })
  });

  constructor() {
    const oauthError = sessionStorage.getItem('printlab.oauthError');

    if (oauthError) {
      this.errorMessage.set(oauthError);
      sessionStorage.removeItem('printlab.oauthError');
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const user = await this.authService.signIn(
        this.form.controls.email.getRawValue(),
        this.form.controls.password.getRawValue()
      );

      await this.router.navigateByUrl(
        user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
      );
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos iniciar tu sesion.'));
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
