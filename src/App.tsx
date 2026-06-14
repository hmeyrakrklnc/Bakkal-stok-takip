import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// BAKKAL ESNAF RENK PALETİ
const RENK = {
  arkaPlan: '#fdfbf7',       // Sayfa genel arka planı (Krem/Kağıt tonu)
  kartArkaPlan: '#ffffff',   // Kartların ve tabloların içi
  yaziKoyu: '#333333',       // Genel okunaklı koyu metinler
  yaziAcik: '#666666',       // Fiş no, saat gibi ikincil metinler
  Kenarlik: '#e0e0e0',       // Hafif gri kenarlıklar
  
  // Konsept Renkleri
  esnafKahve: '#5d4037',     // Ana başlıklar (Ahşap/Tezgâh sıcaklığı)
  esnafKahveAcik: '#8d6e63', // Alt başlıklar
  bereketYesili: '#2e7d32',  // Satış butonları, kasa girişleri ve dolu tezgah
  yesilArkaPlan: '#e8f5e9',  // Yeşil rozet arka planı
  lojistikMavisi: '#1565c0', // Toptancı butonları ve işlemler
  maviArkaPlan: '#eceff1',   // Toptancı tablosu başlığı
  
  // Uyarı Renkleri
  kritikTuruncu: '#ef6c00',  // Azalan stok uyarısı
  turuncuArkaPlan: '#fff3e0',
  bittiKirmizi: '#c62828',   // Tükenen ürün uyarısı
  kirmiziArkaPlan: '#ffebee',
};

interface Urun {
  id: number;
  urun_adi: string;
  fiyat: number;
  stok: number;
}

interface Satis {
  id: number;
  urunler: { urun_adi: string; fiyat: number } | null;
  satilan_adet: number;
  toplam_tutar: number;
  satis_tarihi: string;
}

