import { auth } from '@/auth';
import { buildApiUrlCandidates } from '@/lib/server-api-url';
import { NextResponse } from 'next/server';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
 const session = await auth(); const user = session?.user as { tenantId?: string; accessToken?: string } | undefined;
 if (!user?.tenantId || !user.accessToken) return NextResponse.json({error:'Oturum gerekli'},{status:401});
 const { id } = await context.params;
 for (const url of buildApiUrlCandidates('/backup/jobs/'+encodeURIComponent(id)+'/download')) {
  try { const response = await fetch(url,{headers:{Authorization:'Bearer '+user.accessToken,'x-tenant-id':user.tenantId},cache:'no-store'});
   if(response.status===404)continue;
   return new Response(response.body,{status:response.status,headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Content-Disposition':response.headers.get('content-disposition')||'attachment'}});
  } catch { return NextResponse.json({error:'Yedek servisine erişilemedi'},{status:502}); }
 }
 return NextResponse.json({error:'Yedek bulunamadı'},{status:404});
}
