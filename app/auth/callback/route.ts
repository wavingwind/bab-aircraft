import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Next.js 15/16 규격에 맞게 쿠키 저장소 생성
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 인증 코드를 세션으로 교환
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증 완료 후 홈 화면으로 리다이렉트
  return NextResponse.redirect(requestUrl.origin);
}