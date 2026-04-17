import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { USER_ROLE_LABELS, USER_ROLES } from '../../../../core/constants/printlab.constants';
import { AuthService, UsersService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import { User, UserPayload, UserRole } from '../../../../interfaces';

@Component({
  selector: 'app-admin-users-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersPageComponent {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly users = signal<User[]>([]);
  readonly roles = USER_ROLES;
  readonly roleLabels = USER_ROLE_LABELS;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    full_name: {
      required: 'Ingresa el nombre.',
      minlength: 'El nombre debe tener al menos 3 caracteres.',
      maxlength: 'El nombre no debe exceder 80 caracteres.'
    },
    email: {
      required: 'Ingresa el correo.',
      email: 'Escribe un correo valido.'
    },
    role: {
      required: 'Selecciona un rol.'
    },
    phone: {
      pattern: 'Escribe un telefono valido.',
      maxlength: 'El telefono no debe exceder 20 caracteres.'
    },
    is_active: {
      required: 'Selecciona el estado.'
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
    role: new FormControl('CLIENT', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[0-9+\s()-]{7,20}$/), Validators.maxLength(20)]
    }),
    is_active: new FormControl(true, { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const users = await firstValueFrom(this.usersService.list());
      this.users.set(users);

      if (users.length) {
        const selected = users.find((user) => user.id === this.editingId()) ?? users[0];
        this.editUser(selected);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar los usuarios.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  editUser(user: User): void {
    this.editingId.set(user.id);
    this.successMessage.set('');
    this.form.patchValue({
      full_name: user.full_name,
      email: user.email ?? '',
      role: user.role,
      phone: user.phone ?? '',
      is_active: user.is_active
    });
  }

  resetForm(): void {
    const current = this.users().find((user) => user.id === this.editingId()) ?? this.users()[0];

    if (current) {
      this.editUser(current);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.editingId()) {
      this.errorMessage.set(
        'Los perfiles se crean desde Supabase Auth. Aqui solo puedes editar perfiles existentes.'
      );
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawValue = this.form.getRawValue();
    const payload: UserPayload = {
      full_name: rawValue.full_name,
      email: rawValue.email,
      role: rawValue.role as UserRole,
      phone: rawValue.phone || null,
      is_active: rawValue.is_active
    };

    try {
      if (this.currentUser()?.id === this.editingId()) {
        await this.authService.updateCurrentUser(payload);
      } else {
        await firstValueFrom(this.usersService.update(this.editingId()!, payload));
      }

      this.successMessage.set('El perfil se actualizo correctamente.');
      await this.loadUsers();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar el perfil.'));
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
