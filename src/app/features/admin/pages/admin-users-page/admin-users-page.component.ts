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
    name: {
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
    organization: {
      maxlength: 'La organizacion no debe exceder 80 caracteres.'
    }
  };

  readonly form = new FormGroup({
    name: new FormControl('', {
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
    organization: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)]
    })
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
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? '',
      organization: user.organization ?? ''
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      email: '',
      role: 'CLIENT',
      phone: '',
      organization: ''
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

    const rawValue = this.form.getRawValue();
    const payload: UserPayload = {
      ...rawValue,
      role: rawValue.role as UserRole
    };

    try {
      if (this.editingId()) {
        if (this.currentUser()?.id === this.editingId()) {
          await this.authService.updateCurrentUser(payload);
        } else {
          await firstValueFrom(this.usersService.update(this.editingId()!, payload));
        }

        this.successMessage.set('El perfil se actualizo correctamente.');
      } else {
        await firstValueFrom(this.usersService.create(payload));
        this.successMessage.set('El perfil se creo correctamente.');
      }

      this.resetForm();
      await this.loadUsers();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar el perfil.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteUser(user: User): Promise<void> {
    if (this.currentUser()?.id === user.id) {
      this.errorMessage.set('No puedes eliminar tu propio perfil desde esta vista.');
      return;
    }

    if (!window.confirm(`¿Deseas eliminar el perfil de "${user.name}"?`)) {
      return;
    }

    try {
      await firstValueFrom(this.usersService.delete(user.id));
      this.successMessage.set('El perfil se elimino correctamente.');

      if (this.editingId() === user.id) {
        this.resetForm();
      }

      await this.loadUsers();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos eliminar el perfil.'));
    }
  }

  hasFieldError(controlName: string): boolean {
    return isFieldInvalid(this.form, controlName);
  }

  getFieldError(controlName: string): string {
    return getFieldErrorMessage(this.form, controlName, this.validationMessages[controlName] ?? {});
  }
}