function App() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [satislar, setSatislar] = useState<Satis[]>([]);
  
  const [secilenUrunId, setSecilenUrunId] = useState<string>('');
  // Elle rahatça yazılabilmesi için input state'lerini string yapısına çektik
  const [satisAdedi, setSatisAdedi] = useState<string>('1');
  
  const [stokUrunId, setStokUrunId] = useState<string>('');
  const [eklenecekStok, setEklenecekStok] = useState<string>('1');

  // Yeni eklenecek ürün için input yapına uygun string state'ler
  const [yeniUrunAdi, setYeniUrunAdi] = useState<string>('');
  const [yeniUrunFiyat, setYeniUrunFiyat] = useState<string>('');
  const [yeniUrunStok, setYeniUrunStok] = useState<string>('');

  useEffect(() => {
    verileriGetir();
  }, []);

  const verileriGetir = () => {
    urunleriGetir();
    satislariGetir();
  };

  const urunleriGetir = async () => {
    const { data, error } = await supabase.from('urunler').select('*').order('urun_adi', { ascending: true });
    if (!error) setUrunler(data || []);
  };

  const satislariGetir = async () => {
    const { data, error } = await supabase
      .from('satislar')
      .select('id, satilan_adet, toplam_tutar, satis_tarihi, urunler(urun_adi, fiyat)')
      .order('satis_tarihi', { ascending: false });

    if (!error) setSatislar((data as any) || []);
  };

  // Arayüzden Supabase'e sıfırdan yeni ürün ekleyen fonksiyon
  const yeniUrunKaydet = async () => {
    const fiyatNum = parseFloat(yeniUrunFiyat);
    const stokNum = parseInt(yeniUrunStok);

    if (!yeniUrunAdi.trim()) {
      alert("Lütfen ürün adını girin!");
      return;
    }
    if (!fiyatNum || fiyatNum <= 0) {
      alert("Lütfen geçerli bir fiyat girin!");
      return;
    }
    if (isNaN(stokNum) || stokNum < 0) {
      alert("Lütfen geçerli bir stok adedi girin!");
      return;
    }

    const { error } = await supabase
      .from('urunler')
      .insert([{ urun_adi: yeniUrunAdi.trim(), fiyat: fiyatNum, stok: stokNum }]);

    if (error) {
      alert("Ürün eklenirken bir hata oluştu: " + error.message);
    } else {
      alert(`"${yeniUrunAdi}" başarıyla sisteme eklendi!`);
      setYeniUrunAdi('');
      setYeniUrunFiyat('');
      setYeniUrunStok('');
      verileriGetir();
    }
  };

  const satisYap = async () => {
    const urun = urunler.find(u => u.id === parseInt(secilenUrunId));
    const adet = parseInt(satisAdedi);

    if (!urun) {
      alert("Lütfen önce listeden bir ürün seçin!");
      return;
    }
    if (!adet || adet <= 0) {
      alert("Lütfen geçerli bir satış adedi girin!");
      return;
    }
    if (urun.stok < adet) {
      alert(`Yetersiz stok! Mevcut stok: ${urun.stok}`);
      return;
    }

    const toplamTutar = urun.fiyat * adet;
    const kalanStok = urun.stok - adet;

    await supabase.from('urunler').update({ stok: kalanStok }).eq('id', urun.id);
    await supabase.from('satislar').insert([{ urun_id: urun.id, satilan_adet: adet, toplam_tutar: toplamTutar }]);

    setSecilenUrunId('');
    setSatisAdedi('1');
    verileriGetir();
  };

  const stokEkle = async () => {
    const urun = urunler.find(u => u.id === parseInt(stokUrunId));
    const adet = parseInt(eklenecekStok);

    if (!urun) {
      alert("Lütfen stok eklemek için bir ürün seçin!");
      return;
    }
    if (!adet || adet <= 0) {
      alert("Lütfen geçerli bir adet girin!");
      return;
    }

    const yeniStok = urun.stok + adet;
    await supabase.from('urunler').update({ stok: yeniStok }).eq('id', urun.id);

    setStokUrunId('');
    setEklenecekStok('1');
    verileriGetir();
  };

  // Ortak Input Düzenlemesi
  const ortakInputStili: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `2px solid ${RENK.Kenarlik}`,
    backgroundColor: RENK.kartArkaPlan,
    color: RENK.yaziKoyu,
    fontSize: '15px',
    fontWeight: '500',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Segoe UI", Roboto, sans-serif', maxWidth: '1000px', margin: '0 auto', backgroundColor: RENK.arkaPlan, minHeight: '100vh' }}>
      
      {/* BAŞLIK KARTI */}
      <header style={{ textAlign: 'center', marginBottom: '40px', padding: '25px 20px', backgroundColor: RENK.kartArkaPlan, borderRadius: '16px', boxShadow: '0 4px 20px rgba(93, 64, 55, 0.06)', border: `1px solid ${RENK.Kenarlik}` }}>
        <h1 style={{ margin: 0, color: RENK.esnafKahve, fontSize: '2.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', fontWeight: '700' }}>
          🏪 Mahalle Bakkalı Esnaf Paneli
        </h1>
        <p style={{ color: RENK.esnafKahveAcik, margin: '10px 0 0 0', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Stok Takibi ve Dijital Veresiye Defteri</p>
      </header>

      {/* İKİLİ HIZLI İŞLEM PANELİ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
        
        {/* Hızlı Satış Yap */}
        <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${RENK.Kenarlik}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: RENK.bereketYesili, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>💰 Hızlı Müşteri Satışı</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Ürün Seç:</label>
              <select value={secilenUrunId} onChange={(e) => setSecilenUrunId(e.target.value)} style={ortakInputStili}>
                <option value="">-- Tezgâhtan Ürün Seçin --</option>
                {urunler.map(u => (
                  <option key={u.id} value={u.id} style={{ color: RENK.yaziKoyu, backgroundColor: RENK.kartArkaPlan }}>
                    {u.urun_adi} (Fiyat: {u.fiyat} TL - Stok: {u.stok})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Kaç Adet Satılacak?</label>
              <input 
                type="number" 
                min="1" 
                value={satisAdedi} 
                onChange={(e) => setSatisAdedi(e.target.value)} // Doğrudan string olarak güncellenir, böylece silip yazılabilir.
                style={ortakInputStili} 
              />
            </div>
          </div>

          <button onClick={satisYap} style={{ width: '100%', padding: '14px', backgroundColor: RENK.bereketYesili, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: `0 4px 12px rgba(46, 125, 50, 0.2)` }}>
            Satışı Tamamla (Stoktan Düş)
          </button>
        </div>

        {/* Toptancıdan Mal Ekleme */}
        <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${RENK.Kenarlik}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: RENK.lojistikMavisi, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>🚚 Toptancı Geldi (Stok Girişi)</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Hangi Ürün Geldi?</label>
              <select value={stokUrunId} onChange={(e) => setStokUrunId(e.target.value)} style={ortakInputStili}>
                <option value="">-- Gelen Ürünü Seçin --</option>
                {urunler.map(u => (
                  <option key={u.id} value={u.id} style={{ color: RENK.yaziKoyu, backgroundColor: RENK.kartArkaPlan }}>{u.urun_adi}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Gelen Çuval/Adet Miktarı:</label>
              <input 
                type="number" 
                min="1" 
                value={eklenecekStok} 
                onChange={(e) => setEklenecekStok(e.target.value)} // Silip yazmayı engellemeyen esnek yapı.
                style={ortakInputStili} 
              />
            </div>
          </div>

          <button onClick={stokEkle} style={{ width: '100%', padding: '14px', backgroundColor: RENK.lojistikMavisi, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: `0 4px 12px rgba(21, 101, 192, 0.2)` }}>
            Stoğu Depoya Ekle
          </button>
        </div>

      </div>

      {/* 📝 YENİ ÜRÜN EKLEME PANELİ (Senin orijinal tasarımına tam uyumlu) */}
      <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${RENK.Kenarlik}`, marginBottom: '40px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: RENK.esnafKahve, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>✨ Tezgâha Yeni Ürün Ekle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Ürün Adı:</label>
            <input type="text" placeholder="Örn: Coca Cola" value={yeniUrunAdi} onChange={(e) => setYeniUrunAdi(e.target.value)} style={ortakInputStili} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Fiyat (TL):</label>
            <input type="number" step="0.01" placeholder="Örn: 45.50" value={yeniUrunFiyat} onChange={(e) => setYeniUrunFiyat(e.target.value)} style={ortakInputStili} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Başlangıç Stoğu:</label>
            <input type="number" placeholder="Örn: 20" value={yeniUrunStok} onChange={(e) => setYeniUrunStok(e.target.value)} style={ortakInputStili} />
          </div>
        </div>
        <button onClick={yeniUrunKaydet} style={{ width: '100%', padding: '14px', backgroundColor: RENK.esnafKahve, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: `0 4px 12px rgba(93, 64, 55, 0.2)` }}>
          Yeni Ürünü Listeye ve Veritabanına Kaydet
        </button>
      </div>

      {/* RAFLAR VE STOK DURUM TABLOSU */}
      <section style={{ backgroundColor: RENK.kartArkaPlan, padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '40px', border: `1px solid ${RENK.Kenarlik}` }}>
        <h2 style={{ margin: '0 0 20px 0', color: RENK.esnafKahve, fontSize: '1.4rem', fontWeight: '600' }}>📋 Raflardaki Mal Durumu</h2>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${RENK.Kenarlik}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: RENK.turuncuArkaPlan }}>
                <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Ürün Adı</th>
                <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Satış Fiyatı</th>
                <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Kalan Stok</th>
                <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Durum Raporu</th>
              </tr>
            </thead>
            <tbody>
              {urunler.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: RENK.yaziAcik }}>Supabase RLS iznini açtığında ürünlerin buraya dökülecek...</td>
                </tr>
              ) : (
                urunler.map(urun => (
                  <tr key={urun.id} style={{ borderBottom: `1px solid ${RENK.Kenarlik}` }}>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: RENK.yaziKoyu }}>{urun.urun_adi}</td>
                    <td style={{ padding: '14px', color: RENK.yaziAcik }}>{urun.fiyat.toFixed(2)} TL</td>
                    <td style={{ padding: '14px', fontWeight: '600', color: RENK.yaziKoyu }}>{urun.stok} Adet</td>
                    <td style={{ padding: '14px' }}>
                      {urun.stok === 0 ? (
                        <span style={{ backgroundColor: RENK.kirmiziArkaPlan, color: RENK.bittiKirmizi, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Bitti! Toptancı çağır ❌</span>
                      ) : urun.stok < 10 ? (
                        <span style={{ backgroundColor: RENK.turuncuArkaPlan, color: RENK.kritikTuruncu, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Kritik Seviye! ⚠️</span>
                      ) : (
                        <span style={{ backgroundColor: RENK.yesilArkaPlan, color: RENK.bereketYesili, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>Tezgâh Dolu ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* GEÇMİŞ SATIŞLAR TABLOSU */}
      <section style={{ backgroundColor: RENK.kartArkaPlan, padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${RENK.Kenarlik}` }}>
        <h2 style={{ margin: '0 0 20px 0', color: RENK.esnafKahve, fontSize: '1.4rem', fontWeight: '600' }}>📖 Günlük Bakkal Defteri (Son İşlemler)</h2>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${RENK.Kenarlik}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: RENK.maviArkaPlan }}>
                <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Fiş No</th>
                <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Satılan Mal</th>
                <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Miktar</th>
                <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Kasa Girişi</th>
                <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>İşlem Saati</th>
              </tr>
            </thead>
            <tbody>
              {satislar.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: RENK.yaziAcik }}>Henüz defterde kayıtlı bir satış yok.</td>
                </tr>
              ) : (
                satislar.map(satis => (
                  <tr key={satis.id} style={{ borderBottom: `1px solid ${RENK.Kenarlik}` }}>
                    <td style={{ padding: '14px', color: RENK.yaziAcik }}>#{satis.id}</td>
                    <td style={{ padding: '14px', fontWeight: '500', color: RENK.yaziKoyu }}>{satis.urunler ? satis.urunler.urun_adi : 'Bilinmeyen Ürün'}</td>
                    <td style={{ padding: '14px', color: RENK.yaziAcik }}>{satis.satilan_adet} Adet</td>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: RENK.bereketYesili }}>+{satis.toplam_tutar.toFixed(2)} TL</td>
                    <td style={{ padding: '14px', color: RENK.yaziAcik }}>{new Date(satis.satis_tarihi).toLocaleString('tr-TR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default App;