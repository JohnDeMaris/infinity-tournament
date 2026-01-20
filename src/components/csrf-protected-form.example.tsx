/**
 * Example: CSRF Protected Form Component
 *
 * This is an example showing how to create a CSRF-protected form
 * using the CSRF utilities.
 */

'use client';

import { CsrfTokenInput } from '@/hooks/useCsrfToken';
import { useActionState } from 'react';

// Example server action (would be in a separate actions.ts file)
// 'use server';
//
// import { withCsrfProtection } from '@/lib/csrf';
//
// async function submitFormInternal(prevState: any, formData: FormData) {
//   const name = formData.get('name') as string;
//   const email = formData.get('email') as string;
//
//   // Process form data...
//   return { success: true, message: 'Form submitted successfully!' };
// }
//
// export const submitForm = withCsrfProtection(submitFormInternal);

export function CsrfProtectedFormExample() {
  // In a real implementation, you would import the server action:
  // const [state, formAction] = useActionState(submitForm, null);

  return (
    <form className="space-y-4">
      {/* CSRF Token - automatically fetched and included */}
      <CsrfTokenInput />

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Submit
      </button>

      {/* Show success/error message */}
      {/* {state?.message && (
        <div className={state.success ? 'text-green-600' : 'text-red-600'}>
          {state.message}
        </div>
      )} */}
    </form>
  );
}

/**
 * Example: CSRF Protected Fetch Request
 */

export function CsrfProtectedFetchExample() {
  // const csrfHeaders = useCsrfHeaders();

  const handleSubmit = async () => {
    // if (!csrfHeaders) {
    //   console.error('CSRF token not ready');
    //   return;
    // }

    // const response = await fetch('/api/example', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...csrfHeaders,
    //   },
    //   body: JSON.stringify({ data: 'example' }),
    // });

    // const result = await response.json();
    // console.log(result);
  };

  return (
    <button
      onClick={handleSubmit}
      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Submit via Fetch
    </button>
  );
}
