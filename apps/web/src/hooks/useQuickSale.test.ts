import { renderHook, act } from '@testing-library/react';
import { useQuickSale } from './useQuickSale';
import { useProducts, useOrders } from '@/lib/hooks';

jest.mock('@/lib/hooks', () => ({
  useProducts: jest.fn(),
  useOrders: jest.fn(),
}));

describe('useQuickSale hook', () => {
  beforeEach(() => {
    (useOrders as jest.Mock).mockReturnValue({
      createOrder: jest.fn().mockResolvedValue({ id: 'order-1' }),
      loading: false,
    });
  });

  it('handles paginated object { data: [...] } from useProducts without crashing', () => {
    (useProducts as jest.Mock).mockReturnValue({
      data: {
        data: [
          { id: 'p1', title: 'iPhone 15 Pro', sku: 'IP15-PRO', price: 65000 },
          { id: 'p2', title: 'Samsung Galaxy S24', sku: 'SGS24', price: 45000 },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
      loading: false,
    });

    const onClose = jest.fn();
    const { result } = renderHook(() => useQuickSale(onClose));

    expect(result.current.filteredProducts.length).toBe(2);
    expect(result.current.filteredProducts[0].name).toBe('iPhone 15 Pro');
  });

  it('handles empty object or non-array data without throwing filter error', () => {
    (useProducts as jest.Mock).mockReturnValue({
      data: {},
      loading: false,
    });

    const onClose = jest.fn();
    const { result } = renderHook(() => useQuickSale(onClose));

    expect(result.current.filteredProducts).toEqual([]);
  });

  it('filters products correctly by search query', () => {
    (useProducts as jest.Mock).mockReturnValue({
      data: {
        data: [
          { id: 'p1', title: 'Apple Watch Ultra', sku: 'AW-ULTRA', price: 30000 },
          { id: 'p2', title: 'MacBook Air M3', sku: 'MBA-M3', price: 42000 },
        ],
      },
      loading: false,
    });

    const onClose = jest.fn();
    const { result } = renderHook(() => useQuickSale(onClose));

    act(() => {
      result.current.setSearchQuery('watch');
    });

    expect(result.current.filteredProducts.length).toBe(1);
    expect(result.current.filteredProducts[0].id).toBe('p1');
  });
});
