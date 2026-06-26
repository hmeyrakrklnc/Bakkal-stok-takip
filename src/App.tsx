import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css'; 

// BAKKAL ESNAF RENK PALETİ
const RENK = {
  arkaPlan: '#fdfbf7',
  kartArkaPlan: '#ffffff',
  yaziKoyu: '#333333',
  yaziAcik: '#666666',
  Kenarlik: '#e0e0e0',
  esnafKahve: '#5d4037',
  esnafKahveAcik: '#8d6e63',
  bereketYesili: '#2e7d32',
  yesilArkaPlan: '#e8f5e9',
  lojistikMavisi: '#1565c0',
  maviArkaPlan: '#eceff1',
  kritikTuruncu: '#ef6c00',
  turuncuArkaPlan: '#fff3e0',
  bittiKirmizi: '#c62828',
  kirmiziArkaPlan: '#ffebee',
};

interface Urun {
  id: number;
  urun_adi: string;
  fiyat: number;
  stok: number;
  kritik_stok: number; 
}

interface Satis {
  id: number;
  urunler: { urun_adi: string; fiyat: number } | null;
  satilan_adet: number;
  toplam_tutar: number;
  satis_tarihi: string;
}

interface ToptanciGirisi {
  id: number;
  urunler: { urun_adi: string } | null;
  adet: number;
  tarih: string;
}

