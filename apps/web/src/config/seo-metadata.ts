import type { Metadata } from 'next';

// Bu dosya tüm landing sayfaları için metadata tanımlarını içerir.
// "use client" olan sayfalar metadata export edemediği için,
// her sayfa route'una layout.tsx veya metadata.ts ile metadata ekliyoruz.

export const pageMetadata: Record<string, Metadata> = {
    '/': {
        title: 'AI Destekli E-ticaret Yönetim Platformu | Tüm Pazaryerleri Tek Panelde',
        description: 'Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti — tüm pazaryerlerinizi tek platformdan yönetin. AI destekli stok senkronizasyonu, akıllı fiyatlandırma, otomatik sipariş yönetimi. 14 gün ücretsiz deneyin.',
        keywords: ['e-ticaret yönetimi', 'pazaryeri yönetimi', 'trendyol entegrasyonu', 'hepsiburada entegrasyonu', 'stok yönetimi', 'sipariş yönetimi'],
        alternates: { canonical: 'https://pazaryonetimi.com' },
    },
    '/pricing': {
        title: 'Fiyatlandırma — Ücretsiz Başlayın',
        description: 'Pazaryonetimi fiyatlandırma planları. Ücretsiz plan ile başlayın, işletmeniz büyüdükçe yükseltin. Güncel paket ve indirim detayları için fiyatlandırma sayfasını inceleyin.',
        keywords: ['pazaryonetimi fiyat', 'e-ticaret yazılımı fiyat', 'pazaryeri yönetim fiyatlandırma'],
        alternates: { canonical: 'https://pazaryonetimi.com/pricing' },
    },
    '/blog': {
        title: 'E-ticaret Blog — İpuçları, Rehberler ve Haberler',
        description: 'E-ticaret dünyasındaki en son trendler, pazaryeri stratejileri, SEO ipuçları, stok yönetimi rehberleri ve satış artırma teknikleri. Uzman içerikleriyle işletmenizi büyütün.',
        keywords: ['e-ticaret blog', 'pazaryeri ipuçları', 'trendyol satış artırma', 'e-ticaret rehberi'],
        alternates: { canonical: 'https://pazaryonetimi.com/blog' },
    },
    '/entegrasyonlar': {
        title: 'Pazaryeri Entegrasyonları — Trendyol, Hepsiburada, Amazon, N11',
        description: 'Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti ve 20+ pazaryeri ile tam entegrasyon. Otomatik stok senkronizasyonu, sipariş yönetimi ve fiyat güncelleme. Tek tıkla bağlanın.',
        keywords: ['pazaryeri entegrasyonu', 'trendyol api', 'hepsiburada entegrasyon', 'amazon türkiye entegrasyon', 'çoklu kanal yönetimi'],
        alternates: { canonical: 'https://pazaryonetimi.com/entegrasyonlar' },
    },
    '/faq': {
        title: 'Sıkça Sorulan Sorular',
        description: 'Pazaryonetimi hakkında en çok sorulan sorular ve cevapları. Nasıl başlanır, entegrasyon, fiyatlandırma, teknik destek ve daha fazlası.',
        keywords: ['pazaryonetimi sss', 'e-ticaret yönetimi sss', 'pazaryeri entegrasyonu sık sorulan sorular'],
        alternates: { canonical: 'https://pazaryonetimi.com/faq' },
    },
    '/demo': {
        title: 'Ücretsiz Demo — Platformu Keşfedin',
        description: 'Pazaryonetimi\'ni canlı demo ile keşfedin. AI destekli dashboard, sipariş yönetimi, stok senkronizasyonu ve analitik özelliklerini deneyimleyin. Ücretsiz, kayıt gerektirmez.',
        keywords: ['pazaryonetimi demo', 'e-ticaret yazılımı demo', 'ücretsiz deneme'],
        alternates: { canonical: 'https://pazaryonetimi.com/demo' },
    },
    '/demo-talep': {
        title: 'Demo Talep Edin — Birebir Canlı Tanıtım',
        description: 'Pazaryonetimi uzman ekibinden 30 dakikalık birebir canlı demo randevusu alın. İşletmenize özel e-ticaret çözümlerini keşfedin.',
        keywords: ['pazaryonetimi demo talep', 'birebir demo randevu', 'e-ticaret demo görüşmesi'],
        alternates: { canonical: 'https://pazaryonetimi.com/demo-talep' },
    },
    '/security': {
        title: 'Güvenlik — Verileriniz Güvende',
        description: 'Pazaryonetimi güvenlik önlemleri. SSL şifreleme, KVKK uyumluluğu, iki faktörlü kimlik doğrulama, veri yedekleme ve SOC 2 sertifikası ile verileriniz güvende.',
        keywords: ['e-ticaret güvenliği', 'veri güvenliği', 'KVKK uyumlu yazılım'],
        alternates: { canonical: 'https://pazaryonetimi.com/security' },
    },
    '/team': {
        title: 'Ekibimiz — Pazaryonetimi\'ni Oluşturan İnsanlar',
        description: 'Pazaryonetimi arkasındaki deneyimli ekip. E-ticaret, yapay zeka ve yazılım mühendisliği alanlarında uzman profesyoneller.',
        alternates: { canonical: 'https://pazaryonetimi.com/team' },
    },
    '/community': {
        title: 'Topluluk — E-ticaret Profesyonelleri Ağı',
        description: 'Pazaryonetimi topluluğuna katılın. E-ticaret satıcılarıyla deneyim paylaşın, forumda soru sorun, etkinliklere katılın ve birlikte büyüyün.',
        keywords: ['e-ticaret topluluğu', 'pazaryeri forum', 'satıcı ağı', 'trendyol satıcı topluluğu'],
        alternates: { canonical: 'https://pazaryonetimi.com/community' },
    },
    '/community/leaderboard': {
        title: 'Liderlik Tablosu — En Aktif Topluluk Üyeleri',
        description: 'Pazaryonetimi topluluk liderlik tablosu. Haftalık ve aylık en çok katkı sağlayan e-ticaret satıcılarını görün.',
        keywords: ['topluluk liderlik tablosu', 'forum puanları', 'e-ticaret uzmanları'],
        alternates: { canonical: 'https://pazaryonetimi.com/community/leaderboard' },
    },
    '/forum': {
        title: 'Forum — E-ticaret Satıcıları Soru & Cevap',
        description: 'Trendyol, Hepsiburada, Amazon ve e-ticaret operasyonları hakkında soru sorun, deneyim paylaşın. Uzman satıcı topluluğundan anında yanıt alın.',
        keywords: ['e-ticaret forumu', 'pazaryeri forum', 'trendyol satıcı forumu', 'hepsiburada soru cevap'],
        alternates: { canonical: 'https://pazaryonetimi.com/forum' },
    },
    '/case-studies': {
        title: 'Başarı Hikayeleri — Müşterilerimizin Sonuçları',
        description: 'Pazaryonetimi ile satışlarını %300 artıran, operasyon süresini %70 azaltan gerçek müşteri hikayeleri. ROI kanıtlı e-ticaret çözümleri.',
        keywords: ['e-ticaret başarı hikayesi', 'pazaryeri yönetimi sonuçları', 'e-ticaret büyüme'],
        alternates: { canonical: 'https://pazaryonetimi.com/case-studies' },
    },
    '/basari-hikayeleri': {
        title: 'Başarı Hikayeleri — Gerçek E-ticaret Dönüşümleri',
        description: 'Pazaryonetimi ile başarıya ulaşan e-ticaret işletmelerinin hikayeleri. Satış artışı, verimlilik kazanımları ve otomasyon sonuçları.',
        alternates: { canonical: 'https://pazaryonetimi.com/basari-hikayeleri' },
    },
    '/webinars': {
        title: 'Webinarlar — Ücretsiz E-ticaret Eğitimleri',
        description: 'E-ticaret uzmanlarıyla canlı webinarlar. Pazaryeri stratejileri, AI kullanımı, stok yönetimi ve satış optimizasyonu konularında ücretsiz eğitimler.',
        alternates: { canonical: 'https://pazaryonetimi.com/webinars' },
    },
    '/status': {
        title: 'Sistem Durumu — Anlık Servis Monitörü',
        description: 'Pazaryonetimi platform ve entegrasyon hizmetlerinin anlık durum bilgisi. Uptime, performans metrikleri ve planlı bakım bildirimleri.',
        alternates: { canonical: 'https://pazaryonetimi.com/status' },
    },
    '/signup': {
        title: 'Ücretsiz Hesap Oluştur — 14 Gün Ücretsiz Deneyin',
        description: 'Pazaryonetimi\'ne hemen kaydolun. 14 gün ücretsiz deneme, kredi kartı gerekmez. Tüm pazaryerlerinizi dakikalar içinde bağlayın.',
        keywords: ['pazaryonetimi kayıt', 'ücretsiz e-ticaret yazılımı', 'e-ticaret platformu kayıt'],
        alternates: { canonical: 'https://pazaryonetimi.com/signup' },
    },
    '/roadmap': {
        title: 'Yol Haritası — Gelecek Özellikler ve Planlar',
        description: 'Pazaryonetimi ürün yol haritası. Yakında gelecek özellikler, planlanan entegrasyonlar ve geliştirme öncelikleri.',
        alternates: { canonical: 'https://pazaryonetimi.com/roadmap' },
    },
    '/resources': {
        title: 'Kaynaklar — E-ticaret Rehberleri ve Araçlar',
        description: 'E-ticaret başarınız için kapsamlı kaynaklar. Rehberler, şablonlar, hesaplama araçları, sektör raporları ve en iyi uygulamalar.',
        alternates: { canonical: 'https://pazaryonetimi.com/resources' },
    },
    '/referral': {
        title: 'Referans Programı — Kazanarak Paylaşın',
        description: 'Pazaryonetimi referans programı ile her başarılı davet için ödül kazanın. Arkadaşlarınıza %20 indirim, size kredi kazandırır.',
        alternates: { canonical: 'https://pazaryonetimi.com/referral' },
    },
    '/partner': {
        title: 'İş Ortağı Programı — Birlikte Büyüyelim',
        description: 'Pazaryonetimi iş ortağı programına katılın. Ajanslar, danışmanlar ve çözüm ortakları için özel fırsatlar, komisyon ve eğitim desteği.',
        alternates: { canonical: 'https://pazaryonetimi.com/partner' },
    },
    '/press': {
        title: 'Basın — Medya ve Haberler',
        description: 'Pazaryonetimi basın bültenleri, medya kaynakları ve marka varlıkları. Logo, ekran görüntüleri ve basın kiti indirin.',
        alternates: { canonical: 'https://pazaryonetimi.com/press' },
    },
    '/video-library': {
        title: 'Video Kütüphanesi — Eğitim ve Tanıtım Videoları',
        description: 'Pazaryonetimi video rehberleri. Platform kullanımı, entegrasyon kurulumu, AI araçları ve en iyi uygulamalar hakkında adım adım video eğitimler.',
        alternates: { canonical: 'https://pazaryonetimi.com/video-library' },
    },
    '/changelog': {
        title: 'Değişiklik Günlüğü — Son Güncellemeler',
        description: 'Pazaryonetimi son güncellemeleri ve yeni özellikler. Platform iyileştirmeleri, hata düzeltmeleri ve yeni entegrasyonlar.',
        alternates: { canonical: 'https://pazaryonetimi.com/changelog' },
    },
    '/destek/makaleler': {
        title: 'Yardım Makaleleri | Pazaryonetimi Destek',
        description: 'Platform kullanımı, entegrasyon kurulumu ve e-ticaret operasyonları için yardım makaleleri.',
        keywords: ['yardım makaleleri', 'destek', 'e-ticaret rehberi'],
        alternates: { canonical: 'https://pazaryonetimi.com/destek/makaleler' },
    },
    '/destek': {
        title: 'Destek Merkezi — 7/24 Yardım',
        description: 'Pazaryonetimi destek merkezi. Canlı sohbet, email desteği, bilgi tabanı ve video rehberler ile sorularınıza hızlı çözüm.',
        alternates: { canonical: 'https://pazaryonetimi.com/destek' },
    },
    '/careers': {
        title: 'Kariyer — E-ticaretin Geleceğini Birlikte İnşa Edin',
        description: 'Pazaryonetimi ekibine katılın. Yazılım mühendisliği, ürün yönetimi, pazarlama ve müşteri başarısı pozisyonları. Uzaktan çalışma imkanı.',
        keywords: ['pazaryonetimi kariyer', 'e-ticaret iş ilanları', 'startup kariyer'],
        alternates: { canonical: 'https://pazaryonetimi.com/careers' },
    },
    '/comparison': {
        title: 'Rakip Karşılaştırma — Neden Pazaryonetimi?',
        description: 'Pazaryonetimi vs rakipler detaylı karşılaştırma. Özellik, fiyat ve performans bazında neden Pazaryonetimi\'nin en iyi e-ticaret yönetim platformu olduğunu görün.',
        keywords: ['e-ticaret yazılımı karşılaştırma', 'en iyi pazaryeri yönetim yazılımı'],
        alternates: { canonical: 'https://pazaryonetimi.com/comparison' },
    },
    '/docs/api': {
        title: 'API Dokümantasyonu — Geliştirici Rehberi',
        description: 'Pazaryonetimi REST API dokümantasyonu. Entegrasyon geliştirme, webhook yönetimi ve özel otomasyon oluşturma için kapsamlı geliştirici rehberi.',
        keywords: ['pazaryonetimi api', 'e-ticaret api', 'marketplace api entegrasyonu'],
        alternates: { canonical: 'https://pazaryonetimi.com/docs/api' },
    },
    '/features': {
        title: 'Özellikler — AI Destekli E-ticaret Yönetim Araçları',
        description: 'Pazaryonetimi\'nin tüm özellikleri: AI fiyatlandırma, otomatik stok senkronizasyonu, akıllı sipariş yönetimi, analitik dashboard, çoklu pazaryeri entegrasyonu ve daha fazlası.',
        keywords: ['e-ticaret özellikleri', 'pazaryeri yönetim araçları', 'AI fiyatlandırma', 'stok senkronizasyonu'],
        alternates: { canonical: 'https://pazaryonetimi.com/features' },
    },
    '/solutions': {
        title: 'Çözümler — Her Ölçek İçin E-ticaret Yönetimi',
        description: 'KOBİ\'lerden kurumsal şirketlere, Pazaryonetimi her ölçekte e-ticaret yönetimi çözümü sunar. Sektöre özel çözümler ve entegrasyonlar.',
        keywords: ['e-ticaret çözümleri', 'KOBİ e-ticaret', 'kurumsal e-ticaret yönetimi'],
        alternates: { canonical: 'https://pazaryonetimi.com/solutions' },
    },
    '/iletisim': {
        title: 'İletişim — Bize Ulaşın',
        description: 'Pazaryonetimi ekibiyle iletişime geçin. Satış, destek, iş ortaklığı soruları için bize yazın veya arayın. 7/24 canlı destek.',
        keywords: ['pazaryonetimi iletişim', 'e-ticaret destek', 'müşteri hizmetleri'],
        alternates: { canonical: 'https://pazaryonetimi.com/iletisim' },
    },
    '/contact': {
        title: 'Contact Us — Get in Touch',
        description: 'Reach the Pazaryonetimi team for sales, support, or partnership inquiries. 24/7 live chat, email, and phone support available.',
        alternates: { canonical: 'https://pazaryonetimi.com/contact' },
    },
    '/resources/2026-rapor': {
        title: '2026 E-ticaret Raporu — Sektör Analizi ve Trendler',
        description: 'Türkiye e-ticaret pazarı 2026 yılı kapsamlı raporu. Pazar büyüklüğü, tüketici trendleri, pazaryeri payları ve gelecek öngörüleri.',
        keywords: ['e-ticaret raporu 2026', 'türkiye e-ticaret istatistikleri', 'pazaryeri pazar payı'],
        alternates: { canonical: 'https://pazaryonetimi.com/resources/2026-rapor' },
    },
};
