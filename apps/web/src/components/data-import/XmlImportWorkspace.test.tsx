import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import XmlImportWorkspace from './XmlImportWorkspace';

describe('XML import workspace', () => {
  const mockFetch = jest.fn();
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset().mockImplementation(async (url: string) => ({ ok: true, json: async () => [] }));
  });
  it('previews an actual API result before allowing catalogue import', async () => {
    let imported = false;
    mockFetch.mockImplementation(async (url: string) => ({ ok: true, json: async () => url.endsWith('/preview') ? { total: 1, fields: ['sku'], products: [{ sku: 'REAL-SKU', title: 'Gerçek ürün', price: 25, stock: 2 }] } : url.endsWith('/import') ? (imported = true, { id: 'job-1', status: 'queued' }) : url.endsWith('/jobs') && imported ? [{ id: 'job-1', status: 'completed', cursor: 1, total: 1, created: 1, updated: 0, createdAt: new Date().toISOString() }] : [] }));
    render(<XmlImportWorkspace />);
    const transfer = screen.getByRole('button', { name: 'Kataloğa aktar' }) as HTMLButtonElement;
    expect(transfer.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('XML bağlantısı'), { target: { value: 'https://example.com/products.xml' } });
    fireEvent.click(screen.getByRole('button', { name: 'Önizle' }));
    await screen.findByText('REAL-SKU');
    expect(transfer.disabled).toBe(false);
    fireEvent.click(transfer);
    await screen.findByText('Aktarım işi kaydedildi. İlerlemesini aşağıdan takip edebilirsiniz.');
    await screen.findByText(/Tamamlandı/);
    const call = mockFetch.mock.calls.find(([url]) => url.endsWith('/import'))!;
    expect(JSON.parse(call[1].body)).toMatchObject({ url: 'https://example.com/products.xml', markupPercent: 0, fixedFee: 0 });
  });
  it('shows the backend error message when a source cannot be read', async () => {
    mockFetch.mockImplementation(async (url: string) => ({ ok: !url.endsWith('/preview'), json: async () => url.endsWith('/preview') ? { message: 'XML kaynağı okunamadı (HTTP 404)', error: 'Bad Request' } : [] }));
    render(<XmlImportWorkspace />);
    fireEvent.change(screen.getByLabelText('XML bağlantısı'), { target: { value: 'https://example.com/missing.xml' } });
    fireEvent.click(screen.getByRole('button', { name: 'Önizle' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain('XML kaynağı okunamadı (HTTP 404)');
    expect((screen.getByRole('button', { name: 'Kataloğa aktar' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('uses the real saved-source sync action and displays the returned counts', async () => {
    let synchronized = false;
    mockFetch.mockImplementation(async (url: string) => ({ ok: true, json: async () => {
      if (url.endsWith('/source-id/sync')) { synchronized = true; return { id: 'job-2', status: 'queued' }; }
      if (url.endsWith('/jobs') && synchronized) return [{ id: 'job-2', status: 'completed', cursor: 5, total: 5, created: 2, updated: 3, createdAt: new Date().toISOString() }];
      return url.endsWith('/xml-feeds') ? [{ id: 'source-id', name: 'Tedarikçi', url: 'https://example.com/feed', status: 'active', productCount: synchronized ? 5 : 0, autoSync: true, syncInterval: 240 }] : [];
    } }));
    render(<XmlImportWorkspace />);
    fireEvent.click(await screen.findByRole('button', { name: 'Senkronize et' }));
    await screen.findByText(/2 yeni · 3 güncellenen/);
    await waitFor(() => expect(mockFetch.mock.calls.some(([url, init]) => url.endsWith('/source-id/sync') && init.method === 'POST')).toBe(true));
  });
});
