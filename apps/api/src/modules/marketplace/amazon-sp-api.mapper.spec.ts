import { mapAmazonOrder, mapAmazonOrderStatus, mapAmazonListingProduct } from './amazon-sp-api.mapper';

describe('amazon-sp-api.mapper', () => {
  it('reads listing price and stock from SP-API offers and availability', () => {
    const mapped = mapAmazonListingProduct({ sku: 'SKU-01', summaries: [{ itemName: 'Çanta', mainImage: { link: 'https://example.com/image.jpg' } }], offers: [{ offerType: 'B2C', price: { amount: '249.90', currencyCode: 'TRY' } }], fulfillmentAvailability: [{ fulfillmentChannelCode: 'DEFAULT', quantity: 7 }] }, 0);
    expect(mapped).toMatchObject({ sku: 'SKU-01', salePrice: 249.9, stockCount: 7, images: ['https://example.com/image.jpg'] });
  });
  it('maps shipped amazon order status', () => {
    expect(mapAmazonOrderStatus('Shipped')).toBe('SHIPPED');
    expect(mapAmazonOrderStatus('Canceled')).toBe('CANCELLED');
  });

  it('maps amazon order payload to normalized order', () => {
    const mapped = mapAmazonOrder(
      {
        AmazonOrderId: '123-4567890-1234567',
        OrderStatus: 'Unshipped',
        PurchaseDate: '2026-06-01T10:00:00Z',
        OrderTotal: { Amount: '199.90', CurrencyCode: 'TRY' },
        ShippingAddress: {
          Name: 'Ali Yılmaz',
          AddressLine1: 'Atatürk Cad. No:5',
          City: 'Ankara',
          CountryCode: 'TR',
        },
      },
      'TRY',
    );

    expect(mapped.orderNumber).toBe('123-4567890-1234567');
    expect(mapped.status).toBe('CONFIRMED');
    expect(mapped.totalAmount).toBe(199.9);
    expect(mapped.currency).toBe('TRY');
    expect(mapped.customerName).toBe('Ali Yılmaz');
  });
});
