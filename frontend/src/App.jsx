import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const clerkAppearance = {
    variables: {
        colorBackground: "#1b1c18",
        colorText: "#e9e9e7",
        colorInputBackground: "#151613",
        colorInputText: "#e9e9e7",
        colorPrimary: "#c8d7a3",
        colorTextSecondary: "#a3a59b",
    },
    elements: {
        card: { backgroundColor: "#1b1c18", border: "1px solid #3b3d32", boxShadow: "0 25px 80px #0007" },
        headerTitle: { color: "#edeee7" },
        headerSubtitle: { color: "#a3a59b" },
        formButtonPrimary: { backgroundColor: "#c8d7a3", color: "#202219" },
        formFieldInput: { backgroundColor: "#151613", borderColor: "#424439", color: "#e9e9e7" },
        footerActionLink: { color: "#c8d7a3" },
    },
};

const sectors = [
    { id: "auto", icon: "✦", name: "Auto", short: "Choose the right approach for every request" },
    { id: "research", icon: "⌕", name: "Research", short: "Explore a topic and make sense of it" },
    { id: "writing", icon: "↗", name: "Writing", short: "Draft, edit, and find the right words" },
    { id: "coding", icon: "⌘", name: "Coding & tech", short: "Build, debug, and understand technology" },
    { id: "education", icon: "⌂", name: "Learning", short: "Learn a new idea, one step at a time" },
    { id: "business", icon: "▤", name: "Business", short: "Plan projects, teams, and operations" },
    { id: "data", icon: "▥", name: "Data & analysis", short: "Organize information and find patterns" },
    { id: "healthcare", icon: "♡", name: "Health information", short: "Understand health topics and prepare questions" },
    { id: "law", icon: "⚖", name: "Law & public services", short: "Understand processes and prepare next steps" },
    { id: "finance", icon: "◉", name: "Finance learning", short: "Understand financial concepts and tradeoffs" },
    { id: "science", icon: "⟡", name: "Science & climate", short: "Explore science, energy, and the environment" },
    { id: "agriculture", icon: "❋", name: "Agriculture", short: "Explore crops, soil, and food systems" },
    { id: "languages", icon: "文", name: "Languages", short: "Translate, practice, and communicate" },
];

const starterPrompts = [
    { icon: "⌕", title: "Understand a complex topic", text: "Explain a difficult topic in simple terms, then give me an example." },
    { icon: "↗", title: "Write something together", text: "Help me draft a clear, thoughtful message about…" },
    { icon: "⌘", title: "Build or fix with code", text: "Help me plan a small app and break the first version into steps." },
    { icon: "▥", title: "Make sense of information", text: "Help me compare these options and explain the tradeoffs: …" },
];

function CodeBlock({ children }) {
    const [copied, setCopied] = useState(false);
    const code = children?.props?.children || "";

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(String(code));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return <div className="code-block"><button className="copy-button" onClick={copyCode} type="button">{copied ? "Copied" : "Copy"}</button><pre>{children}</pre></div>;
}

