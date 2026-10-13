"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  CreditCard,
  FileText,
  MessageSquare,
  Mail,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TestTube2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Shield,
  Copy,
  AlertTriangle,
} from 'lucide-react';

// ─── Servis tipleri tanımı ──────────────────────────────────────────────────

interface ServiceGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  services: ServiceDef[];
}

interface ServiceDef {
  type: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  required?: boolean;
  extra?: boolean;
}

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'SHIPPING',
    label: 'Kargo Entegrasyonları',
    icon: Truck,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    services: [
      {
        type: 'SHIPPING_ARAS',
        label: 'Aras Kargo',
        description: 'Aras Kargo otomatik sevkiyat ve takip',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://customerws.araskargo.com.tr/arascargoservice.asmx', required: false },
          { key: 'apiKey', label: 'Web Servis Kullanıcı Adı', placeholder: 'EsasWeb kullanıcı adınız', required: true },
          { key: 'apiSecret', label: 'Web Servis Şifre', placeholder: 'EsasWeb şifreniz', secret: true, required: true },
          { key: 'customerCode', label: 'Müşteri Kodu (SetOrder)', placeholder: 'Opsiyonel — farklıysa girin', required: false, extra: true },
        ],
      },
      {
        type: 'SHIPPING_YURTICI',
        label: 'Yurtiçi Kargo',
        description: 'Yurtiçi Kargo otomatik sevkiyat ve takip',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://ws.yurticikargo.com/...', required: false },
          { key: 'apiKey', label: 'Kullanıcı Adı', placeholder: 'Yurtiçi kullanıcı adınız', required: true },
          { key: 'apiSecret', label: 'Şifre', placeholder: 'Yurtiçi şifreniz', secret: true, required: true },
        ],
      },
      {
        type: 'SHIPPING_MNG',
        label: 'MNG Kargo',
        description: 'MNG Kargo otomatik sevkiyat ve takip',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://api.mngkargo.com.tr/...', required: false },
          { key: 'apiKey', label: 'API Token', placeholder: 'MNG API token', required: true },
          { key: 'apiSecret', label: 'Secret', placeholder: 'MNG secret', secret: true, required: false },
        ],
      },
      {
        type: 'SHIPPING_PTT',
        label: 'PTT Kargo',
        description: 'PTT Kargo otomatik sevkiyat ve takip',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://pttapi.ptt.gov.tr/...', required: false },
          { key: 'apiKey', label: 'Kullanıcı Adı', placeholder: 'PTT kullanıcı adınız', required: true },
          { key: 'apiSecret', label: 'Şifre', placeholder: 'PTT şifreniz', secret: true, required: true },
        ],
      },
    ],
  },
  {
    id: 'PAYMENT',
    label: 'Ödeme Entegrasyonları',
    icon: CreditCard,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    services: [
      {
        type: 'PAYMENT_IYZICO',
        label: 'iyzico',
        description: 'iyzico ödeme altyapısı — kredi kartı, taksit, 3D Secure',
        fields: [
          { key: 'apiUrl', label: 'Base URL', placeholder: 'https://sandbox-api.iyzipay.com', required: true },
          { key: 'apiKey', label: 'API Key', placeholder: 'iyzico API Key', required: true },
          { key: 'apiSecret', label: 'Secret Key', placeholder: 'iyzico Secret Key', secret: true, required: true },
        ],
      },
      {
        type: 'PAYMENT_PAYTR',
        label: 'PayTR',
        description: 'PayTR ödeme altyapısı',
        fields: [
          { key: 'apiKey', label: 'Merchant ID', placeholder: 'PayTR Merchant ID', required: true },
          { key: 'apiSecret', label: 'Merchant Key', placeholder: 'PayTR Merchant Key', secret: true, required: true },
        ],
      },
      {
        type: 'PAYMENT_PARAM',
        label: 'Param',
        description: 'Param ödeme altyapısı',
        fields: [
          { key: 'apiKey', label: 'Client Code', placeholder: 'Param Client Code', required: true },
          { key: 'apiSecret', label: 'Client Secret', placeholder: 'Param Client Secret', secret: true, required: true },
        ],
      },
    ],
  },
  {
    id: 'EINVOICE',
    label: 'E-Fatura Entegrasyonları',
    icon: FileText,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    services: [
      {
        type: 'EINVOICE_FORIBA',
        label: 'Foriba / Fitbul',
        description: 'Foriba e-fatura entegratörü (GİB onaylı)',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://efatura.foriba.com/api/...', required: true },
          { key: 'apiKey', label: 'API Key', placeholder: 'Foriba API Key', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'Foriba API Secret', secret: true, required: true },
        ],
      },
      {
        type: 'EINVOICE_LOGO',
        label: 'Logo E-Fatura',
        description: 'Logo e-fatura entegratörü (GİB onaylı)',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://efatura.logo.com.tr/...', required: true },
          { key: 'apiKey', label: 'API Key', placeholder: 'Logo API Key', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'Logo API Secret', secret: true, required: true },
        ],
      },
      {
        type: 'EINVOICE_PARASUT',
        label: 'Paraşüt',
        description: 'Paraşüt e-fatura entegrasyonu',
        fields: [
          { key: 'apiKey', label: 'Client ID', placeholder: 'Paraşüt Client ID', required: true },
          { key: 'apiSecret', label: 'Client Secret', placeholder: 'Paraşüt Client Secret', secret: true, required: true },
        ],
      },
      {
        type: 'EINVOICE_EFINANS',
        label: 'eFinans',
        description: 'eFinans e-fatura entegrasyonu',
        fields: [
          { key: 'apiUrl', label: 'API URL', placeholder: 'https://efatura.efinans.com.tr/...', required: true },
          { key: 'apiKey', label: 'Kullanıcı Adı', placeholder: 'eFinans kullanıcı adı', required: true },
          { key: 'apiSecret', label: 'Şifre', placeholder: 'eFinans şifre', secret: true, required: true },
        ],
      },
    ],
  },
  {
    id: 'SMS',
    label: 'SMS Entegrasyonları',
    icon: MessageSquare,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    services: [
      {
        type: 'SMS_NETGSM',
        label: 'NetGSM',
        description: 'NetGSM toplu SMS gönderimi',
        fields: [
          { key: 'apiKey', label: 'Kullanıcı Kodu', placeholder: 'NetGSM kullanıcı kodunuz', required: true },
          { key: 'apiSecret', label: 'Şifre', placeholder: 'NetGSM şifreniz', secret: true, required: true },
        ],
      },
      {
        type: 'SMS_ILETIMERKEZI',
        label: 'İletimerkezi',
        description: 'İletimerkezi toplu SMS gönderimi',
        fields: [
          { key: 'apiKey', label: 'API Username', placeholder: 'İletimerkezi kullanıcı adı', required: true },
          { key: 'apiSecret', label: 'API Pass', placeholder: 'İletimerkezi şifre', secret: true, required: true },
        ],
      },
    ],
  },
  {
    id: 'EMAIL',
    label: 'E-posta Entegrasyonları',
    icon: Mail,
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    services: [
      {
        type: 'EMAIL_SMTP',
        label: 'SMTP',
        description: 'Özel SMTP sunucusu ile e-posta gönderimi',
        fields: [
          { key: 'apiUrl', label: 'Sunucu:Port', placeholder: 'smtp.example.com:587', required: true },
          { key: 'apiKey', label: 'Kullanıcı Adı', placeholder: 'SMTP kullanıcı adı', required: true },
          { key: 'apiSecret', label: 'Şifre', placeholder: 'SMTP şifre', secret: true, required: true },
        ],
      },
      {
        type: 'EMAIL_SENDGRID',
        label: 'SendGrid',
        description: 'SendGrid e-posta servisi',
        fields: [
          { key: 'apiKey', label: 'API Key', placeholder: 'SG.xxxxx', required: true },
        ],
      },
    ],
  },
];

