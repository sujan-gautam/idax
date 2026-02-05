import React, { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Trash2,
    Database,
    Info,
    BrainCircuit,
    Key,
    History,
    PlusCircle,
    X
} from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { chatWithAI, getAiUsage, getAiSessions, getAiSessionDetail, deleteAiSession } from '../../services/api';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    provider?: string;
}

interface AiChatProps {
    datasetId?: string;
    projectId?: string;
    onClose?: () => void;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
}

const AiChat: React.FC<AiChatProps> = ({ datasetId, projectId, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState<{ used: number; limit: number; hasCustomApiKey: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadInitialData();
    }, [datasetId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadInitialData = async () => {
        loadUsage();
        loadSessions();
    };

    const loadSessions = async () => {
        try {
            const data = await getAiSessions(datasetId);
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions');
        }
    };

    const loadUsage = async () => {
        try {
            const data = await getAiUsage();
            setUsage(data);
            if (data.hasCustomApiKey) {
                setProvider('openai');
            }
        } catch (err) {
            console.error('Failed to load AI usage');
        }
    };

    const loadSessionHistory = async (id: string) => {
        setLoading(true);
        setShowHistory(false);
        try {
            const session = await getAiSessionDetail(id);
            setSessionId(session.id);
            setMessages(session.messages.map((m: any) => ({
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
                provider: m.provider
            })));
        } catch (err) {
            setError('Failed to load session history');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const response = await chatWithAI(input, datasetId, projectId, provider, sessionId || undefined);
            const assistantMsg: Message = {
                role: 'assistant',
                content: response.answer,
                timestamp: new Date(),
                provider: response.provider
            };
            setMessages(prev => [...prev, assistantMsg]);

            if (!sessionId) {
                setSessionId(response.sessionId);
                loadSessions(); // Refresh list
            }

            if (!response.isUsingCustomKey) {
                setUsage(prev => prev ? { ...prev, used: prev.used + response.usage.consumed } : null);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to get response from AI');
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setShowHistory(false);
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteAiSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (sessionId === id) startNewChat();
        } catch (err) {
            console.error('Failed to delete session');
        }
    };

    const usagePercentage = usage ? (usage.used / usage.limit) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none shadow-none relative overflow-hidden rounded-lg">
            <CardHeader className="p-3 md:p-4 border-b dark:bg-slate-900/50 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <Bot className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2">
                            <span className="truncate">IDA AI Assistant</span>
                            <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 text-indigo-400 shrink-0" />
                        </CardTitle>
                        <div className="flex items-center gap-1 md:gap-1.5">
                            <BrainCircuit className="h-2 w-2 md:h-2.5 md:w-2.5 text-slate-400 shrink-0" />
                            <p className="text-[8px] md:text-[9px] text-slate-500 font-medium uppercase tracking-tighter truncate">
                                {provider === 'gemini' ? 'Gemini 1.5 Pro' : 'GPT-4 Turbo'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={startNewChat}
                        title="New Chat"
                        className="h-7 w-7 md:h-8 md:w-8 text-slate-500 hover:text-indigo-600"
                    >
                        <PlusCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHistory(!showHistory)}
                        title="History"
                        className={cn(
                            "h-7 w-7 md:h-8 md:w-8",
                            showHistory ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600"
                        )}
                    >
                        <History className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    {onClose && (
                        <>
                            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 md:mx-1" />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                title="Close"
                                className="h-7 w-7 md:h-8 md:w-8 text-slate-500 hover:text-red-500"
                            >
                                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>

            <div className="flex-1 flex flex-col min-h-0 relative">
                {/* History Sidebar/Overlay */}
                {showHistory && (
                    <div className="absolute inset-x-0 top-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20 p-4 border-b animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-indigo-500" />
                                Recent Conversations
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-6 w-6">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {sessions.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-xs italic">No chat history yet</p>
                                </div>
                            ) : (
                                sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => loadSessionHistory(s.id)}
                                        className={cn(
                                            "p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group relative",
                                            sessionId === s.id ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                        )}
                                    >
                                        <p className="text-xs font-semibold truncate pr-6">{s.title || 'Untitled Chat'}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteSession(e, s.id)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button className="w-full mt-4 bg-indigo-600" onClick={startNewChat}>New Conversation</Button>
                    </div>
                )}

                <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-slate-950/20 custom-scrollbar">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10 opacity-60">
                            <Database className="h-12 w-12 text-slate-300 mb-2" />
                            <div>
                                <h4 className="text-sm font-semibold">Talk to your data</h4>
                                <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1">
                                    Powerful analysis with persistent memory.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex items-start gap-2 md:gap-3 animate-fade-in", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn("h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md", msg.role === 'assistant' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-slate-200 dark:bg-slate-800 text-slate-600")}>
                                {msg.role === 'assistant' ? <Bot className="h-3 w-3 md:h-4 md:w-4" /> : <User className="h-3 w-3 md:h-4 md:w-4" />}
                            </div>
                            <div className={cn("max-w-[85%] md:max-w-[80%] p-2.5 md:p-3 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap shrink-1", msg.role === 'assistant' ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none prose prose-slate dark:prose-invert prose-xs" : "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20 shadow-md")}>
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed tracking-tight">{children}</p>,
                                            ul: ({ children }: any) => <ul className="list-disc ml-3 md:ml-4 mb-2 space-y-1">{children}</ul>,
                                            ol: ({ children }: any) => <ol className="list-decimal ml-3 md:ml-4 mb-2 space-y-1">{children}</ol>,
                                            li: ({ children }: any) => <li className="mb-1">{children}</li>,
                                            h3: ({ children }: any) => <h3 className="text-xs md:text-sm font-black mt-3 md:mt-4 mb-2 uppercase tracking-wide text-slate-900 dark:text-slate-100">{children}</h3>,
                                            strong: ({ children }: any) => <strong className="font-bold text-indigo-600 dark:text-indigo-400">{children}</strong>,
                                            code: ({ children }: any) => <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] md:text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{children}</code>
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                                <div className={cn("text-[7px] md:text-[8px] mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2 opacity-50 uppercase font-bold border-t pt-1.5 md:pt-2 mt-2 md:mt-3", msg.role === 'user' ? "flex-row-reverse border-indigo-400/30" : "border-slate-100 dark:border-slate-800")}>
                                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.role === 'assistant' && (
                                        <span className="px-1 md:px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{msg.provider}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse"><Bot className="h-4 w-4" /></div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="p-4 border-t dark:bg-slate-900/30 shrink-0">
                    {usage && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1.5 px-0.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Info className="h-3 w-3" />
                                    Platform Token Quota
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {(usage.used / 1000).toFixed(1)}k / {(usage.limit / 1000).toFixed(0)}k
                                </span>
                            </div>
                            <Progress value={usagePercentage} className="h-1 bg-slate-200 dark:bg-slate-800" indicatorClassName="bg-indigo-500" />
                            {usage.hasCustomApiKey && provider === 'openai' && (
                                <p className="mt-1 text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                    <Key className="h-2.5 w-2.5" /> Bypassing Quota (Custom Key Active)
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white" placeholder={`Ask ${provider === 'gemini' ? 'IDA' : 'OpenAI'} about your data...`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                        <Button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-xl px-3 bg-indigo-600 hover:bg-indigo-700 h-10 w-10 flex items-center justify-center"><Send className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiChat;