function App() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [satislar, setSatislar] = useState<Satis[]>([]);
  const [toptanciGirisleri, setToptanciGirisleri] = useState<ToptanciGirisi[]>([]);
  
  const [secilenUrunId, setSecilenUrunId] = useState<string>('');
  const [satisAdedi, setSatisAdedi] = useState<string>('1');
  
  const [stokUrunId, setStokUrunId] = useState<string>('');
  const [eklenecekStok, setEklenecekStok] = useState<string>('1');

  const [yeniUrunAdi, setYeniUrunAdi] = useState<string>('');
  const [yeniUrunFiyat, setYeniUrunFiyat] = useState<string>('');
  const [yeniUrunStok, setYeniUrunStok] = useState<string>('');
  const [yeniUrunKritikStok, setYeniUrunKritikStok] = useState<string>('10'); 

  useEffect(() => {
    verileriGetir();
  }, []);

  const verileriGetir = () => {
    urunleriGetir();
    satislariGetir();
    toptanciGirisleriniGetir();
  };

  const urunleriGetir = async () => {
    const { data, error } = await supabase.from('urunler').select('*').order('urun_adi', { ascending: true });
    if (!error) setUrunler(data || []);
  };

  // SİLME FONKSİYONU EKLENDİ
  const urunSil = async (id: number, urunAdi: string) => {
    if (window.confirm(`"${urunAdi}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      const { error } = await supabase.from('urunler').delete().eq('id', id);
      if (error) {
        alert("Hata: " + error.message);
      } else {
        alert("Ürün başarıyla silindi.");
        verileriGetir();
      }
    }
  };

  const satislariGetir = async () => {
    const { data, error } = await supabase
      .from('satislar')
      .select('id, satilan_adet, toplam_tutar, satis_tarihi, urunler(urun_adi, fiyat)')
      .order('satis_tarihi', { ascending: false });

    if (!error) setSatislar((data as any) || []);
  };

  const toptanciGirisleriniGetir = async () => {
    const { data, error } = await supabase
      .from('toptanci_girisleri')
      .select('id, adet, tarih, urunler(urun_adi)')
      .order('tarih', { ascending: false })
      .limit(10); 

    if (!error) setToptanciGirisleri((data as any) || []);
  };

  const yeniUrunKaydet = async () => {
    const fiyatNum = parseFloat(yeniUrunFiyat);
    const stokNum = parseInt(yeniUrunStok);
    const kritikNum = parseInt(yeniUrunKritikStok);

    if (!yeniUrunAdi.trim() || !fiyatNum || isNaN(stokNum) || isNaN(kritikNum)) {
      alert("Lütfen tüm alanları geçerli şekilde doldurun!");
      return;
    }

    const { error } = await supabase
      .from('urunler')
      .insert([{ urun_adi: yeniUrunAdi.trim(), fiyat: fiyatNum, stok: stokNum, kritik_stok: kritikNum }]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert(`"${yeniUrunAdi}" başarıyla eklendi!`);
      setYeniUrunAdi('');
      setYeniUrunFiyat('');
      setYeniUrunStok('');
      setYeniUrunKritikStok('10');
      verileriGetir();
    }
  };

  const satisYap = async () => {
    const urun = urunler.find(u => u.id === parseInt(secilenUrunId));
    const adet = parseInt(satisAdedi);

    if (!urun || !adet || adet <= 0) return;
    if (urun.stok < adet) {
      alert(`Yetersiz stok! Mevcut: ${urun.stok}`);
      return;
    }

    await supabase.from('urunler').update({ stok: urun.stok - adet }).eq('id', urun.id);
    await supabase.from('satislar').insert([{ urun_id: urun.id, satilan_adet: adet, toplam_tutar: urun.fiyat * adet }]);

    setSecilenUrunId('');
    setSatisAdedi('1');
    verileriGetir();
  };

  const stokEkle = async () => {
    const urun = urunler.find(u => u.id === parseInt(stokUrunId));
    const adet = parseInt(eklenecekStok);

    if (!urun || !adet || adet <= 0) return;

    await supabase.from('urunler').update({ stok: urun.stok + adet }).eq('id', urun.id);
    await supabase.from('toptanci_girisleri').insert([{ urun_id: urun.id, adet: adet }]);

    setStokUrunId('');
    setEklenecekStok('1');
    verileriGetir();
  };

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
    <>
      <style>{`
        .grid-ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px; }
        .grid-uclu { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        @media (max-width: 768px) {
          .grid-ikili { grid-template-columns: 1fr; }
          .grid-uclu { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ padding: '20px', fontFamily: '"Segoe UI", Roboto, sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: RENK.arkaPlan, minHeight: '100vh' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px', padding: '25px 20px', backgroundColor: RENK.kartArkaPlan, borderRadius: '16px', boxShadow: '0 4px 20px rgba(93, 64, 55, 0.06)', border: `1px solid ${RENK.Kenarlik}` }}>
          <h1 style={{ margin: 0, color: RENK.esnafKahve, fontSize: '2.4rem', fontWeight: '700' }}>🏪 Mahalle Bakkalı Esnaf Paneli</h1>
        </header>

        {/* İKİLİ HIZLI İŞLEM PANELİ */}
        <div className="grid-ikili">
          <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, border: `1px solid ${RENK.Kenarlik}` }}>
            <h3 style={{ margin: '0 0 20px 0', color: RENK.bereketYesili, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>💰 Hızlı Müşteri Satışı</h3>
            <select value={secilenUrunId} onChange={(e) => setSecilenUrunId(e.target.value)} style={{...ortakInputStili, marginBottom: '15px'}}>
              <option value="">-- Ürün Seçin --</option>
              {urunler.map(u => <option key={u.id} value={u.id}>{u.urun_adi} ({u.fiyat} TL)</option>)}
            </select>
            <input type="number" value={satisAdedi} onChange={(e) => setSatisAdedi(e.target.value)} style={{...ortakInputStili, marginBottom: '20px'}} />
            <button onClick={satisYap} style={{ width: '100%', padding: '14px', backgroundColor: RENK.bereketYesili, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Satışı Tamamla</button>
          </div>

          <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, border: `1px solid ${RENK.Kenarlik}` }}>
            <h3 style={{ margin: '0 0 20px 0', color: RENK.lojistikMavisi, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>🚚 Toptancı Geldi (Stok Girişi)</h3>
            <select value={stokUrunId} onChange={(e) => setStokUrunId(e.target.value)} style={{...ortakInputStili, marginBottom: '15px'}}>
              <option value="">-- Gelen Ürünü Seçin --</option>
              {urunler.map(u => <option key={u.id} value={u.id}>{u.urun_adi}</option>)}
            </select>
            <input type="number" value={eklenecekStok} onChange={(e) => setEklenecekStok(e.target.value)} style={{...ortakInputStili, marginBottom: '20px'}} />
            <button onClick={stokEkle} style={{ width: '100%', padding: '14px', backgroundColor: RENK.lojistikMavisi, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Stoğu Depoya Ekle</button>
          </div>
        </div>

        {/* YENİ ÜRÜN EKLEME PANELİ */}
        <div style={{ padding: '25px', borderRadius: '16px', backgroundColor: RENK.kartArkaPlan, border: `1px solid ${RENK.Kenarlik}`, marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: RENK.esnafKahve, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>✨ Tezgâha Yeni Ürün Ekle</h3>
          <div className="grid-uclu">
            <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Ürün Adı:</label><input type="text" value={yeniUrunAdi} onChange={(e) => setYeniUrunAdi(e.target.value)} style={ortakInputStili} /></div>
            <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Fiyat (TL):</label><input type="number" value={yeniUrunFiyat} onChange={(e) => setYeniUrunFiyat(e.target.value)} style={ortakInputStili} /></div>
            <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Başlangıç Stoğu:</label><input type="number" value={yeniUrunStok} onChange={(e) => setYeniUrunStok(e.target.value)} style={ortakInputStili} /></div>
            <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: RENK.yaziKoyu }}>Kritik Uyarı Seviyesi:</label><input type="number" value={yeniUrunKritikStok} onChange={(e) => setYeniUrunKritikStok(e.target.value)} style={ortakInputStili} /></div>
          </div>
          <button onClick={yeniUrunKaydet} style={{ width: '100%', padding: '14px', backgroundColor: RENK.esnafKahve, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Yeni Ürünü Kaydet</button>
        </div>

        {/* RAFLAR VE STOK DURUM TABLOSU */}
        <section style={{ backgroundColor: RENK.kartArkaPlan, padding: '25px', borderRadius: '16px', border: `1px solid ${RENK.Kenarlik}`, marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 20px 0', color: RENK.esnafKahve, fontSize: '1.4rem', fontWeight: '600' }}>📋 Raflardaki Mal Durumu</h2>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${RENK.Kenarlik}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: RENK.turuncuArkaPlan }}>
                  <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Ürün Adı</th>
                  <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Satış Fiyatı</th>
                  <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Kalan Stok</th>
                  <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>Durum Raporu</th>
                  <th style={{ padding: '14px', color: RENK.esnafKahve, fontWeight: '600' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {urunler.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: RENK.yaziAcik }}>Ürün listesi boş.</td></tr>
                ) : (
                  urunler.map(urun => (
                    <tr key={urun.id} style={{ borderBottom: `1px solid ${RENK.Kenarlik}` }}>
                      <td style={{ padding: '14px', fontWeight: 'bold', color: RENK.yaziKoyu }}>{urun.urun_adi}</td>
                      <td style={{ padding: '14px', color: RENK.yaziAcik }}>{urun.fiyat.toFixed(2)} TL</td>
                      <td style={{ padding: '14px', fontWeight: '600', color: RENK.yaziKoyu }}>{urun.stok} Adet</td>
                      <td style={{ padding: '14px' }}>
                        {urun.stok === 0 ? (
                          <span style={{ backgroundColor: RENK.kirmiziArkaPlan, color: RENK.bittiKirmizi, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Bitti! ❌</span>
                        ) : urun.stok <= urun.kritik_stok ? (
                          <span style={{ backgroundColor: RENK.turuncuArkaPlan, color: RENK.kritikTuruncu, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Kritik ⚠️</span>
                        ) : (
                          <span style={{ backgroundColor: RENK.yesilArkaPlan, color: RENK.bereketYesili, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>Dolu ✓</span>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <button 
                            onClick={() => urunSil(urun.id, urun.urun_adi)} 
                            style={{ backgroundColor: RENK.kirmiziArkaPlan, color: RENK.bittiKirmizi, border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Sil 🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* GEÇMİŞ SATIŞLAR TABLOSU */}
        <section style={{ backgroundColor: RENK.kartArkaPlan, padding: '25px', borderRadius: '16px', border: `1px solid ${RENK.Kenarlik}`, marginBottom: '40px' }}>
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
                  <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: RENK.yaziAcik }}>Henüz defterde kayıtlı bir satış yok.</td></tr>
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

        {/* TOPTANCI GİRİŞLERİ TABLOSU */}
        <section style={{ backgroundColor: RENK.kartArkaPlan, padding: '25px', borderRadius: '16px', border: `1px solid ${RENK.Kenarlik}` }}>
          <h2 style={{ margin: '0 0 20px 0', color: RENK.lojistikMavisi, fontSize: '1.4rem', fontWeight: '600' }}>📦 Son Toptancı Girişleri</h2>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${RENK.Kenarlik}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: RENK.maviArkaPlan }}>
                  <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Ürün</th>
                  <th style={{ padding: '14px', color: RENK.yaziKoyu, fontWeight: '600' }}>Eklenen Miktar</th>
                </tr>
              </thead>
              <tbody>
                {toptanciGirisleri.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: '20px', textAlign: 'center', color: RENK.yaziAcik }}>Henüz toptancıdan gelen mal yok.</td></tr>
                ) : (
                  toptanciGirisleri.map(giris => (
                    <tr key={giris.id} style={{ borderBottom: `1px solid ${RENK.Kenarlik}` }}>
                      <td style={{ padding: '14px', fontWeight: '500', color: RENK.yaziKoyu }}>{giris.urunler?.urun_adi}</td>
                      <td style={{ padding: '14px', color: RENK.lojistikMavisi, fontWeight: 'bold' }}>+{giris.adet} Adet</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </>
  );
}

export default App;