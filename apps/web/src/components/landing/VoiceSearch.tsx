'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, 
    MicOff, 
    Globe, 
    Sparkles,
    Target,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface VoiceSearchProps {
    features?: {
        voiceSearch?: {
            enabled: boolean;
            autoListen: boolean;
            showCommands: boolean;
            language: string;
        };
    };
}

interface VoiceCommand {
    id: string;
    command: string[];
    description: string;
    action: () => void;
    category: string;
}

export const VoiceSearch = ({ features }: VoiceSearchProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            setIsSupported(Boolean(SpeechRecognition));
        }
    }, []);
    const [recognizedCommand, setRecognizedCommand] = useState<VoiceCommand | null>(null);
    const [showCommands, setShowCommands] = useState(false);
    const [volume, setVolume] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showCommandsList = features?.voiceSearch?.showCommands !== false;
    const language = features?.voiceSearch?.language || 'tr-TR';

    const voiceCommands: VoiceCommand[] = useMemo(() => [
        {
            id: 'dashboard',
            command: ['dashboard', 'panel', 'ana sayfa'],
            description: 'Dashboard\'a git',
            action: () => window.open('/dashboard', '_blank'),
            category: 'Navigasyon'
        },
        {
            id: 'products',
            command: ['ürünler', 'stok', 'katalog'],
            description: 'Ürün yönetimi',
            action: () => window.open('/dashboard/products', '_blank'),
            category: 'Ürünler'
        },
        {
            id: 'orders',
            command: ['siparişler', 'satışlar', 'orders'],
            description: 'Sipariş yönetimi',
            action: () => window.open('/dashboard/orders', '_blank'),
            category: 'Siparişler'
        },
        {
            id: 'pricing',
            command: ['fiyatlar', 'ücretler', 'pricing'],
            description: 'Fiyatlandırma sayfası',
            action: () => window.open('/pricing', '_blank'),
            category: 'Fiyatlandırma'
        },
        {
            id: 'help',
            command: ['yardım', 'destek', 'help'],
            description: 'Yardım ve destek',
            action: () => window.open('/destek', '_blank'),
            category: 'Destek'
        },
        {
            id: 'demo',
            command: ['demo', 'tanıtım', 'izle'],
            description: 'Demo başlat',
            action: () => alert('Demo başlatılıyor...'),
            category: 'Demo'
        },
        {
            id: 'search',
            command: ['ara', 'bul', 'search'],
            description: 'Arama yap',
            action: () => {
                const query = transcript.replace(/(ara|bul|search)/gi, '').trim();
                if (query) {
                    window.open(`/search?q=${encodeURIComponent(query)}`, '_blank');
                }
            },
            category: 'Arama'
        },
        {
            id: 'settings',
            command: ['ayarlar', 'ayar', 'settings'],
            description: 'Ayarlar menüsü',
            action: () => window.open('/dashboard/settings', '_blank'),
            category: 'Ayarlar'
        }
    ], [transcript]);

    function stopListening() {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setVolume(0);
        setIsListening(false);
    }

    useEffect(() => {
        if (!features?.voiceSearch?.enabled) return;

        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
                setTranscript('');
            };

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setTranscript(transcript);

                // Check for voice commands
                const command = voiceCommands.find((item) =>
                    item.command.some((keyword) => transcript.toLowerCase().includes(keyword)),
                ) || null;
                if (command) {
                    setRecognizedCommand(command);
                    setTimeout(() => {
                        command.action();
                        setRecognizedCommand(null);
                    }, 1000);
                }

                // Auto-stop after silence
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    stopListening();
                }, 2000);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setError('Ses tanıma hatası. Lütfen tekrar deneyin.');
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, features?.voiceSearch?.enabled, voiceCommands]);

    const startListening = () => {
        if (!recognitionRef.current || !isSupported) return;
        
        try {
            recognitionRef.current.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setError('Ses tanıma başlatılamadı.');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Monitor microphone volume
    useEffect(() => {
        if (!isListening) {
            return;
        }

        const monitorVolume = () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const audioContext = new AudioContext();
                    const analyser = audioContext.createAnalyser();
                    const microphone = audioContext.createMediaStreamSource(stream);
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);

                    analyser.fftSize = 256;
                    microphone.connect(analyser);

                    const checkVolume = () => {
                        if (!isListening) {
                            stream.getTracks().forEach(track => track.stop());
                            return;
                        }

                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        setVolume(average / 255);

                        if (isListening) {
                            requestAnimationFrame(checkVolume);
                        }
                    };

                    checkVolume();
                })
                .catch(err => console.error('Microphone access denied:', err));
        };

        monitorVolume();
    }, [isListening]);

    if (!features?.voiceSearch?.enabled) return null;

    return (
        <div className="bg-surface rounded-3xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-purple-500 rounded-xl">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground">Sesli Arama</h3>
                            <p className="text-sm text-slate-500">Ses komutlarıyla hızlı erişim</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSupported ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                        ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                        <span className="text-xs font-bold">
                            {isSupported ? 'Destekleniyor' : 'Desteklenmiyor'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Voice Search Interface */}
                <div className="text-center">
                    {/* Microphone Button */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleListening}
                        className={`relative w-32 h-32 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isListening
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30'
                                : 'bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/30 hover:shadow-primary/40'
                        }`}
                    >
                        {/* Volume Indicator */}
                        {isListening && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-white/30"
                                animate={{
                                    scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity
                                }}
                            />
                        )}

                        {/* Microphone Icon */}
                        <div className="relative z-10">
                            {isListening ? (
                                <MicOff className="w-12 h-12 text-white" />
                            ) : (
                                <Mic className="w-12 h-12 text-white" />
                            )}
                        </div>

                        {/* Volume Bars */}
                        {isListening && (
                            <div className="absolute -inset-2 flex items-center justify-center gap-1">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-white/60 rounded-full"
                                        animate={{
                                            height: [4, 20 + volume * 40, 4],
                                        }}
                                        transition={{
                                            duration: 0.1,
                                            repeat: Infinity,
                                            delay: i * 0.1
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Status Text */}
                    <div className="mt-6">
                        {isListening ? (
                            <div className="space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-lg font-bold text-red-600"
                                >
                                    Dinliyorum...
                                </motion.div>
                                {transcript && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-slate-600 dark:text-slate-400 italic"
                                    >
                                        &quot;{transcript}&quot;
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-lg font-bold text-foreground">
                                    Mikrofona dokunun
                                </div>
                                <div className="text-sm text-slate-500">
                                    &quot;Dashboard&apos;a git&quot;, &quot;Ürünleri göster&quot;, &quot;Yardım et&quot; gibi komutlar deneyin
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}

                    {/* Recognized Command */}
                    <AnimatePresence>
                        {recognizedCommand && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800/50"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <div>
                                        <div className="text-sm font-bold text-green-600">Komut Tanındı!</div>
                                        <div className="text-xs text-green-600">{recognizedCommand.description}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Voice Commands List */}
                {showCommandsList && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Ses Komutları
                            </h4>
                            <button
                                onClick={() => setShowCommands(!showCommands)}
                                className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                {showCommands ? 'Gizle' : 'Göster'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showCommands && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                                >
                                    {voiceCommands.map((command, index) => (
                                        <motion.div
                                            key={command.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-foreground">{command.description}</div>
                                                    <div className="text-xs text-slate-500">
                                                        &quot;{command.command.join('&quot;, &quot;')}&quot;
                                                    </div>
                                                </div>
                                                <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                                    {command.category}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Language Settings */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <div>
                            <div className="text-sm font-bold text-foreground">Dil</div>
                            <div className="text-xs text-slate-500">Ses tanıma dili</div>
                        </div>
                    </div>
                    <select
                        value={language}
                        onChange={(e) => {
                            // In a real app, this would update the recognition language
                            console.log('Language changed to:', e.target.value);
                        }}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm"
                    >
                        <option value="tr-TR">Türkçe</option>
                        <option value="en-US">English</option>
                        <option value="de-DE">Deutsch</option>
                        <option value="fr-FR">Français</option>
                    </select>
                </div>

                {/* Tips */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-600 mb-1">Pro İpuçları</h4>
                            <ul className="text-xs text-orange-600 space-y-1">
                                <li>• Net ve komut cümleleri kullanın</li>
                                <li>• Arka plan gürültüsünü azaltın</li>
                                <li>• Mikrofon izni vermeniz gerekebilir</li>
                                <li>• Komutları Türkçe söyleyin</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
