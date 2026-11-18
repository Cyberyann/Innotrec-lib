import { expect, test } from '@playwright/test';
import { MockBackend } from './mockBackend';

const PASSWORD = 'Correct-Horse-9';

test.describe('authentication', () => {
  let backend: MockBackend;

  test.beforeEach(async ({ page }) => {
    backend = new MockBackend();
    await backend.install(page);
  });

  test('redirects to login, signs in, then back to the requested page', async ({ page }) => {
    backend.addUser({ email: 'alice@example.com', password: PASSWORD, first_name: 'Alice' });
    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('alice@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole('heading', { name: 'My notes' })).toBeVisible();
    // every unsafe call carried the CSRF header (otherwise the mock answers 403)
    expect(backend.requests).toContain('POST /auth/login/');
  });

  test('shows an error on bad credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ghost@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('nope');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid e-mail or password.');
  });

  test('two-factor login with an e-mail code', async ({ page }) => {
    backend.addUser({
      email: 'bob@example.com',
      password: PASSWORD,
      two_factor_method: 'email',
      first_name: 'Bob',
    });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('bob@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('We sent a 6-digit code')).toBeVisible();
    await page.getByRole('textbox', { name: 'Verification code', exact: true }).fill('000000');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid code.');
    await page
      .getByRole('textbox', { name: 'Verification code', exact: true })
      .fill(backend.lastEmailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByRole('heading', { name: /Hello Bob/ })).toBeVisible();
  });

  test('registration, e-mail verification link, then login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('new@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('short');
    await page.getByRole('textbox', { name: 'Confirm password', exact: true }).fill('short');
    await page.getByRole('button', { name: 'Create my account' }).click();
    await expect(page.getByText(/too short/)).toBeVisible();

    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('textbox', { name: 'Confirm password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await expect(page.getByText(/Check your e-mail/)).toBeVisible();

    const user = backend.users.find((u) => u.email === 'new@example.com')!;
    await page.goto(`/verify-email/${user.id}/valid-token`);
    await expect(page.getByText(/is verified/)).toBeVisible();
    await page.getByRole('link', { name: 'Sign in' }).last().click();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('new@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: /Hello new@example.com/ })).toBeVisible();
  });

  test('forgot password then reset with the e-mailed link', async ({ page }) => {
    const user = backend.addUser({ email: 'carol@example.com', password: 'Old-password-1' });
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('carol@example.com');
    await page.getByRole('button', { name: 'Send the link' }).click();
    await expect(page.getByText(/a reset link has been sent/)).toBeVisible();

    await page.goto(`/reset-password/${user.id}/valid-token`);
    await page.getByRole('textbox', { name: 'New password', exact: true }).fill(PASSWORD);
    await page.getByRole('textbox', { name: 'Confirm password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Change my password' }).click();
    await expect(page.getByText(/Your password has been changed/)).toBeVisible();
    expect(user.password).toBe(PASSWORD);
  });

  test('enable e-mail 2FA from the profile, then log out', async ({ page }) => {
    backend.addUser({ email: 'dave@example.com', password: PASSWORD });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('dave@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('link', { name: 'enable two-factor authentication' }).click();
    await page.getByRole('button', { name: 'Receive codes by e-mail' }).click();
    await page
      .getByRole('textbox', { name: 'Verification code', exact: true })
      .fill(backend.lastEmailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('Two-factor authentication enabled.')).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});

test.describe('application', () => {
  test('creates a note and sees it in the chart', async ({ page }) => {
    const backend = new MockBackend();
    await backend.install(page);
    backend.addUser({ email: 'erin@example.com', password: PASSWORD });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('erin@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.getByRole('link', { name: 'Notes' }).click();
    await page.getByRole('button', { name: 'New note' }).click();
    const dialog = page.getByRole('dialog', { name: 'New note' });
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Buy milk');
    await dialog.getByRole('combobox', { name: 'Category' }).selectOption('personal');
    await dialog.getByRole('textbox', { name: 'Content', exact: true }).fill('2 bottles');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: 'Buy milk', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('img', { name: 'Notes per category' })).toBeVisible();
  });

  test('staff users see the user management page', async ({ page }) => {
    const backend = new MockBackend();
    await backend.install(page);
    backend.addUser({ email: 'admin@example.com', password: PASSWORD, is_staff: true });
    backend.addUser({ email: 'someone@example.com', password: PASSWORD });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('admin@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(
      page.getByRole('cell', { name: 'someone@example.com', exact: true }),
    ).toBeVisible();
  });
});
