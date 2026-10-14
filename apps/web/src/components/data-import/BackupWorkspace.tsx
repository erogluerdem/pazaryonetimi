'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Database, ShieldCheck, RefreshCw, Download, KeyRound, CheckCircle2, Clock } from 'lucide-react';

type Backup = {
  id: string;
  type: string;
  status: string;
  name?: string;
  createdAt: string;
  compressedSize?: number;
  verificationStatus?: string;
  error?: string;
};

type Schedule = {
  id: string;
  type: string;
  isActive: boolean;
  nextRunAt?: string;
};

type Restore = {
  id: string;
  backupId: string;
  status: string;
  error?: string;
  targetDatabase?: string;
  dryRun?: boolean;
};

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api/backup' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'İşlem başarısız');
  return data;
}

export default function BackupWorkspace() {
  const { data: session } = useSession();
  const admin = ['ADMIN', 'SUPERADMIN'].includes((session?.user as { type?: string } | undefined)?.type || '');
  const [jobs, setJobs] = useState<Backup[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [restores, setRestores] = useState<Restore[]>([]);
  const [type, setType] = useState('catalog');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    const [jobs, plans, restores] = await Promise.all([
      call<Backup[]>('/jobs'),
      call<Schedule[]>('/schedules'),
      call<Restore[]>('/restores'),
    ]);
    setJobs(jobs);
    setSchedules(plans);
    setRestores(restores);
  }

  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
    const timer = setInterval(() => {
      void refresh().catch((e) => setError(e.message));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function run(id: string, task: () => Promise<void>) {
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await task();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setBusy('');
    }
  }

  const label = (status: string) =>
    status === 'completed'
      ? 'Tamamlandı'
      : status === 'failed'
      ? 'Başarısız'
      : status.startsWith('processing')
      ? 'İşleniyor'
      : status === 'queued'
      ? 'Kuyrukta'
      : status;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Database className="text-primary" /> Yedekleme, Geri Yükleme ve Anahtar Güvenliği
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Gerçek pg_dump arşivi oluşturun, ENCRYPTION_KEY escrow zarfı ile saklayın ve otomatik tatbikatla kurtarma doğrulaması yapın.
        </p>
      </div>

      {/* Escrow & DR Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
          <KeyRound className="text-emerald-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">ENCRYPTION_KEY Güvenli Escrow</h3>
            <p className="text-xs text-slate-400 mt-1">
              Veritabanı yedeği alındığında, pazaryeri API anahtarlarının kurtarılabilmesi için şifreleme anahtarı parmak izi ile zarflanır (.keybundle.json).
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <Clock className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-300">Otomatik Gece Yedekleme & Tatbikat</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sistem her gece 03:00&apos;te otomatik tam yedek alır ve anında geçici test veritabanında geri yükleme tatbikatı (dry-run) gerçekleştirir.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-border p-6 bg-card">
        <h2 className="font-bold text-base">Manuel Yedek Oluştur veya Planla</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Yedek türü"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background p-2.5 text-sm"
          >
            <option value="catalog">Bu mağazanın ürün kataloğu</option>
            {admin && <option value="database">Tam sistem veritabanı (PostgreSQL)</option>}
          </select>
          <button
            disabled={!!busy}
            onClick={() =>
              void run('create', async () => {
                await call('/create', 'POST', { type });
                setMessage('Yedek işi kaydedildi. Sonucu aşağıdan takip edebilirsiniz.');
              })
            }
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-primary/90 transition-all"
          >
            Hemen Yedek Al
          </button>
          <button
            disabled={!!busy}
            onClick={() =>
              void run('schedule', async () => {
                await call('/schedules', 'POST', { type });
                setMessage('Günlük otomatik yedekleme planı etkinleştirildi.');
              })
            }
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-muted transition-all"
          >
            Her Gün Otomatik Yedekle
          </button>
          <button
            disabled={!!busy}
            onClick={() => void run('refresh', refresh)}
            className="rounded-xl border border-border p-2.5 hover:bg-muted transition-all"
            title="Yenile"
          >
            <RefreshCw size={18} className={busy === 'refresh' ? 'animate-spin' : ''} />
          </button>
        </div>

        {schedules
          .filter((plan) => plan.isActive)
          .map((plan) => (
            <div key={plan.id} className="flex justify-between items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-400" />
                Günlük {plan.type === 'catalog' ? 'katalog' : 'veritabanı (pg_dump)'} yedeği · Sonraki çalışma: {plan.nextRunAt ? new Date(plan.nextRunAt).toLocaleString('tr-TR') : '03:00 TSİ'}
              </span>
              <button
                disabled={!!busy}
                onClick={() =>
                  void run('stop', async () => {
                    await call('/schedules/' + plan.id, 'DELETE');
                  })
                }
                className="text-xs text-red-400 hover:text-red-300"
              >
                Planı Durdur
              </button>
            </div>
          ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Kayıtlı Yedek Arşivleri ve Anahtar Durumu</h2>
        {!jobs.length ? (
          <p className="text-sm text-slate-500">Henüz yedek bulunmuyor.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-border p-4 bg-card/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{job.name || job.type}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${job.status === 'completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                        {label(job.status)}
                      </span>
                      {job.type === 'database' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center gap-1">
                          <KeyRound size={10} /> Escrow Korunuyor
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Tarih: {new Date(job.createdAt).toLocaleString('tr-TR')} · Boyut: {job.compressedSize ? Math.round(job.compressedSize / 1024) + ' KB' : 'Hesaplanıyor'} · SHA-256 Bütünlük: {job.verificationStatus === 'verified' ? '✅ Doğrulandı' : job.verificationStatus === 'failed' ? '❌ Hatalı' : '⏳ Bekliyor'}
                    </p>
                  </div>
                  {job.status === 'completed' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          void run(job.id, async () => {
                            const result = await call<{ message: string }>('/jobs/' + job.id + '/verify', 'POST', {});
                            setMessage(result.message);
                          })
                        }
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all"
                      >
                        Bütünlük & Escrow Doğrula
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          void run('restore', async () => {
                            await call('/jobs/' + job.id + '/test-restore', 'POST', {});
                            setMessage('Geri yükleme tatbikatı kuyruğa alındı. Üretim veritabanı etkilenmez.');
                          })
                        }
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all"
                      >
                        Tatbikat Yap (Test Restore)
                      </button>
                      <a
                        href={'/api/backup/jobs/' + job.id + '/download'}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all"
                      >
                        <Download size={13} /> Şifreli Arşiv (.tar.gz)
                      </a>
                    </div>
                  )}
                </div>
                {job.error && <p className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">{job.error}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="text-emerald-400" /> Düzenli Geri Yükleme Tatbikatları (Restore Drills)
        </h2>
        {!restores.length ? (
          <p className="text-sm text-slate-500">
            Henüz tatbikat kaydı yok. Sistem gece yedeklerinden sonra otomatik olarak izole test alanında geri yükleme tatbikatı yapar.
          </p>
        ) : (
          <div className="space-y-2">
            {restores.map((job) => (
              <div key={job.id} className="rounded-xl border border-border p-3.5 text-sm bg-card/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">Yedek: {job.backupId.slice(0, 8)}...</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      {label(job.status)}
                    </span>
                    <span className="text-[10px] text-slate-500">Dry-Run (İzole Test Ortamı)</span>
                  </div>
                  {job.targetDatabase && (
                    <p className="mt-1 text-xs text-slate-400">İzole tatbikat veritabanında tüm tablolar ve kayıtlar test edildi.</p>
                  )}
                </div>
                {job.error && <p className="text-xs text-red-400">{job.error}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
