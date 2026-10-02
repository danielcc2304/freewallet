import assert from 'node:assert/strict';
import { buildAuthEmails, sendOutlookMail } from '../supabase/mail/outlook';
import type { AuthEmailPayload } from '../supabase/mail/outlook';

const config = {
  supabaseUrl: 'https://example.supabase.co',
  defaultRedirect: 'https://freewallet.example/account',
  allowedRedirects: ['https://freewallet.example/account', 'https://freewallet.example/admin/news'],
};
const payload: AuthEmailPayload = {
  user: { email: 'old@example.com', new_email: 'new@example.com' },
  email_data: { email_action_type: 'recovery', token_hash: 'test-hash', token: '123456' },
};
for (const action of ['signup', 'invite', 'recovery', 'magiclink']) {
  const [mail] = buildAuthEmails({ ...payload, email_data: { ...payload.email_data, email_action_type: action } }, config);
  assert.equal(mail.recipient, 'old@example.com');
  const link = new URL(mail.text.split('\n')[1]);
  assert.equal(link.origin, config.supabaseUrl);
  assert.equal(link.searchParams.get('type'), action);
  assert.equal(link.searchParams.get('token'), 'test-hash');
  assert.equal(link.searchParams.get('redirect_to'), config.defaultRedirect);
}
const changed = { ...payload, email_data: { ...payload.email_data, email_action_type: 'email_change', token_hash_new: 'old-hash' } };
const dual = buildAuthEmails(changed, config);
assert.equal(dual.length, 2);
assert.equal(dual[0].recipient, 'old@example.com');
assert.ok(dual[0].text.includes('token=old-hash'));
assert.equal(dual[1].recipient, 'new@example.com');
assert.ok(dual[1].text.includes('token=test-hash'));
assert.equal(buildAuthEmails({ ...changed, email_data: { ...changed.email_data, token_hash_new: '' } }, config).length, 1);
assert.ok(buildAuthEmails({ ...payload, email_data: { ...payload.email_data, email_action_type: 'reauthentication' } }, config)[0].text.includes('123456'));
assert.throws(() => buildAuthEmails({ ...payload, email_data: { ...payload.email_data, redirect_to: 'https://evil.example/account' } }, config));
assert.throws(() => buildAuthEmails(payload, { ...config, supabaseUrl: 'http://example.supabase.co' }));
assert.throws(() => buildAuthEmails({ ...payload, user: { email: 'a@example.com\r\nBcc: b@example.com' } }, config));
assert.throws(() => buildAuthEmails({ ...payload, email_data: { email_action_type: 'recovery' } }, config));
assert.throws(() => buildAuthEmails({ ...payload, email_data: { email_action_type: 'unknown' } }, config));
const [mail] = buildAuthEmails(payload, config);
let calls = 0;
const transport: typeof fetch = async (url, init) => {
  calls++;
  assert.equal(url, 'https://graph.microsoft.com/v1.0/me/sendMail');
  assert.equal(init?.headers && (init.headers as Record<string, string>).Authorization, 'Bearer fake-token');
  const body = JSON.parse(String(init?.body));
  assert.equal(body.message.body.contentType, 'Text');
  assert.equal(body.message.toRecipients.length, 1);
  assert.equal(body.saveToSentItems, false);
  assert.equal(init?.redirect, 'error');
  return new Response(null, { status: 202 });
};
await sendOutlookMail(mail, 'fake-token', transport);
assert.equal(calls, 1);
for (const status of [200, 401, 403, 429, 500]) {
  let attempts = 0;
  await assert.rejects(sendOutlookMail(mail, 'fake-token', async () => {
    attempts++;
    return new Response('private-provider-error', { status });
  }), new RegExp(`\\(${status}\\)`));
  assert.equal(attempts, 1);
}
console.log('Outlook mail: templates, secure email change, redirect validation and mocked Graph transport OK. No real emails sent.');