function ChatApp() {
    const { getToken } = useAuth();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [sector, setSector] = useState("auto");
    const [initializing, setInitializing] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const initializedRef = useRef(false);
    const activeSector = sectors.find((item) => item.id === sector) || sectors[0];

    const request = useCallback(async (method, path, data) => {
        const token = await getToken();
        return axios({
            method,
            url: `${API_BASE_URL}${path}`,
            data,
            headers: { Authorization: `Bearer ${token}` },
        });
    }, [getToken]);

    const loadConversations = useCallback(async () => {
        const response = await request("get", "/conversations");
        const rows = response.data.conversations || [];
        setConversations(rows);
        return rows;
    }, [request]);

    const loadConversation = useCallback(async (conversationId) => {
        try {
            const response = await request("get", `/conversation/${conversationId}`);
            setMessages(response.data.messages || []);
            setActiveConversationId(conversationId);
            localStorage.setItem("activeConversationId", conversationId);
            setError("");
            setMobileNavOpen(false);
        } catch (loadError) {
            setActiveConversationId(null);
            setMessages([]);
            localStorage.removeItem("activeConversationId");
            setError(loadError.response?.data?.error || "This conversation could not be loaded.");
        }
    }, [request]);

    const createNewChat = useCallback(async () => {
        try {
            const response = await request("post", "/conversations", { title: "New conversation" });
            const conversation = response.data.conversation;
            setActiveConversationId(conversation._id);
            setMessages([]);
            setSector("auto");
            setError("");
            localStorage.setItem("activeConversationId", conversation._id);
            setConversations((current) => [conversation, ...current.filter((row) => row._id !== conversation._id)]);
            setMobileNavOpen(false);
        } catch (createError) {
            setError(createError.response?.data?.error || "A new conversation could not be created.");
        }
    }, [request]);

    const deleteConversation = async (event, conversationId) => {
        event.stopPropagation();
        if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
        try {
            await request("delete", `/conversation/${conversationId}`);
            const remaining = conversations.filter((row) => row._id !== conversationId);
            setConversations(remaining);
            if (activeConversationId === conversationId) {
                if (remaining[0]) await loadConversation(remaining[0]._id);
                else {
                    setActiveConversationId(null);
                    setMessages([]);
                    localStorage.removeItem("activeConversationId");
                    await createNewChat();
                }
            }
        } catch (deleteError) {
            setError(deleteError.response?.data?.error || "This conversation could not be deleted.");
        }
    };

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading]);

    useEffect(() => {
        const onShortcut = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                createNewChat();
            }
        };
        window.addEventListener("keydown", onShortcut);
        return () => window.removeEventListener("keydown", onShortcut);
    }, [createNewChat]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        const initialize = async () => {
            try {
                const rows = await loadConversations();
                const savedId = localStorage.getItem("activeConversationId");
                const saved = rows.find((row) => row._id === savedId) || rows[0];
                if (saved) await loadConversation(saved._id);
                else await createNewChat();
            } catch {
                setError("We could not connect to your workspace. Check your connection and refresh to try again.");
            } finally {
                setInitializing(false);
            }
        };
        initialize();
    }, [createNewChat, loadConversation, loadConversations]);

    const sendMessage = async (event) => {
        event?.preventDefault();
        const text = message.trim();
        if (!text || loading || !activeConversationId) return;
        const optimisticId = `pending-${Date.now()}`;
        setError("");
        setLoading(true);
        setMessages((current) => [...current, { _id: optimisticId, role: "user", content: text, timestamp: new Date() }]);
        setMessage("");
        try {
            const response = await request("post", "/chat", {
                conversationId: activeConversationId,
                message: text,
                sector,
            });
            setMessages((current) => [...current, {
                role: "assistant",
                content: response.data.answer,
                agent: response.data.agent,
                timestamp: new Date(),
            }]);
            try {
                const rows = await loadConversations();
                setConversations(rows.map((row) => row._id === activeConversationId
                    ? { ...row, title: response.data.title || row.title }
                    : row));
            } catch {
                setConversations((current) => current.map((row) => row._id === activeConversationId
                    ? { ...row, title: response.data.title || row.title }
                    : row));
            }
        } catch (sendError) {
            setMessages((current) => current.filter((item) => item._id !== optimisticId));
            if (!sendError.response) setError("Could not reach the server. Your message is ready to retry.");
            else if (sendError.response.status === 401) setError("Your session has expired. Please sign in again.");
            else setError(sendError.response.data?.error || "Something went wrong. Please try again.");
            setMessage(text);
        } finally {
            setLoading(false);
        }
    };

    const choosePrompt = (text, focus = "auto") => {
        setSector(focus);
        setMessage(text);
        document.querySelector("#message-composer")?.focus();
    };

    return (
        <div className={`workspace ${mobileNavOpen ? "nav-open" : ""}`}>
            {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
            <aside className="sidebar">
                <a className="brand" href="/" aria-label="Astra home"><span className="brand-mark">✳</span><span>astra<span className="brand-period">.</span></span></a>
                <button className="new-chat-button" onClick={createNewChat} type="button"><span>＋</span> New conversation <kbd>⌘ K</kbd></button>

                <div className="sidebar-label">YOUR WORKSPACE</div>
                <nav className="sector-nav" aria-label="Assistant focus">
                    {sectors.slice(0, 8).map((item) => (
                        <button key={item.id} className={`sector-link ${sector === item.id ? "selected" : ""}`} onClick={() => { setSector(item.id); setMobileNavOpen(false); }} type="button">
                            <span className="sector-icon">{item.icon}</span><span>{item.name}</span>
                        </button>
                    ))}
                    <details className="more-sectors">
                        <summary><span className="sector-icon">···</span><span>More areas</span><span className="chevron">⌄</span></summary>
                        {sectors.slice(8).map((item) => (
                            <button key={item.id} className={`sector-link ${sector === item.id ? "selected" : ""}`} onClick={() => { setSector(item.id); setMobileNavOpen(false); }} type="button">
                                <span className="sector-icon">{item.icon}</span><span>{item.name}</span>
                            </button>
                        ))}
                    </details>
                </nav>

                <div className="history-heading"><span className="sidebar-label">RECENT</span><span>{conversations.length}</span></div>
                <div className="conversation-list">
                    {conversations.map((conversation) => (
                        <div key={conversation._id} className={`conversation-row ${activeConversationId === conversation._id ? "active" : ""}`}>
                            <button className="conversation-select" onClick={() => loadConversation(conversation._id)} type="button" title={conversation.title}>
                                <span className="conversation-dot">◦</span><span>{conversation.title || "New conversation"}</span>
                            </button>
                            <button className="delete-chat" onClick={(event) => deleteConversation(event, conversation._id)} type="button" aria-label={`Delete ${conversation.title || "conversation"}`}>×</button>
                        </div>
                    ))}
                    {!conversations.length && !initializing && <p className="empty-history">Your conversations will show up here.</p>}
                </div>

                <div className="sidebar-bottom">
                    <div className="privacy-note"><span>◇</span><p>Your conversation history is scoped to your account.</p></div>
                    <div className="account-card">
                        <div className="avatar">{user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0) || "A"}</div>
                        <div className="account-copy"><strong>{user?.fullName || user?.firstName || "Your account"}</strong><span>{user?.primaryEmailAddress?.emailAddress || "Personal workspace"}</span></div>
                        <button className="signout-button" onClick={() => signOut()} type="button" aria-label="Sign out">↗</button>
                    </div>
                </div>
            </aside>

            <main className="main-panel">
                <header className="topbar">
                    <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation" type="button">☰</button>
                    <div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{activeSector.name}</strong></div>
                    <div className="topbar-right"><span className={`connection-status ${isOnline ? "connected" : "disconnected"}`}><i />{isOnline ? "Ready" : "Offline"}</span><button className="topbar-help" type="button" title="Astra can help across many fields; verify important decisions with trusted sources.">About Astra <span>ⓘ</span></button></div>
                </header>

                <section className={`chat-scroll ${messages.length === 0 ? "welcome-scroll" : ""}`}>
                    {messages.length === 0 ? (
                        <div className="welcome-view">
                            <div className="welcome-orbit" aria-hidden="true"><span>✳</span><i /><i /><i /></div>
                            <div className="eyebrow"><span className="eyebrow-line" />A thoughtful assistant for the work ahead<span className="eyebrow-line" /></div>
                            <h1>What can we <span>work on</span><br />together?</h1>
                            <p className="welcome-description">Explore an idea, solve a problem, or make something useful.<br className="desktop-break" /> Start anywhere — Astra will help you find the next step.</p>
                            <div className="starter-grid">
                                {starterPrompts.map((prompt) => (
                                    <button className="starter-card" key={prompt.title} onClick={() => choosePrompt(prompt.text)} type="button">
                                        <span className="starter-icon">{prompt.icon}</span><span className="starter-title">{prompt.title}</span><span className="starter-text">{prompt.text}</span><span className="starter-arrow">↗</span>
                                    </button>
                                ))}
                            </div>
                            <div className="sector-chips"><span>Or start with a focus</span>{sectors.slice(1, 6).map((item) => <button key={item.id} onClick={() => choosePrompt(`Help me get started with ${item.name.toLowerCase()}.`, item.id)} type="button">{item.icon} {item.name}</button>)}</div>
                        </div>
                    ) : (
                        <div className="message-list">
                            {messages.map((msg, index) => (
                                <article key={msg._id || `${msg.role}-${index}`} className={`message-row ${msg.role === "user" ? "from-user" : "from-assistant"}`}>
                                    {msg.role === "assistant" && <div className="message-avatar">✳</div>}
                                    <div className="message-content-wrap">
                                        {msg.role === "assistant" && <div className="message-byline"><strong>Astra</strong>{msg.agent && msg.agent !== "expert" && <span className="agent-pill">{msg.agent}</span>}</div>}
                                        <div className={`message-bubble ${msg.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                                            {msg.role === "assistant" ? <ReactMarkdown components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}>{msg.content}</ReactMarkdown> : msg.content}
                                        </div>
                                        {msg.timestamp && <time className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}
                                    </div>
                                </article>
                            ))}
                            {loading && <div className="thinking-row"><div className="message-avatar">✳</div><span>Astra is thinking</span><i /><i /><i /></div>}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </section>

                <div className="composer-wrap">
                    {error && <div className="error-banner" role="alert"><span>!</span>{error}<button onClick={() => setError("")} type="button" aria-label="Dismiss">×</button></div>}
                    <form className="composer" onSubmit={sendMessage}>
                        <textarea id="message-composer" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} disabled={initializing || !isOnline} placeholder={isOnline ? "Ask anything, or describe what you want to do…" : "You're offline — reconnect to continue"} rows={2} maxLength={6000} aria-label="Message Astra" />
                        <div className="composer-footer">
                            <label className="focus-select"><span>{activeSector.icon}</span><select value={sector} onChange={(event) => setSector(event.target.value)} aria-label="Choose a focus">{sectors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="select-chevron">⌄</span></label>
                            <div className="composer-actions"><span className="composer-hint">Astra can make mistakes. Check important information.</span><button className="send-button" type="submit" disabled={loading || initializing || !message.trim() || !isOnline} aria-label="Send message"><span>↑</span></button></div>
                        </div>
                    </form>
                    <div className="footer-note">Built for curiosity, clear thinking, and useful work.</div>
                </div>
            </main>
        </div>
    );
}

function App() {
    const { isLoaded, isSignedIn } = useAuth();
    const path = window.location.pathname;
    if (!isLoaded) return <div className="auth-loading"><span>✳</span>Preparing your workspace…</div>;
    if (path === "/sign-up" || path.startsWith("/sign-up/")) {
        return <div className="auth-page"><div className="auth-brand"><span>✳</span> astra</div><div className="auth-card"><SignUp signInUrl="/" appearance={clerkAppearance} /></div><p className="auth-caption">One place to think, learn, and make progress.</p></div>;
    }
    if (!isSignedIn) {
        return <div className="auth-page"><div className="auth-brand"><span>✳</span> astra</div><div className="auth-card"><SignIn signUpUrl="/sign-up" appearance={clerkAppearance} /></div><p className="auth-caption">One place to think, learn, and make progress.</p></div>;
    }
    return <ChatApp />;
}

export default App;
