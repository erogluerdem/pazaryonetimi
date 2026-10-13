'use server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function getXmlSuppliers(_tenantId?: string) {
  const response = await authenticatedBackend('/xml-feeds');
  if (!response.ok) throw new Error('XML kaynakları yüklenemedi');
  return response.json();
}
export async function createXmlSupplier(_tenantId: string, name: string, url: string, markupPercent: number, fixedFee: number) {
  const response = await authenticatedBackend('/xml-feeds', { method: 'POST', body: { name, url, markupPercent, fixedFee } });
  const result = await response.json();
  return response.ok ? { success: true, supplier: result } : { success: false, error: result.message || result.error };
}
export async function deleteXmlSupplier(id: string) {
  const response = await authenticatedBackend('/xml-feeds/' + encodeURIComponent(id), { method: 'DELETE' });
  return { success: response.ok, ...await response.json() };
}
