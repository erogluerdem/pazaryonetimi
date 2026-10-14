export interface AmazonNormalizedOrder {
  orderNumber: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  billingAddress?: string;
  totalAmount: number;
  taxAmount: number;
  shippingCost: number;
  currency: string;
  orderDate: string;
  trackingNumber?: string;
  shippingProvider?: string;
  notes?: string;
}

export function mapAmazonOrderStatus(
  amazonStatus: string,
): 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' {
  const normalized = amazonStatus.toLowerCase();

  if (normalized.includes('cancel')) {
    return 'CANCELLED';
  }
  if (normalized.includes('unshipped') || normalized.includes('pending')) {
    return 'CONFIRMED';
  }
  if (normalized.includes('ship')) {
    return normalized.includes('partial') ? 'CONFIRMED' : 'SHIPPED';
  }
  if (normalized.includes('deliver')) {
    return 'DELIVERED';
  }
  return 'PENDING';
}

function formatAmazonAddress(address?: Record<string, unknown>): string | undefined {
  if (!address) {
    return undefined;
  }

  const parts = [
    address.Name,
    address.AddressLine1,
    address.AddressLine2,
    address.AddressLine3,
    address.City,
    address.StateOrRegion,
    address.PostalCode,
    address.CountryCode,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function mapAmazonOrder(
  order: Record<string, unknown>,
  currencyFallback: string,
): AmazonNormalizedOrder {
  const orderTotal = (order.OrderTotal || {}) as Record<string, unknown>;
  const shippingAddress = (order.ShippingAddress || {}) as Record<
    string,
    unknown
  >;
  const buyerInfo = (order.BuyerInfo || {}) as Record<string, unknown>;
  const amazonOrderId = String(order.AmazonOrderId || order.amazonOrderId || '');

  return {
    orderNumber: amazonOrderId,
    orderId: amazonOrderId,
    status: mapAmazonOrderStatus(String(order.OrderStatus || 'Pending')),
    paymentStatus: 'PAID',
    customerName: String(shippingAddress.Name || buyerInfo.BuyerName || '').trim() || undefined,
    customerEmail: String(buyerInfo.BuyerEmail || '').trim() || undefined,
    customerPhone: String(shippingAddress.Phone || '').trim() || undefined,
    shippingAddress: formatAmazonAddress(shippingAddress),
    totalAmount: Number(orderTotal.Amount || 0),
    taxAmount: 0,
    shippingCost: 0,
    currency: String(orderTotal.CurrencyCode || currencyFallback),
    orderDate: String(order.PurchaseDate || new Date().toISOString()),
    shippingProvider: 'Amazon',
    notes: `Fulfillment: ${String(order.FulfillmentChannel || 'UNKNOWN')}`,
  };
}

export function mapAmazonListingProduct(
  listing: Record<string, unknown>,
  index: number,
): Record<string, unknown> {
  const summaries = Array.isArray(listing.summaries) ? listing.summaries : [];
  const summary = (summaries[0] || {}) as Record<string, unknown>;
  const attributes = (listing.attributes || {}) as Record<string, unknown>;
  const stockRows = Array.isArray(listing.fulfillmentAvailability) ? listing.fulfillmentAvailability as Record<string, unknown>[] : [];
  const offers = Array.isArray(listing.offers) ? listing.offers as Record<string, unknown>[] : [];
  const offerPrice = offers.find(offer => offer.offerType === 'B2C')?.price || offers[0]?.price;
  const price = Number((offerPrice as { amount?: unknown })?.amount ?? summary.mainOfferPrice ?? summary.price ?? 0);
  const availability = stockRows[0] || (Array.isArray(attributes.fulfillment_availability)
    ? (attributes.fulfillment_availability[0] as Record<string, unknown>)
    : undefined);

  return {
    productId: String(listing.sku || summary.asin || `AMZ-${index + 1}`),
    sku: String(listing.sku || ''),
    title: String(summary.itemName || summary.title || ''),
    salePrice: price,
    price: price,
    stockCount: Number(availability?.quantity || 0),
    images: (summary.mainImage as { link?: string } | undefined)?.link ? [(summary.mainImage as { link: string }).link] : [],
    url: summary.asin ? `https://www.amazon.com/dp/${summary.asin}` : '',
  };
}
