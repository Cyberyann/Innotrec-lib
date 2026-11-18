/**
 * Full-stack scenario against the docker-compose deployment (nginx + Django + Postgres).
 * E-mails are captured by Mailpit (deploy/docker-compose.yml, "dev" profile).
 *
 *   docker compose -f deploy/docker-compose.yml --profile dev up -d --build
 *   npm run test:e2e:stack -w innotrec-sample-frontend
 */
import { expect, test, type APIRequestContext } from '@playwright/test';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025';
const PASSWORD = 'Stack-Passw0rd-42';

async function lastMailTo(
  request: APIRequestContext,
  email: string,
  subjectPart: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await request.get(`${MAILPIT}/api/v1/search`, {
      params: { query: `to:"${email}"` },
    });
    const { messages } = (await search.json()) as {
      messages: Array<{ ID: string; Subject: string }>;
    };
    const match = messages.find((m) => m.Subject.includes(subjectPart));
    if (match) {
      const message = await request.get(`${MAILPIT}/api/v1/message/${match.ID}`);
      return ((await message.json()) as { Text: string }).Text;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No "${subjectPart}" e-mail for ${email}`);
}

test('register → verify → login → notes → e-mail 2FA → delete account', async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
  await page.getByRole('textbox', { name: 'Confirm password', exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByText(/Check your e-mail/)).toBeVisible();

  const verifyMail = await lastMailTo(request, email, 'confirm your e-mail');
  const verifyLink = verifyMail.match(/https?:\/\/\S+\/verify-email\/\S+/)![0];
  await page.goto(new URL(verifyLink).pathname);
  await expect(page.getByText(/is verified/)).toBeVisible();

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();

  await page.getByRole('link', { name: 'Notes' }).click();
  await page.getByRole('button', { name: 'New note' }).click();
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Stack note');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: 'Stack note', exact: true })).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('button', { name: 'Receive codes by e-mail' }).click();
  const setupMail = await lastMailTo(request, email, 'verification code');
  await page
    .getByRole('textbox', { name: 'Verification code', exact: true })
    .fill(setupMail.match(/code is: (\d+)/)![1]!);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByText('Two-factor authentication enabled.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('We sent a 6-digit code')).toBeVisible();
  // wait for the newest code (a second "verification code" mail)
  await expect
    .poll(async () => {
      const res = await request.get(`${MAILPIT}/api/v1/search`, {
        params: { query: `to:"${email}" subject:"verification code"` },
      });
      return ((await res.json()) as { messages: unknown[] }).messages.length;
    })
    .toBeGreaterThanOrEqual(2);
  const loginMail = await lastMailTo(request, email, 'verification code');
  await page
    .getByRole('textbox', { name: 'Verification code', exact: true })
    .fill(loginMail.match(/code is: (\d+)/)![1]!);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('textbox', { name: 'Password' }).last().fill(PASSWORD);
  await page.getByRole('button', { name: 'Delete my account permanently' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
