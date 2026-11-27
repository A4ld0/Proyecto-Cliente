import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage } from './api-error.util';

describe('getApiErrorMessage', () => {
  it.each(['message', 'msg', 'error_description'])(
    'extrae el mensaje de Supabase desde %s',
    (field) => {
      const error = new HttpErrorResponse({
        status: 400,
        error: { [field]: 'No se pudo guardar la solicitud.' }
      });

      expect(getApiErrorMessage(error)).toBe('No se pudo guardar la solicitud.');
    }
  );

  it('usa el mensaje HTTP cuando la respuesta no contiene uno de Supabase', () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });

    expect(getApiErrorMessage(error)).toBe(error.message);
  });

  it('conserva el mensaje de un Error y usa el alternativo para un valor desconocido', () => {
    expect(getApiErrorMessage(new Error('Sesión expirada.'))).toBe('Sesión expirada.');
    expect(getApiErrorMessage(null, 'Intenta de nuevo.')).toBe('Intenta de nuevo.');
  });
});
