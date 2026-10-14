# Pazaryeri bağlantıları ve XML aktarımı

Güncelleme: 14 Ekim 2026. Bu not kodun kurulumu ve doğrulanması içindir; canlı mağaza bağlantıları gerçek satıcı yetkileriyle ayrıca denenmelidir.

## Sunucu ayarları

1. Web ve API hizmetlerine **aynı JWT_SECRET** değerini tanımlayın. NEXTAUTH_SECRET ayrı bir ayardır; onun yerine geçmez.
2. API hizmetinde ENCRYPTION_KEY kalıcı olmalıdır. Anahtarı değiştirirseniz mevcut şifreli pazaryeri bilgileri çözülemez. Yeni yardımcı tokenlar da şifreli saklanır; eski kayıtlar yeniden bağlanırken güncellenir.
3. Web hizmetinde API_INTERNAL_URL, API hizmetinin iç ağ adresini göstermelidir. Docker varsayılanı http://api:3001; kullanıcı tarayıcısı aynı alan adındaki /api yollarını kullanır.
4. XML_AUTO_SYNC_ENABLED=true, kayıtlı ve otomatik yenilemesi açık XML kaynaklarını çalıştırır. Kaynaklar dakikada bir kontrol edilir; her kaynağın kendi yenileme aralığı vardır. Varsayılan 240 dakika, en az 15 dakika.
5. Ters proxy kullanıyorsanız XML JSON istekleri için en az 22 MB istek gövdesi ve uzun aktarım için uygun zaman aşımı tanımlayın. Kaynağın XML içeriği en fazla 10 MB ve tek aktarım en fazla 20.000 üründür. JSON kaçış karakterleri HTTP gövdesini büyütebilir.
6. .env.example ve .env.coolify.example örneklerini kullanın. Docker API hizmetine yeni Amazon ve XML ayarları aktarılır. API ve web hizmetlerini birlikte yeniden derleyip yayınlayın. Bu değişiklik yeni bir Prisma şema migrasyonu gerektirmez.

## Kullanıcı XML aktarımı

Her iki adres aynı aktarım merkezini açar: /dashboard/xml-import ve /dashboard/xml-supplier.

1. XML bağlantısı girin veya XML dosyası seçin.
2. Gerekirse özel etiketleri eşleştirin: SKU, ürün adı, fiyat, alış fiyatı, stok, barkod. İç içe alanlar için fiyat.satis biçimini kullanın.
3. Önizle düğmesine basın. İlk 50 ürün gösterilir; aktarım tüm doğrulanan ürünleri işler.
4. Kataloğa aktar düğmesine basın. Aynı SKU mevcut ürünü günceller. Veriler oturumdaki şirkete kaydedilir. Bozuk içerik örnek ürün oluşturmaz.
5. URL kaynağını adlandırıp kaydederseniz Senkronize et düğmesi ve otomatik yenileme aynı gerçek kaynağı okur; özel eşlemeler korunur. Kaynak silindiğinde katalog ürünleri korunur.
6. Katalogdan seçtiğiniz ürünleri veya bütün kataloğu XML olarak indirebilirsiniz. Liste son 2.000 ürünü gösterir; dışa aktarma en fazla 20.000 üründür.

Yüzde ve sabit ilave sıfır olduğunda XML satış fiyatı kullanılır. Kural verildiğinde fiyat = alış fiyatı × (1 + yüzde / 100) + sabit ilave olarak hesaplanır.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Urunler>
  <Urun>
    <UrunKodu>SKU-001</UrunKodu>
    <UrunAdi>Deneme ürünü</UrunAdi>
    <Barkod>8680000000001</Barkod>
    <Fiyat>249,90</Fiyat>
    <AlisFiyati>180</AlisFiyati>
    <Stok>12</Stok>
  </Urun>
