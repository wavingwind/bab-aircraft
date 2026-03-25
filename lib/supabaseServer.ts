import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function await createClient() { // ✅ async 추가
  const cookieStore = await cookies(); // ✅ await 추가 (Next.js 15+ 대응)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트 내부에서 호출될 때를 대비한 예외 처리
          }
        },
      },
    }
  );
}