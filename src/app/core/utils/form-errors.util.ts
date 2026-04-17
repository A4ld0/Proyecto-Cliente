import { AbstractControl, FormGroup } from '@angular/forms';

export type ValidationMessages = Record<string, string>;

function getControl(form: FormGroup, controlName: string): AbstractControl | null {
  return form.get(controlName);
}

export function isFieldInvalid(form: FormGroup, controlName: string): boolean {
  const control = getControl(form, controlName);
  return !!control && control.invalid && (control.touched || control.dirty);
}

export function getFieldErrorMessage(
  form: FormGroup,
  controlName: string,
  messages: ValidationMessages,
  fallback = 'Revisa este campo.'
): string {
  const control = getControl(form, controlName);

  if (!control?.errors || (!control.touched && !control.dirty)) {
    return '';
  }

  for (const [errorKey, message] of Object.entries(messages)) {
    if (control.hasError(errorKey)) {
      return message;
    }
  }

  return fallback;
}
