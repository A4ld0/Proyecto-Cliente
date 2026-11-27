import { FormControl, FormGroup, Validators } from '@angular/forms';
import { getFieldErrorMessage, isFieldInvalid } from './form-errors.util';

describe('mensajes de validación de formularios', () => {
  const messages = { required: 'Ingresa un título.', minlength: 'Usa al menos tres caracteres.' };

  function createForm() {
    return new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  it('oculta errores antes de que el usuario interactúe con el campo', () => {
    const form = createForm();

    expect(isFieldInvalid(form, 'title')).toBe(false);
    expect(getFieldErrorMessage(form, 'title', messages)).toBe('');
  });

  it('muestra el mensaje del validador que falla después de tocar el campo', () => {
    const form = createForm();
    form.controls.title.markAsTouched();

    expect(isFieldInvalid(form, 'title')).toBe(true);
    expect(getFieldErrorMessage(form, 'title', messages)).toBe(messages.required);

    form.controls.title.setValue('AB');
    expect(getFieldErrorMessage(form, 'title', messages)).toBe(messages.minlength);

    form.controls.title.setValue('Pieza');
    expect(isFieldInvalid(form, 'title')).toBe(false);
    expect(getFieldErrorMessage(form, 'title', messages)).toBe('');
  });

  it('usa el mensaje alternativo si el error de un campo modificado no tiene traducción', () => {
    const form = createForm();
    form.controls.title.markAsDirty();

    expect(isFieldInvalid(form, 'title')).toBe(true);
    expect(getFieldErrorMessage(form, 'title', {}, 'Revisa el título.')).toBe('Revisa el título.');
  });

  it('tolera un campo que no existe', () => {
    const form = createForm();

    expect(isFieldInvalid(form, 'description')).toBe(false);
    expect(getFieldErrorMessage(form, 'description', messages)).toBe('');
  });
});
