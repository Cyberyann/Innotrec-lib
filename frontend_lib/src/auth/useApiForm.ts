import { useCallback, useState } from 'react';
import { ApiError, type FieldErrors } from '../api/client';

/** Small helper for forms calling the API: submitting flag + global / field errors. */
export function useApiForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const reset = useCallback(() => {
    setError(null);
    setErrorCode(undefined);
    setFieldErrors({});
  }, []);

  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      reset();
      setSubmitting(true);
      try {
        return await action();
      } catch (err) {
        if (err instanceof ApiError) {
          setFieldErrors(err.fieldErrors);
          setErrorCode(err.code);
          if (Object.keys(err.fieldErrors).length === 0 || err.fieldErrors.non_field_errors) {
            setError(err.message);
          }
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
        return undefined;
      } finally {
        setSubmitting(false);
      }
    },
    [reset],
  );

  const fieldError = useCallback(
    (name: string) => fieldErrors[name]?.join(' ') || undefined,
    [fieldErrors],
  );

  return { submitting, error, errorCode, fieldErrors, fieldError, run, reset, setError };
}