// ─── Tip tanımları ──────────────────────────────────────────────────────────

interface SavedCredential {
  id: string;
  serviceType: string;
  label: string | null;
  apiUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  isActive: boolean;
  isDefault: boolean;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
}

// ─── Component: Form Modal ─────────────────────────────────────────────────

function CredentialFormModal({
  serviceType,
  fieldDefs,
  existing,
  onSave,
  onClose,
}: {
  serviceType: string;
  fieldDefs: FieldDef[];
  existing?: SavedCredential | null;
  onSave: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    label: existing?.label ?? '',
  });
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {existing ? 'Kimlik Bilgilerini Düzenle' : 'Yeni Bağlantı Ekle'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{serviceType.replace('_', ' ')}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Etiket (isteğe bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: Kurumsal Aras Hesabı"
              value={form.label ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {fieldDefs.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <div className="relative">
                <input
                  type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                {field.secret && (
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSecret[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault === 'true'}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked ? 'true' : 'false' }))}
              className="rounded border-slate-600 text-indigo-500"
            />
            <label htmlFor="isDefault" className="text-sm text-slate-300">
              Bu servis tipi için varsayılan olarak kullan
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Component: Credential Card ─────────────────────────────────────────────

function CredentialCard({
  cred,
  onDelete,
  onTest,
  onRotate,
}: {
  cred: SavedCredential;
  onDelete: () => Promise<void>;
  onTest: () => Promise<void>;
  onRotate: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${cred.isActive ? 'bg-green-400' : 'bg-slate-500'}`} />
        <div>
          <p className="text-sm font-medium text-white">
            {cred.label || cred.serviceType}
            {cred.isDefault && (
              <span className="ml-2 text-xs text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">varsayılan</span>
            )}
          </p>
          {cred.lastTestedAt && (
            <p className="text-xs text-slate-500 mt-0.5">
              Son test: {new Date(cred.lastTestedAt).toLocaleString('tr-TR')} —{' '}
              {cred.lastTestOk ? (
                <span className="text-green-400">Başarılı</span>
              ) : (
                <span className="text-red-400">Başarısız</span>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={async () => { setTesting(true); await onTest(); setTesting(false); }}
          disabled={testing}
          title="Bağlantıyı Test Et"
          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
        >
          <TestTube2 size={15} />
        </button>
        <button
          onClick={onRotate}
          title="Anahtarı Rotasyona Al"
          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
        <button
          onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); }}
          disabled={deleting}
          title="Sil"
          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Component: Service Group Section ───────────────────────────────────────

function ServiceGroupSection({ group, credentials, onRefresh }: {
  group: ServiceGroup;
  credentials: SavedCredential[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [openRotateId, setOpenRotateId] = useState<string | null>(null);
  const [rotateForm, setRotateForm] = useState({ apiKey: '', apiSecret: '', apiUrl: '' });
  const Icon = group.icon;

  const connectedCount = credentials.filter(
    (c) => group.services.some((s) => s.type === c.serviceType),
  ).length;

  const handleSave = async (serviceType: string, data: Record<string, string>) => {
    const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const serviceDef = group.services.find((s) => s.type === serviceType);
    const apiExtra: Record<string, string> = {};

    for (const field of serviceDef?.fields ?? []) {
      if (field.extra && data[field.key]?.trim()) {
        apiExtra[field.key] = data[field.key].trim();
      }
    }

    await fetch(`${API}/tenant-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        serviceType,
        label: data.label || undefined,
        apiUrl: data.apiUrl || undefined,
        apiKey: data.apiKey || undefined,
        apiSecret: data.apiSecret || undefined,
        apiExtra: Object.keys(apiExtra).length > 0 ? apiExtra : undefined,
        isDefault: data.isDefault === 'true',
      }),
    });
    setOpenForm(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    await fetch(`${API}/tenant-credentials/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    onRefresh();
  };

  const handleTest = async (id: string) => {
    const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    await fetch(`${API}/tenant-credentials/${id}/test`, {
      method: 'POST',
      credentials: 'include',
    });
    onRefresh();
  };

  const handleRotate = async (id: string) => {
    const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    await fetch(`${API}/tenant-credentials/${id}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        apiKey: rotateForm.apiKey || undefined,
        apiSecret: rotateForm.apiSecret || undefined,
        apiUrl: rotateForm.apiUrl || undefined,
      }),
    });
    setOpenRotateId(null);
    setRotateForm({ apiKey: '', apiSecret: '', apiUrl: '' });
    onRefresh();
  };

  return (
    <div className={`rounded-2xl border ${group.borderColor} bg-slate-900/60 overflow-hidden`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${group.bgColor}`}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{group.label}</p>
            <p className="text-sm text-slate-400">
              {connectedCount > 0
                ? `${connectedCount} bağlantı aktif`
                : 'Henüz bağlantı yok'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connectedCount > 0 && (
            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              {connectedCount} aktif
            </span>
          )}
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-slate-700/50 p-4 space-y-4">
              {group.services.map((svc) => {
                const svcCreds = credentials.filter((c) => c.serviceType === svc.type);
                return (
                  <div key={svc.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{svc.label}</p>
                        <p className="text-xs text-slate-500">{svc.description}</p>
                      </div>
                      <button
                        onClick={() => setOpenForm(svc.type)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={13} />
                        Ekle
                      </button>
                    </div>

                    {svcCreds.length > 0 && (
                      <div className="space-y-2">
                        {svcCreds.map((cred) => (
                          <CredentialCard
                            key={cred.id}
                            cred={cred}
                            onDelete={() => handleDelete(cred.id)}
                            onTest={() => handleTest(cred.id)}
                            onRotate={() => setOpenRotateId(cred.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Rotasyon formu */}
                    {openRotateId && svcCreds.some((c) => c.id === openRotateId) && (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                          <AlertTriangle size={15} />
                          Anahtar Rotasyonu
                        </div>
                        <p className="text-xs text-slate-400">
                          Yeni bilgileri girin. Doğrulanırsa eski bilgiler otomatik deaktive edilir.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Yeni API Key / Kullanıcı Adı"
                            value={rotateForm.apiKey}
                            onChange={(e) => setRotateForm((f) => ({ ...f, apiKey: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          />
                          <input
                            type="password"
                            placeholder="Yeni API Secret / Şifre"
                            value={rotateForm.apiSecret}
                            onChange={(e) => setRotateForm((f) => ({ ...f, apiSecret: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setOpenRotateId(null); setRotateForm({ apiKey: '', apiSecret: '', apiUrl: '' }); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                          >
                            İptal
                          </button>
                          <button
                            onClick={() => handleRotate(openRotateId)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                          >
                            Rotasyonu Onayla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
              {openForm && (
                <CredentialFormModal
                  serviceType={openForm}
                  fieldDefs={group.services.find((s) => s.type === openForm)?.fields ?? []}
                  onSave={(data) => handleSave(openForm, data)}
                  onClose={() => setOpenForm(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component: Webhook Secret Panel ────────────────────────────────────────

function WebhookSecretPanel() {
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const fetchSecret = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenant-credentials/webhook-secret`, { credentials: 'include' });
      const data = await res.json();
      setSecret(data.secret);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const rotateSecret = async () => {
    if (!confirm('Webhook secret yenilenirse mevcut entegrasyonlarınızın güncellenmesi gerekir. Devam edilsin mi?')) return;
    setRotating(true);
    try {
      const res = await fetch(`${API}/tenant-credentials/webhook-secret/rotate`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setSecret(data.secret);
      setVisible(true);
    } finally {
      setRotating(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-slate-700">
          <Shield size={20} className="text-slate-300" />
        </div>
        <div>
          <p className="font-semibold text-white">Webhook İmzalama Secret</p>
          <p className="text-sm text-slate-400">Gelen webhook isteklerini doğrulamak için kullanılır</p>
        </div>
      </div>

      {!secret ? (
        <button
          onClick={fetchSecret}
          disabled={loading}
          className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-60"
        >
          {loading ? 'Yükleniyor...' : 'Secret Görüntüle'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-xl font-mono text-sm">
            <span className="flex-1 text-green-300 break-all">
              {visible ? secret : '•'.repeat(64)}
            </span>
            <button onClick={() => setVisible((v) => !v)} className="text-slate-400 hover:text-white shrink-0">
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={copySecret} className="text-slate-400 hover:text-green-400 shrink-0">
              {copied ? <CheckCircle2 size={15} className="text-green-400" /> : <Copy size={15} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={rotateSecret}
              disabled={rotating}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} />
              {rotating ? 'Yenileniyor...' : 'Secret Yenile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ───────────────────────────────────────────────────────────────

export default function ServiceIntegrationsPage() {
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [loading, setLoading] = useState(true);

  const API = (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001'))) ? '' : (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenant-credentials`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch {
      // Geliştirme ortamında sessizce devam et
    } finally {
      setLoading(false);
    }
  }, [API]);

  React.useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Servis Entegrasyonları</h1>
        <p className="text-slate-400 mt-1">
          Kargo, ödeme, e-fatura ve diğer servislerin bağlantı bilgilerini yönetin.
          Tüm bilgiler şifreli olarak saklanır.
        </p>
      </div>

      {/* Bilgi Kutusu */}
      <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">
        <Shield size={18} className="shrink-0 mt-0.5" />
        <p>
          Girilen API anahtarları ve şifreler <strong>AES-256-GCM</strong> ile şifrelenerek
          veritabanında güvenli biçimde saklanır. Hiçbir bilgi sunucularda düz metin
          olarak tutulmaz.
        </p>
      </div>

      {/* Servis Grupları */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {SERVICE_GROUPS.map((group) => (
            <ServiceGroupSection
              key={group.id}
              group={group}
              credentials={credentials}
              onRefresh={fetchCredentials}
            />
          ))}
        </div>
      )}

      {/* Webhook Secret Paneli */}
      <WebhookSecretPanel />
    </div>
  );
}
