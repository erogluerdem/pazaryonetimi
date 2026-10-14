import { headers } from 'next/headers';
import { getPricingCatalog } from '@/lib/pricing';
import { DEFAULT_PRICING_CATALOG, formatTryAmount } from '@/config/pricing-catalog';

export default async function StructuredData() {
    const pricingCatalog = await getPricingCatalog();
    const starter = pricingCatalog.plans.find((plan) => plan.id === 'starter');
    const professional = pricingCatalog.plans.find((plan) => plan.id === 'professional');
    const enterprise = pricingCatalog.plans.find((plan) => plan.id === 'enterprise');

    const starterPrice = starter?.monthly !== null && starter?.monthly !== undefined
        ? String(starter.monthly)
        : String(DEFAULT_PRICING_CATALOG.plans.find((plan) => plan.id === 'starter')?.monthly ?? 499);
    const professionalPrice = professional?.monthly !== null && professional?.monthly !== undefined
        ? String(professional.monthly)
        : String(DEFAULT_PRICING_CATALOG.plans.find((plan) => plan.id === 'professional')?.monthly ?? 1499);
    const enterprisePriceLabel = enterprise?.enterpriseLabel || DEFAULT_PRICING_CATALOG.plans.find((plan) => plan.id === 'enterprise')?.enterpriseLabel || 'Ozel';

    // 1. Organization Schema
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://pazaryonetimi.com/#organization",
        "name": "Pazaryonetimi",
        "url": "https://pazaryonetimi.com",
        "logo": {
            "@type": "ImageObject",
            "url": "https://pazaryonetimi.com/logo.png",
            "width": 512,
            "height": 512,
        },
        "image": "https://pazaryonetimi.com/og-image.png",
        "description": "Türkiye'nin lider AI destekli e-ticaret yönetim platformu. Trendyol, Hepsiburada, Amazon, N11 ve Çiçeksepeti entegrasyonları.",
        "foundingDate": "2024",
        "numberOfEmployees": {
            "@type": "QuantitativeValue",
            "value": 50,
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "İstanbul",
            "addressCountry": "TR",
        },
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+90-212-000-0000",
                "contactType": "customer service",
                "availableLanguage": ["Turkish", "English"],
                "areaServed": "TR",
            },
            {
                "@type": "ContactPoint",
                "telephone": "+90-212-000-0000",
                "contactType": "sales",
                "availableLanguage": ["Turkish", "English"],
                "areaServed": "TR",
            },
        ],
        "sameAs": [
            "https://twitter.com/pazaryonetimi",
            "https://www.linkedin.com/company/pazaryonetimi",
            "https://www.instagram.com/pazaryonetimi",
            "https://www.youtube.com/@pazaryonetimi",
            "https://github.com/pazaryonetimi",
        ],
    };

    // 2. WebSite Schema with SearchAction (Sitelinks Search Box)
    const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://pazaryonetimi.com/#website",
        "url": "https://pazaryonetimi.com",
        "name": "Pazaryonetimi",
        "description": "AI Destekli E-ticaret Yönetim Platformu",
        "publisher": { "@id": "https://pazaryonetimi.com/#organization" },
        "inLanguage": "tr-TR",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://pazaryonetimi.com/blog?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    };

    // 3. SoftwareApplication Schema (mevcut, iyileştirilmiş)
    const softwareData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": "https://pazaryonetimi.com/#software",
        "name": "Pazaryonetimi",
        "operatingSystem": "Web, Windows, macOS, Android, iOS",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "E-commerce Management",
        "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "0",
            "highPrice": professionalPrice,
            "priceCurrency": "TRY",
            "offerCount": 4,
            "offers": [
                {
                    "@type": "Offer",
                    "name": "Ücretsiz Plan",
                    "price": "0",
                    "priceCurrency": "TRY",
                    "description": "Temel e-ticaret yönetimi",
                },
                {
                    "@type": "Offer",
                    "name": "Starter Plan",
                    "price": starterPrice,
                    "priceCurrency": "TRY",
                    "description": "Küçük işletmeler için",
                },
                {
                    "@type": "Offer",
                    "name": "Pro Plan",
                    "price": professionalPrice,
                    "priceCurrency": "TRY",
                    "description": "Büyüyen işletmeler için AI destekli yönetim",
                },
                {
                    "@type": "Offer",
                    "name": "Enterprise Plan",
                    "price": "0",
                    "priceSpecification": {
                        "@type": "PriceSpecification",
                        "priceCurrency": "TRY",
                        "price": "0",
                        "valueAddedTaxIncluded": true,
                        "description": enterprisePriceLabel,
                    },
                    "priceCurrency": "TRY",
                    "description": "Kurumsal çözümler - özel fiyat",
                },
            ],
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "1250",
            "reviewCount": "890",
        },
        "description": "Tüm pazaryerlerinizi tek platformdan yönetin. Trendyol, Hepsiburada, Amazon, N11 ve Çiçeksepeti entegrasyonları ile AI destekli e-ticaret yönetimi.",
        "featureList": [
            "Çoklu pazaryeri entegrasyonu",
            "AI destekli fiyat optimizasyonu",
            "Otomatik stok senkronizasyonu",
            "Akıllı sipariş yönetimi",
            "Gelişmiş analitik ve raporlama",
            "Yapay zeka destekli satış tahminleri",
            "Toplu ürün düzenleme",
            "Kargo entegrasyonları",
        ],
        "screenshot": "https://pazaryonetimi.com/og-image.png",
        "softwareVersion": "2.0",
        "releaseNotes": "https://pazaryonetimi.com/changelog",
        "publisher": { "@id": "https://pazaryonetimi.com/#organization" },
    };

    // 4. FAQ Schema (ana sayfa SSS)
    const faqData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Pazaryonetimi nedir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pazaryonetimi, Trendyol, Hepsiburada, Amazon, N11 ve Çiçeksepeti gibi tüm büyük pazaryerlerini tek bir platformdan yönetmenizi sağlayan AI destekli e-ticaret yönetim platformudur.",
                },
            },
            {
                "@type": "Question",
                "name": "Hangi pazaryerleri ile entegre çalışır?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Trendyol, Hepsiburada, Amazon Türkiye, N11, Çiçeksepeti ve daha birçok pazaryeri ile tam entegrasyon sağlanmaktadır. Tüm siparişler, stok ve fiyatlar otomatik senkronize edilir.",
                },
            },
            {
                "@type": "Question",
                "name": "Ücretsiz deneme süresi var mı?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Evet, Pazaryonetimi'ni 14 gün boyunca ücretsiz deneyebilirsiniz. Kredi kartı bilgisi gerekmez. Deneme süresinde tüm Pro özelliklere erişim sağlanır.",
                },
            },
            {
                "@type": "Question",
                "name": "AI özellikleri neler sunuyor?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "AI danışman, otomatik fiyat optimizasyonu, satış tahminleri, stok uyarıları, rakip analizi, SEO denetleyicisi ve akıllı içerik oluşturma gibi yapay zeka destekli özellikler sunulmaktadır.",
                },
            },
            {
                "@type": "Question",
                "name": "Stok senkronizasyonu nasıl çalışır?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tüm pazaryerlerinizdeki stoklar gerçek zamanlı olarak senkronize edilir. Bir platformda satış yapıldığında diğer platformlardaki stok otomatik güncellenir, böylece fazla satış riski ortadan kalkar.",
                },
            },
            {
                "@type": "Question",
                "name": "Fiyatlandırma nasıl çalışır?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Ücretsiz, Starter (₺${formatTryAmount(Number(starterPrice))}/ay), Pro (₺${formatTryAmount(Number(professionalPrice))}/ay) ve Enterprise (${enterprisePriceLabel}) olmak üzere planlar sunulmaktadır. Yıllık ödeme ile ek indirim uygulanır.`,
                },
            },
        ],
    };

    // 5. BreadcrumbList Schema (Dynamic)
    let pathname = '/';
    const isBuildTime = process.env.NEXT_PHASE?.includes('build');
    if (!isBuildTime) {
        try {
            const headerList = await headers();
            pathname = headerList.get('x-pathname') || '/';
        } catch {
            // Fallback for static generation / build time
        }
    }
    const pathParts = pathname.split('/').filter(Boolean);
    
    const breadcrumbItems = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Ana Sayfa",
            "item": "https://pazaryonetimi.com",
        },
    ];

    pathParts.forEach((part: string, index: number) => {
        const url = `https://pazaryonetimi.com/${pathParts.slice(0, index + 1).join('/')}`;
        const name = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
        breadcrumbItems.push({
            "@type": "ListItem",
            "position": index + 2,
            "name": name,
            "item": url,
        });
    });

    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems,
    };

    return (
        <>
            <script
                id="structured-data-organization"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
            />
            <script
                id="structured-data-website"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
            />
            <script
                id="structured-data-software"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareData) }}
            />
            <script
                id="structured-data-faq"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
            />
            <script
                id="structured-data-breadcrumb"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
        </>
    );
}
