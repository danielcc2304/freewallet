// Server-only building block. Not an HTTP endpoint: callers must authenticate
// the Supabase hook signature BEFORE passing its payload here.
export interface AuthEmailPayload {
  user: { email?: string; new_email?: string };
  email_data: {
    email_action_type: string;
    token?: string;
    token_hash?: string;
    token_new?: string;
    token_hash_new?: string;
    redirect_to?: string;
  };
}

export interface AuthEmailConfig {
  supabaseUrl: string;
  defaultRedirect: string;
  allowedRedirects: readonly string[];
}

export interface Mail {
  recipient: string;
  subject: string;
  text: string;
}

const subjects: Record<string, string> = {
  signup: 'Confirma tu cuenta de FreeWallet',
  invite: 'Tu invitación a FreeWallet',
  recovery: 'Restablece tu contraseña de FreeWallet',
  magiclink: 'Accede a FreeWallet',
  email_change: 'Confirma el cambio de correo de FreeWallet',
  reauthentication: 'Confirma tu identidad en FreeWallet',
};

function required(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) {
    throw new Error('Invalid auth email payload');
  }
  return value;
}

function recipient(value: unknown): string {
  const address = required(value);
  if (address.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) {
    throw new Error('Invalid auth email recipient');
  }
  return address;
}

export function buildAuthEmails(payload: AuthEmailPayload, config: AuthEmailConfig): Mail[] {
  const data = payload.email_data;
  const action = required(data.email_action_type);
  if (!Object.hasOwn(subjects, action)) throw new Error('Unsupported auth email action');
  // Never use site_url from the incoming payload as the verification host.
  const base = new URL(config.supabaseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('Invalid Supabase verification URL');
  }
  const redirect = data.redirect_to || config.defaultRedirect;
  if (!config.allowedRedirects.includes(redirect)) throw new Error('Unapproved auth redirect');
  const makeMail = (address: unknown, hash?: string): Mail => {
    const to = recipient(address);
    let instruction: string;
    if (action === 'reauthentication') {
      const code = required(data.token);
      if (!/^\d{6,10}$/.test(code)) throw new Error('Invalid verification code');
      instruction = `Tu código de verificación es: ${code}`;
    } else {
      const url = new URL('/auth/v1/verify', base);
      url.searchParams.set('token', required(hash));
      url.searchParams.set('type', action);
      url.searchParams.set('redirect_to', redirect);
      instruction = `Para continuar, abre este enlace:\n${url.href}`;
    }
    return {
      recipient: to,
      subject: subjects[action],
      text: `${instruction}\n\nSi no has solicitado esta acción, no compartas el código ni el enlace y puedes ignorar este mensaje.\n\nFreeWallet`,
    };
  };
  if (action === 'email_change') {
    // Supabase's hashes have counterintuitive names: token_hash_new goes
    // to the CURRENT email, token_hash to the NEW email.
    const mails = [makeMail(payload.user.new_email, data.token_hash)];
    if (data.token_hash_new) mails.unshift(makeMail(payload.user.email, data.token_hash_new));
    return mails;
  }
  return [makeMail(payload.user.email, data.token_hash)];
}

export async function sendOutlookMail(
  mail: Mail,
  accessToken: string,
  transport: typeof fetch = fetch,
): Promise<void> {
  required(accessToken);
  if (typeof mail.text !== 'string' || !mail.text.trim() || mail.text.length > 20000) {
    throw new Error('Invalid auth email body');
  }
  const response = await transport('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: required(mail.subject),
        body: { contentType: 'Text', content: mail.text },
        toRecipients: [{ emailAddress: { address: recipient(mail.recipient) } }],
      },
      saveToSentItems: false,
    }),
    signal: AbortSignal.timeout(5000),
    redirect: 'error',
  });
  // Do not log response bodies, credentials, OTPs, recipient or signed links.
  // No automatic retries: an uncertain result could already have sent mail.
  if (response.status !== 202) throw new Error(`Outlook rejected auth email (${response.status})`);
  // 202 means accepted for processing, NOT verified inbox delivery.
}
