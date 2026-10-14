"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  Loader2,
  Sparkles,
  Shield,
  Key,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Lock,
} from 'lucide-react';

// Types
interface MarketplaceField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea' | 'url';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

interface MarketplaceConfig {
  id: string;
  name: string;
  slug: string;
  logo: string;
  brandColor: string;
  website: string;
  apiType: string;
  authType: string;
  sandboxAvailable: boolean;
  requiredFields: MarketplaceField[];
  description: string;
}

interface ConnectionWizardProps {
  marketplace: MarketplaceConfig;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: Record<string, string | boolean>) => Promise<{ success: boolean; verified: boolean; message?: string }>;
  onTest: (credentials: Record<string, string | boolean>) => Promise<{ success: boolean; message: string; supported?: boolean }>;
}

// Steps
const WIZARD_STEPS = [
  { id: 'intro', title: 'Başlarken', icon: Sparkles },
  { id: 'credentials', title: 'API Bilgileri', icon: Key },
  { id: 'test', title: 'Bağlantı Testi', icon: Zap },
  { id: 'complete', title: 'Tamamlandı', icon: CheckCircle2 },
];

// Input Component
const WizardInput: React.FC<{
  field: MarketplaceField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (field.type === 'select' && field.options) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-xl transition-colors ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
          }`}
        >
          <option value="">Seçiniz...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.helpText && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {field.helpText}
          </p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-xl transition-colors resize-none ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
          }`}
        />
        {field.helpText && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {field.helpText}
          </p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  const isPassword = field.type === 'password';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-xl transition-colors pr-12 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {field.helpText && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {field.helpText}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// Step Indicator
const StepIndicator: React.FC<{ steps: typeof WIZARD_STEPS; currentStep: number }> = ({
  steps,
  currentStep,
}) => (
  <div className="flex items-center justify-center gap-2 py-6">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: currentStep === index ? 1.1 : 1 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            index < currentStep
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : index === currentStep
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          }`}
        >
          {index < currentStep ? (
            <Check className="w-4 h-4" />
          ) : (
            <step.icon className="w-4 h-4" />
          )}
          <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
        </motion.div>
        {index < steps.length - 1 && (
          <div
            className={`w-8 h-0.5 ${
              index < currentStep
                ? 'bg-green-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Main Wizard Component
export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({
  marketplace,
  isOpen,
  onClose,
  onConnect,
  onTest,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [credentials, setCredentials] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    supported?: boolean;
  } | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ verified: boolean; message?: string } | null>(null);

  // Reset state when marketplace changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCredentials({});
      setErrors({});
      setTestResult(null);
      setIsTestMode(false);
    }
  }, [isOpen, marketplace.id]);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Validate credentials
      marketplace.requiredFields.forEach((field) => {
        if (field.required && !String(credentials[field.key] ?? '').trim()) {
          newErrors[field.key] = 'Bu alan zorunludur';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 1) {
      // Go to test step and run test
      setCurrentStep(2);
      setIsLoading(true);
      try {
        const result = await onTest({ ...credentials, isTestMode });
        setTestResult(result);
      } catch (error) {
        setTestResult({
          success: false,
          message: 'Bağlantı testi sırasında bir hata oluştu',
        });
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 2 && testResult?.success) {
      // Complete connection
      setIsLoading(true);
      try {
        const result = await onConnect({ ...credentials, isTestMode });
        if (result.success) {
          setConnectionResult(result);
          setCurrentStep(3);
        } else {
          setTestResult({
            success: false,
            message: result.message || 'Bağlantı kurulamadı',
          });
        }
      } catch (error) {
        setTestResult({
          success: false,
          message: error instanceof Error ? error.message : 'Bağlantı kurulamadı',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setTestResult(null);
  };

  const handleRetryTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const result = await onTest({ ...credentials, isTestMode });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Bağlantı testi sırasında bir hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceConnect = async () => {
    setIsLoading(true);
    try {
      const result = await onConnect({ ...credentials, isTestMode });
      if (result.success) {
          setConnectionResult(result);
        setCurrentStep(3);
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Bağlantı kurulamadı',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Bağlantı kurulamadı',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Intro
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${marketplace.brandColor}20` }}
            >
              <img
                src={marketplace.logo}
                alt={marketplace.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${marketplace.name}&background=${marketplace.brandColor.replace('#', '')}&color=fff&size=80`;
                }}
              />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {marketplace.name} Entegrasyonu
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              {marketplace.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Globe className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {marketplace.apiType} API
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {marketplace.authType}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Lock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AES-256 Şifreleme
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-blue-800 dark:text-orange-200 mb-1">
                    Gerekli Bilgiler
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Bu entegrasyon için {marketplace.name} satıcı panelinizden API bilgilerinizi
                    almanız gerekmektedir.
                  </p>
                  <a
                    href={marketplace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Satıcı Paneline Git
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 1: // Credentials
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  API Bilgilerini Girin
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Lütfen {marketplace.name} API bilgilerinizi aşağıya girin.
                </p>
              </div>

              {marketplace.requiredFields.map((field) => (
                <WizardInput
                  key={field.key}
                  field={field}
                  value={String(credentials[field.key] || '')}
                  onChange={(value) =>
                    setCredentials((prev) => ({ ...prev, [field.key]: value }))
                  }
                  error={errors[field.key]}
                />
              ))}

              {marketplace.sandboxAvailable && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTestMode}
                      onChange={(e) => setIsTestMode(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Test Modu (Stage/Sandbox)
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Trendyol Stage ortamında çalıştır (gerçek işlem yapılmaz)
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>
                    Tüm bilgileriniz AES-256 şifreleme ile güvenli bir şekilde saklanır.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2: // Test
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 text-center"
          >
            {isLoading ? (
              <div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-orange-200 border-t-orange-600 dark:border-orange-800 dark:border-t-blue-400"
                />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Bağlantı Test Ediliyor
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Lütfen bekleyin, API bağlantısı kontrol ediliyor...
                </p>
              </div>
            ) : testResult ? (
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                    testResult.success
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  )}
                </motion.div>

                <h3
                  className={`text-xl font-bold mb-2 ${
                    testResult.success
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {testResult.success ? 'Bağlantı Başarılı!' : 'Bağlantı Başarısız'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {testResult.message}
                </p>

                {!testResult.success && (
                  <div className="space-y-4 max-w-md mx-auto">
                    <button
                      onClick={handleRetryTest}
                      className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Tekrar Dene
                    </button>

                    <button
                      onClick={handleForceConnect}
                      disabled={isLoading || testResult?.supported !== false}
                      className="w-full px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Bilgileri kaydet (doğrulanmadı)
                    </button>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-left">
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Kontrol Edilecekler:
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          API anahtarlarınızın doğru girildiğinden emin olun
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {marketplace.name} satıcı hesabınızın aktif olduğunu kontrol edin
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          API erişim izinlerinin verildiğinden emin olun
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        );

      case 3: // Complete
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>
              </div>

              {/* Confetti Effect */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: Math.cos((i * 30 * Math.PI) / 180) * 80,
                    y: Math.sin((i * 30 * Math.PI) / 180) * 80,
                  }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'][i % 4],
                  }}
                />
              ))}
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {connectionResult?.verified ? 'Mağaza erişimi doğrulandı' : 'Bilgiler kaydedildi'}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8"
            >
              {marketplace.name} hesabınız başarıyla bağlandı. Şimdi ürünlerinizi ve
              siparişlerinizi senkronize edebilirsiniz.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-4 max-w-md mx-auto"
            >
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <FileText className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-blue-800 dark:text-orange-200">
                  Ürünleri İçe Aktar
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Siparişleri Senkronize Et
                </p>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800"
            style={{ background: `linear-gradient(135deg, ${marketplace.brandColor}10, transparent)` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${marketplace.brandColor}20` }}
              >
                <img
                  src={marketplace.logo}
                  alt={marketplace.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${marketplace.name}&background=${marketplace.brandColor.replace('#', '')}&color=fff&size=40`;
                  }}
                />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {marketplace.name} Bağlantısı
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Adım {currentStep + 1} / {WIZARD_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 border-b border-gray-200 dark:border-gray-800">
            <StepIndicator steps={WIZARD_STEPS} currentStep={currentStep} />
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || currentStep === 3}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                currentStep === 0 || currentStep === 3
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>

            {currentStep === 3 ? (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-green-500/20"
              >
                <Check className="w-4 h-4" />
                Tamamla
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isLoading || (currentStep === 2 && !testResult?.success)}
                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                  isLoading || (currentStep === 2 && !testResult?.success)
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r text-white shadow-lg'
                }`}
                style={{
                  background:
                    isLoading || (currentStep === 2 && !testResult?.success)
                      ? undefined
                      : `linear-gradient(135deg, ${marketplace.brandColor}, ${marketplace.brandColor}dd)`,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    {currentStep === 2 && testResult?.success ? 'Bağlantıyı Kur' : 'Devam Et'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConnectionWizard;
