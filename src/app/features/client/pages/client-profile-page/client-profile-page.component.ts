import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService, SupabaseService } from '../../../../core/services';
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
export class ClientProfilePageComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly avatarBucket = 'avatars';
  private readonly allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxAvatarSize = 2 * 1024 * 1024;
  private previewObjectUrl: string | null = null;

  readonly currentUser = this.authService.currentUser;
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly selectedAvatarFile = signal<File | null>(null);
  readonly avatarPreviewUrl = signal('');
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
        if (!this.selectedAvatarFile()) {
          this.avatarPreviewUrl.set(user.avatar_url ?? '');
        }

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

  ngOnDestroy(): void {
    this.revokePreviewObjectUrl();
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

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!file) {
      return;
    }

    if (!this.allowedAvatarTypes.includes(file.type)) {
      this.errorMessage.set('Usa una imagen JPG, PNG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > this.maxAvatarSize) {
      this.errorMessage.set('La imagen no debe pesar mas de 2 MB.');
      input.value = '';
      return;
    }

    this.selectedAvatarFile.set(file);
    this.revokePreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl.set(this.previewObjectUrl);
  }

  async uploadAvatar(): Promise<void> {
    const user = this.currentUser();
    const file = this.selectedAvatarFile();

    if (!user || !file) {
      return;
    }

    this.isUploadingAvatar.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const extension = this.getAvatarExtension(file);
    const path = `${user.id}/profile.${extension}`;

    try {
      await firstValueFrom(this.supabaseService.uploadStorageObject(this.avatarBucket, path, file));
      const avatarUrl = `${this.supabaseService.getPublicStorageUrl(this.avatarBucket, path)}?v=${Date.now()}`;

      await this.authService.updateCurrentUser({ avatar_url: avatarUrl });
      this.selectedAvatarFile.set(null);
      this.revokePreviewObjectUrl();
      this.avatarPreviewUrl.set(avatarUrl);
      this.successMessage.set('Tu foto de perfil se actualizo correctamente.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos subir tu foto de perfil.'));
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  getInitials(): string {
    const name = this.currentUser()?.full_name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  hasFieldError(controlName: string): boolean {
    return isFieldInvalid(this.form, controlName);
  }

  getFieldError(controlName: string): string {
    return getFieldErrorMessage(this.form, controlName, this.validationMessages[controlName] ?? {});
  }

  private getAvatarExtension(file: File): string {
    if (file.type === 'image/png') {
      return 'png';
    }

    if (file.type === 'image/webp') {
      return 'webp';
    }

    return 'jpg';
  }

  private revokePreviewObjectUrl(): void {
    if (!this.previewObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
