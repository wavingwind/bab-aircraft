import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 코드를 사용하여 세션을 확정합니다.
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증이 끝나면 로그인 창이 아닌 '홈(/)'으로 바로 보냅니다!
  return NextResponse.redirect(new URL('/', request.url));
}