</Urunler>
```

Bu örnek kullanıcının hazırlayabileceği dosya biçimidir; uygulama kaynak okunamadığında bu veriyi kullanmaz. İçe aktarma ürünleri yerel kataloğa kaydeder; pazaryerinde ürün yayımlama ayrıca kanalın kategori, zorunlu özellik ve görsel kurallarını gerektirir.

## Mağaza bağlantı bilgileri

- Trendyol: Satıcı ID, API Key, API Secret. Test ortamı seçimi canlı anahtarla karıştırılmamalıdır. Ürünler V2 onaylı ürün servisinden; siparişler V2 sipariş servisinden alınır.
- Hepsiburada: Merchant ID, atanmış API kullanıcı adı ve servis anahtarı. HEPSIBURADA_INTEGRATOR_NAME satıcı hesabının izin verdiği entegratör adını göstermelidir.
- n11: appKey/appSecret. Ürün ve sipariş okuması REST üzerinden yapılır.
- Çiçeksepeti: x-api-key; test ve canlı anahtarlar ayrıdır. Ürün okuması GET, sipariş okuması POST ile yapılır.
- Amazon: Seller ID, Refresh Token ve LWA Client ID/Secret. AWS IAM alanları bağlantı için zorunlu değildir. Seçilen ülkenin satış yetkisi doğrulanır.
- eBay: uygulama bilgilerine ek olarak kullanıcı OAuth tokenı gerekir.
- Etsy: Keystring, Shared Secret, Shop ID ve kullanıcı OAuth Access Token gerekir.
- Shopify: myshopify.com mağaza adresi ve ürün okuma yetkili Admin API tokenı gerekir.

Amazon OAuth düğmesi için AMAZON_SP_API_APPLICATION_ID, AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET ve AMAZON_REDIRECT_URI tanımlanmalıdır. Callback adresi Amazon uygulamasına kaydedilmiş tam adresle aynı olmalıdır; örnek değer otomatik olarak uygun kabul edilmez. Yetkilendirme yalnız oturumdaki şirket için başlar ve tek kullanımlık durum bilgisiyle korunur. WEB_URL kullanıcı arayüzünün herkese açık adresidir.

Desteklenmeyen sağlayıcı doğrulaması başarılı sayılmaz. Bilgiler kaydedilse bile bağlantı doğrulanmadı ve pasif olarak kalır; otomatik aktarım başlamaz. Listede bir sağlayıcının bulunması, bütün işlemlerinin hazır olduğu anlamına gelmez.

Amazon liste araması sorgu başına en fazla 1.000 SKU döndürebilir. Tam katalog bu sınıra ulaştığında sessizce eksik aktarım yapılmaz; Listings Report akışının kurulması gerektiği bildirilir. Çok büyük Amazon katalogları için bu rapor entegrasyonu ayrıca gereklidir.

## Doğrulama ve yayın sınırı

Yerel testlerde pazaryeri HTTP yanıtları ve veritabanı bağımlılıkları taklit edilir; gerçek satıcı tokenı veya canlı veri değiştirilmez. **97 API testi, 9 web testi ve 17 HTTP yönlendirme testi geçti: toplam 123 test.** API derlemesi ve ilgili TypeScript kontrolleri ayrıca çalıştırılır. Web projesinin tamamında bu işin dışında mevcut tip hataları vardır; bağlantı/XML dosyaları ayrı kontrol edilir. Canlı çalışmanın kabulü için yayın sonrasında gerçek bir satıcı hesabıyla bağlanma, ürün/sipariş okuma ve küçük bir XML dosyasıyla aktarım yapılmalıdır.

## Sonraki zorunlu iyileştirmeler

1. Başarısız işler, süresi dolan tokenlar ve durmuş kuyruklar için yönetici bildirimi; kullanıcıya hatanın nedeni ve yeniden deneme seçeneği.
2. Günlük veritabanı yedeği ve düzenli geri yükleme denemesi. ENCRYPTION_KEY yedeğini veritabanı yedeğiyle birlikte güvenli saklama.
3. Toplu fiyat/stok işlemlerinde önizleme, değişiklik kaydı ve geri dönüş. Pazaryerinin kabul ettiği bir iş ile gerçekten uyguladığı güncellemeyi ayrı izleme.
4. Çok büyük XML kaynaklarını uzun HTTP isteği yerine kalıcı iş kuyruğunda parça parça işleme; ilerleme ve hata listesi.
5. Her aktif sağlayıcı için gerçek test hesabıyla düzenli sözleşme testi. Önce temel pazaryerlerinin ürün, sipariş ve stok akışını tamamlayıp ardından yeni sağlayıcıları açma.

## Resmî başvuru kaynakları

- [Trendyol onaylı ürün V2](https://developers.trendyol.com/docs/%C3%BCr%C3%BCn-filtreleme-onayl%C4%B1-%C3%BCr%C3%BCn-v2)
- [Hepsiburada listing bilgileri](https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&op=Listing+Bilgilerini+Sorgulama&product=listeleme&version=v1&view=endpoint)
- [Çiçeksepeti sipariş listeleme](https://ciceksepeti.dev/siparis/siparis-listeleme)
- [Çiçeksepeti stok ve fiyat güncelleme](https://ciceksepeti.dev/urun/stokvefiyat-guncelleme-v2)
- [Amazon listing araması ve sayfalama sınırı](https://developer-docs.amazon/sp-api/reference/searchlistingsitems)
