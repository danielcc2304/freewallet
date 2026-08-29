import { createClient } from 'npm:@supabase/supabase-js@2';

function readSupabaseKey(legacyName: string, bundledName: string): string {
    const legacyKey = Deno.env.get(legacyName)?.trim();
    if (legacyKey) {
        return legacyKey;
    }

    try {
        const bundledKeys = JSON.parse(Deno.env.get(bundledName) ?? '{}') as Record<string, unknown>;
        const defaultKey = bundledKeys.default;
        return typeof defaultKey === 'string' ? defaultKey.trim() : '';
    } catch {
        return '';
    }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = readSupabaseKey('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS');
const serviceRoleKey = readSupabaseKey('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS');
const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');
const allowedOrigins = new Set(
    [appUrl, ...(Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',')]
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean),
);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCorsHeaders(request: Request): HeadersInit {
    const requestOrigin = request.headers.get('origin') ?? appUrl;
    const origin = allowedOrigins.has(requestOrigin) ? requestOrigin : appUrl;

    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        Vary: 'Origin',
    };
}

function jsonResponse(request: Request, body: Record<string, unknown>, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...getCorsHeaders(request),
            'Content-Type': 'application/json',
        },
    });
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(request) });
    }

    if (request.method !== 'POST') {
        return jsonResponse(request, { error: 'Método no permitido.' }, 405);
    }

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !appUrl) {
        return jsonResponse(request, { error: 'La función de invitaciones no está configurada.' }, 500);
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return jsonResponse(request, { error: 'Necesitas una sesión editorial activa.' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
        return jsonResponse(request, { error: 'La sesión editorial no es válida.' }, 401);
    }

    const { data: isOwner, error: ownerError } = await userClient.rpc('is_news_owner');
    if (ownerError || isOwner !== true) {
        return jsonResponse(request, { error: 'Solo el propietario puede invitar editores.' }, 403);
    }

    let body: { email?: unknown };
    try {
        body = await request.json() as { email?: unknown };
    } catch {
        return jsonResponse(request, { error: 'La petición no contiene un JSON válido.' }, 400);
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const ownerEmail = userData.user.email?.trim().toLowerCase();
    if (!emailPattern.test(email)) {
        return jsonResponse(request, { error: 'Introduce un correo electrónico válido.' }, 400);
    }

    if (email === ownerEmail || email === 'daniel230401@gmail.com') {
        return jsonResponse(request, { error: 'La cuenta propietaria ya tiene acceso editorial.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingMembership, error: membershipLookupError } = await adminClient
        .from('news_admins')
        .select('status')
        .eq('email', email)
        .maybeSingle();

    if (membershipLookupError) {
        return jsonResponse(request, { error: 'No se pudo comprobar el equipo editorial.' }, 500);
    }

    if (existingMembership?.status === 'active') {
        return jsonResponse(request, { error: 'Ese correo ya tiene acceso editorial.' }, 409);
    }

    if (existingMembership?.status === 'invited') {
        return jsonResponse(request, { error: 'Ya hay una invitación pendiente para ese correo.' }, 409);
    }

    const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/admin/news`,
    });

    if (inviteError || !invitedUser.user) {
        const message = inviteError?.message.toLowerCase().includes('already registered')
            ? 'Ese correo ya existe en Supabase Auth. Revoca su acceso anterior o gestiona la invitación desde Supabase.'
            : 'Supabase no pudo enviar la invitación.';
        return jsonResponse(request, { error: message }, 409);
    }

    const { error: insertError } = await adminClient
        .from('news_admins')
        .insert({
            user_id: invitedUser.user.id,
            email,
            role: 'editor',
            status: 'invited',
            invited_by: userData.user.id,
            invited_at: new Date().toISOString(),
        });

    if (insertError) {
        return jsonResponse(request, { error: 'La invitación se envió, pero no se pudo registrar el editor.' }, 500);
    }

    return jsonResponse(request, { ok: true });
});
