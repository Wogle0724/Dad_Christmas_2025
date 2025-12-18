import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?oauth_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?oauth_error=missing_parameters`
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?oauth_error=invalid_state`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/google-oauth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?oauth_error=server_config_error`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?oauth_error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Redirect to dashboard with tokens in URL (will be stored client-side)
    // In production, you'd want to store these server-side or use httpOnly cookies
    const redirectUrl = new URL(`${request.nextUrl.origin}/dashboard`);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token);
    }
    redirectUrl.searchParams.set('expires_in', tokens.expires_in?.toString() || '3600');

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard?oauth_error=callback_error`
    );
  }
}

