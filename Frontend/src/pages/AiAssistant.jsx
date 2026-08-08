import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    BarChart3, Bot, BrainCircuit, FileDown, Lightbulb, Loader2, Menu, Mic,
    MicOff, PackageSearch, Plus, Send, Sparkles, Trash2, User, X, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const welcomeMessage = {
    role: 'assistant',
    content: 'Hello! I am your intelligent inventory assistant. Ask me about stock levels, sales, purchases, expiry risks, reports, or business performance.',
    lang: 'en'
};

const promptCards = [
    { label: 'Low Stock', prompt: 'Which products are low in stock and need replenishment?', icon: PackageSearch },
    { label: 'Today Sales', prompt: 'What did we sell today?', icon: BarChart3 },
    { label: 'Reorder Plan', prompt: 'Suggest products I should reorder this week.', icon: Lightbulb },
    { label: 'Somali Insight', prompt: 'Maxaa ugu iibka badan?', icon: Sparkles },
];

const AiAssistant = () => {
    const { showAlert, showConfirm } = useAlert();
    const [messages, setMessages] = useState([welcomeMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [history, setHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const loadHistory = useCallback(async () => {
        try {
            const res = await api.get('/ai/history');
            setHistory(res.data.data || []);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) setInput(prev => `${prev}${prev ? ' ' : ''}${finalTranscript}`.trim());
        };

        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        return () => recognitionRef.current?.stop();
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            showAlert({
                type: 'info',
                title: 'Voice not supported',
                message: 'Voice input is not supported in this browser. Please use Chrome or Edge.',
                buttonText: 'Got it'
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        recognitionRef.current.start();
        setIsListening(true);
    };

    const handleSend = async (messageText) => {
        const textToSend = typeof messageText === 'string' ? messageText.trim() : input.trim();
        if (!textToSend || isLoading) return;

        setInput('');
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        setMessages(prev => [...prev, { role: 'user', content: textToSend, lang: 'en' }]);
        setIsLoading(true);

        try {
            const payload = { question: textToSend };
            if (sessionId) payload.sessionId = sessionId;

            const response = await api.post('/ai/ask', payload);
            const { answer, lang, sessionId: newSessionId, data } = response.data;

            if (newSessionId && !sessionId) {
                setSessionId(newSessionId);
                loadHistory();
            }

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].lang = lang || 'en';
                return [...updated, {
                    role: 'assistant',
                    content: answer,
                    lang: lang || 'en',
                    pdfUrl: data?.pdfUrl || null
                }];
            });

            if (recognitionRef.current && lang) {
                const langMap = { en: 'en-US', so: 'so-SO', ar: 'ar-SA' };
                recognitionRef.current.lang = langMap[lang] || 'en-US';
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                lang: 'en'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSession = async (id) => {
        try {
            const res = await api.get(`/ai/history/${id}`);
            const session = res.data.data;
            setSessionId(session._id);
            setMessages(session.messages || [welcomeMessage]);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        } catch (error) {
            console.error('Error loading session:', error);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([welcomeMessage]);
        setInput('');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        loadHistory();
    };

    const deleteSession = async (id, event) => {
        event.stopPropagation();
        try {
            await api.delete(`/ai/history/${id}`);
            if (sessionId === id) startNewChat();
            else loadHistory();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const clearAllHistory = async () => {
        const ok = await showConfirm({
            type: 'warning',
            title: 'Delete AI history?',
            message: 'All AI chat history will be deleted.',
            confirmText: 'Yes, delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;
        try {
            await api.delete('/ai/history');
            startNewChat();
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const handleDownloadPdf = async (pdfUrl) => {
        try {
            const response = await api.get(pdfUrl, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = pdfUrl.split('/').pop() || 'report.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            showAlert({
                type: 'error',
                title: 'Uh oh!',
                message: 'Failed to download PDF. Please ensure you are logged in.',
                buttonText: 'Try again'
            });
        }
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        handleSend(input);
    };

    return (
        <div className="relative flex h-[calc(100vh-5rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
            {isSidebarOpen && (
                <div className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-white/10 bg-[#071124] text-slate-300 shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="border-b border-white/10 p-5">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-blue-500 to-violet-600 text-white shadow-xl shadow-blue-950/30">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <p className="font-black text-white">AI Assistant</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Inventory Copilot</p>
                            </div>
                        </div>
                        <button className="rounded-xl p-2 text-slate-400 hover:bg-white/10 md:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <button onClick={startNewChat} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg transition-all hover:-translate-y-0.5">
                        <Plus size={18} /> New Chat
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="rounded-2xl bg-white/7 p-3 ring-1 ring-white/10">
                        <p className="text-lg font-black text-white">{history.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sessions</p>
                    </div>
                    <div className="rounded-2xl bg-white/7 p-3 ring-1 ring-white/10">
                        <p className="text-lg font-black text-white">{messages.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Messages</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                    <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Recent Chats</p>
                    {history.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm font-semibold text-slate-500">No recent chats yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {history.map(session => (
                                <button
                                    key={session._id}
                                    onClick={() => loadSession(session._id)}
                                    className={`group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${sessionId === session._id ? 'bg-white/12 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/7 hover:text-white'}`}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/7 text-emerald-300">
                                        <Sparkles size={16} />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold" dir={session.lastLanguage === 'ar' ? 'rtl' : 'ltr'}>
                                        {session.title || 'Untitled chat'}
                                    </span>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(event) => deleteSession(session._id, event)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') deleteSession(session._id, event);
                                        }}
                                        className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 group-hover:opacity-100"
                                    >
                                        <Trash2 size={15} />
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div className="border-t border-white/10 p-4">
                        <button onClick={clearAllHistory} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-rose-300 transition-colors hover:bg-rose-500/10">
                            <Trash2 size={16} /> Clear History
                        </button>
                    </div>
                )}
            </aside>

            <main className="flex min-w-0 flex-1 flex-col">
                <header className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/80 md:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={22} />
                            </button>
                            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 md:flex">
                                <Zap size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white md:text-2xl">AI Command Center</h1>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ask, analyze, generate reports, and inspect warehouse intelligence.</p>
                            </div>
                        </div>
                        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 sm:flex">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
                        </div>
                    </div>
                </header>

                <section className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {messages.length <= 1 && (
                        <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-blue-600 to-violet-700 p-6 text-white shadow-2xl shadow-blue-900/20">
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                    <BrainCircuit size={28} />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">Warehouse intelligence, ready when you are.</h2>
                                <p className="mt-3 max-w-2xl text-sm font-semibold text-white/75">Use natural language to inspect stock, sales, purchases, reports, expiry risk, dispatches, and operational performance.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {promptCards.map(card => (
                                    <button key={card.label} onClick={() => handleSend(card.prompt)} disabled={isLoading} className="premium-card group p-4 text-left transition-all hover:-translate-y-1 hover:border-brand-500/30 disabled:opacity-60">
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                                            {React.createElement(card.icon, { size: 20 })}
                                        </div>
                                        <p className="font-black text-slate-900 dark:text-white">{card.label}</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.prompt}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            const isAr = msg.lang === 'ar';
                            return (
                                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex max-w-[92%] gap-3 md:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg ${isUser ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'bg-gradient-to-br from-emerald-500 via-blue-600 to-violet-600 text-white'}`}>
                                            {isUser ? <User size={18} /> : <Bot size={19} />}
                                        </div>
                                        <div dir={isAr ? 'rtl' : 'ltr'} className={`rounded-[1.5rem] p-4 shadow-sm md:p-5 ${isUser ? 'rounded-tr-md bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'rounded-tl-md border border-slate-100 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'}`}>
                                            {isUser ? (
                                                <p className="whitespace-pre-line text-sm font-semibold leading-7">{msg.content}</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className={`prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-brand-600 dark:prose-strong:text-brand-300 ${isAr ? 'text-right' : 'text-left'}`}>
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                    {msg.pdfUrl && (
                                                        <button onClick={() => handleDownloadPdf(msg.pdfUrl)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-black text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
                                                            <FileDown size={17} /> Download PDF Report
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-600 to-violet-600 text-white">
                                        <Bot size={19} />
                                    </div>
                                    <div className="flex items-center gap-3 rounded-[1.5rem] rounded-tl-md border border-slate-100 bg-white p-5 text-sm font-bold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                        Thinking through your warehouse data <Loader2 size={18} className="animate-spin text-brand-500" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </section>

                <footer className="border-t border-slate-200/80 bg-white/90 p-4 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/80 md:p-6">
                    <form onSubmit={handleFormSubmit} className="mx-auto flex max-w-5xl items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder={isListening ? 'Listening...' : 'Ask about stock, sales, purchases, reports, or warehouse performance...'}
                                className={`w-full rounded-3xl py-4 pl-5 pr-14 text-sm font-bold md:text-base ${isListening ? 'border-rose-300 ring-4 ring-rose-500/10 dark:border-rose-500/50' : ''}`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={toggleVoiceInput}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl p-2 transition-colors ${isListening ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' : 'text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15'}`}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        </div>
                        <button type="submit" disabled={isLoading || !input.trim()} className="premium-button premium-button-primary h-14 w-14 rounded-3xl p-0 disabled:cursor-not-allowed disabled:opacity-50">
                            <Send size={20} />
                        </button>
                    </form>
                </footer>
            </main>
        </div>
    );
};

export default AiAssistant;
