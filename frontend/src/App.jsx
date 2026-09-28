import axios from "axios";
import { useState, useRef, useEffect } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";


function CodeBlock({ children }) {
    const [copied, setCopied] = useState(false);

    const code = children?.props?.children || "";

    const copyCode = async () => {
        await navigator.clipboard.writeText(String(code));
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <div className="code-block">
            <button
                className="copy-button"
                onClick={copyCode}
            >
                {copied ? "Copied!" : "Copy"}
            </button>

            <pre>
                {children}
            </pre>
        </div>
    );
}


function ChatApp() {

    const { getToken } = useAuth();
     const { signOut } = useClerk();
     const { user } = useUser();


  const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [error, setError] = useState("");
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [initializing, setInitializing] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
    };

    const handleOffline = () => {
        setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
}, []);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);



const loadConversations = async (updateState = true) => {
    try {
        const token = await getToken();


        const response = await axios.get(`${API_BASE_URL}/conversations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        

        const conversations = response.data.conversations;


        if (updateState) {
            setConversations(conversations);
        }

        return conversations;

    } catch (error) {

        console.error(
            "LOAD CONVERSATIONS ERROR:",
            error.response?.status,
            error.response?.data || error.message
        );

        return [];
    }
};

const loadConversation = async (conversationId) => {


    try {
        

       const token = await getToken();
 
         const response = await axios.get(
     `${API_BASE_URL}/conversation/${conversationId}`,
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
     );


        setMessages(response.data.messages);
        setActiveConversationId(conversationId);

        localStorage.setItem(
            "activeConversationId",
            conversationId
        );

    } catch (error) {
        console.error("CONVERSATION ERROR:", error);
          setActiveConversationId(null);
    setMessages([]);

    localStorage.removeItem("activeConversationId");
    }
};

const deleteConversation = async (conversationId) => {
    try {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmDelete) return;

        const token = await getToken();

        await axios.delete(`${API_BASE_URL}/conversation/${conversationId}`, {
    headers: {
        Authorization: `Bearer ${token}`
    }
});
        const updatedConversations = conversations.filter(
            conversation => conversation._id !== conversationId
        );

        setConversations(updatedConversations);

        if (activeConversationId === conversationId) {

            if (updatedConversations.length > 0) {

                const nextConversation = updatedConversations[0];

                loadConversation(nextConversation._id);

            } else {

                setActiveConversationId(null);
                setMessages([]);
                localStorage.removeItem("activeConversationId");

            }
        }

    } catch (error) {
        console.error("DELETE CONVERSATION ERROR:", error);
    }
};

useEffect(() => {
    const initializeApp = async () => {

        try {
            const savedConversationId =
                localStorage.getItem("activeConversationId");

            console.log(
                "Saved conversation ID:",
                savedConversationId
            );

            const conversations = await loadConversations();

            if (savedConversationId) {

                const savedConversation = conversations.find(
                    conversation =>
                        conversation._id === savedConversationId
                );

                if (savedConversation) {

                    await loadConversation(savedConversationId);

                } else {

                    console.log(
                        "Saved conversation not found"
                    );

                    if (conversations.length > 0) {

                        const firstConversation =
                            conversations[0];

                        await loadConversation(
                            firstConversation._id
                        );

                    } else {

                        setActiveConversationId(null);
                        setMessages([]);

                        localStorage.removeItem(
                            "activeConversationId"
                        );
                    }
                }

            }  else {

    if (conversations.length > 0) {

        const firstConversation =
            conversations[0];

        await loadConversation(
            firstConversation._id
        );

    } else {

        await createNewChat();

    }
}


        } catch (error) {

            console.error(
                "INITIALIZATION ERROR:",
                error
            );

        } finally {

            console.log(
                "Setting initializing to false"
            );

            setInitializing(false);
        }
    };

    initializeApp();
}, []);

async function createNewChat() {
    try {
          if (activeConversationId && messages.length === 0) {
        return;
    }
       const token = await getToken();

const response = await axios.post(
    `${API_BASE_URL}/conversations`,
    {
        title: "New Chat"
    },
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

        const conversation = response.data.conversation;

        setActiveConversationId(conversation._id);
        setMessages([]);

        localStorage.setItem(
            "activeConversationId",
            conversation._id
        );
              setConversations(prev => [
    {
        _id: conversation._id,
        title: conversation.title
    },
    ...prev
]);

    } catch (error) {
        console.error(error);
    }
}

const sendMessage = async () => {
    if (!message.trim()) {
        return;
    }

    try {
        setError("");
        setLoading(true);

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                content: message,
                timestamp: new Date()
            }
        ]);

        setMessage("");

      const token = await getToken();

const response = await axios.post(
    `${API_BASE_URL}/chat`,
    {
        conversationId: activeConversationId,
        message: message
    },
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);
        const updatedConversations = await loadConversations(false);

        const currentConversation = updatedConversations.find(
            conversation => conversation._id === activeConversationId
        );

        if (currentConversation) {

            const otherConversations = updatedConversations.filter(
                conversation => conversation._id !== activeConversationId
            );

            setConversations([
                {
                    ...currentConversation,
                    title: response.data.title
                },
                ...otherConversations
            ]);
        }

        setMessages(prev => [
            ...prev,
            {
                role: "assistant",
                content: response.data.answer,
                agent: response.data.agent,
                timestamp: response.data.timestamp
            }
        ]);

    }

    catch (error) {
    console.error("SEND MESSAGE ERROR:", error.response?.status);
    console.error("SEND MESSAGE DATA:", error.response?.data);
    console.error("SEND MESSAGE FULL:", error);

  if (!error.response) {
    setError("Unable to connect to the server. Please try again.");
} else if (error.response.status === 401) {
    setError("Your session has expired. Please sign in again.");
} else if (error.response.status === 429) {
    setError("Service is temporarily busy. Please try again later.");
} else {
    setError("Something went wrong. Please try again.");
}
} finally {
    setLoading(false);
}
};


    

    return (
        <div className="app">

            {/* Sidebar */}
            <aside className="sidebar">

                <div className="logo">
                    <span>✦</span>
                    AI Agent
                </div>

              

                    <button
                    className="new-chat"
               onClick={createNewChat}
               >
                  + New Chat
                         </button>

                <div className="conversation-section">
               <p className="section-title">Conversations</p>
{conversations.map((conversation) => (
    <div
        key={conversation._id}
        className={`conversation ${
            activeConversationId === conversation._id
                ? "active"
                : ""
        }`}
        onClick={() => loadConversation(conversation._id)}
    >
        <span className="conversation-title">
            {conversation.title}
        </span>

        <button
            className="delete-chat"
            onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conversation._id);
            }}
        >
            🗑️
        </button>
    </div>
))}
                   </div>

                    <div className="user-section">
    <div className="user-info">
        <div className="user-avatar">
            {user?.firstName?.charAt(0) || "U"}
        </div>

        <div className="user-details">
            <span className="user-name">
                {user?.firstName || "User"}
            </span>

            <span className="user-email">
                {user?.primaryEmailAddress?.emailAddress}
            </span>
        </div>
    </div>

    <button
        className="logout-button"
        onClick={() => signOut()}
    >
        Logout
    </button>
</div>

            </aside>


            {/* Main Chat */}
            <main className="chat-area">

             <header className="chat-header">
                                 <div>
                            <h1>AI Agent Assistant</h1>
                         <p>Ask anything and let the right agent handle it.</p>
                       </div>
 
               <div className={`status ${isOnline ? "online" : "offline"}`}>
                          <span></span>
                          {isOnline ? "Online" : "Offline"}
                     </div>
                     </header>


                {/* Messages */}
                
                  <div className="messages">

    {messages.length === 0 ? (
        <div className="empty-chat">

            <div className="empty-icon">
                ✦
            </div>

            <h2>AI Agent Assistant</h2>

            <p>
                Ask me anything and I'll choose the right agent for you.
            </p>

        </div>
    ) : (
           messages.map((msg, index) => (
    <div
        key={index}
        className={`message ${
            msg.role === "user"
                ? "user-message"
                : "assistant-message"
        }`}
    >

        {msg.role === "assistant" && (
            <div className="agent-label">
                ✦ {msg.agent.charAt(0).toUpperCase() + msg.agent.slice(1)} Agent
            </div>
        )}

<div>
    {msg.role === "assistant" ? (
 <ReactMarkdown
    components={{
        pre({ children }) {
            return (
                <CodeBlock>
                    {children}
                </CodeBlock>
            );
        },

        code({ className, children, ...props }) {
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
    }}
>
    {msg.content}
</ReactMarkdown>
    ) : (
        msg.content
    )}
</div>

{msg.timestamp && (
    <div className="message-time">
        {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })}
    </div>
)}

    </div>
))
    )}

    {loading && (
        <div className="message assistant-message">
            AI is thinking
            <span className="thinking-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        </div>
    )}

    {error && (
    <div className="error-message">
        {error}
    </div>
)}

    <div ref={messagesEndRef}></div>

</div>


                {/* Input */}
                  {/* Input */}
              <div className="input-area">

             <input
                 type="text"
               value={message}
              disabled={initializing || !isOnline}
             placeholder={
        isOnline
            ? "Message AI Agent..."
            : "You are offline"
          }
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={(e) => {
        if (
            e.key === "Enter" &&
            !loading &&
            !initializing &&
            isOnline
        ) {
            sendMessage();
        }
    }}
/>

           <button
        onClick={sendMessage}
        disabled={loading || initializing || !isOnline}
            >
             ➤
               </button>

                   </div>
            </main>

              <div className="built-by">
                Built with <span className="heart">♥</span> by <strong>Shwetank</strong>
            </div>

        </div>
    );
}



// =========================
// CLERK AUTH
// =========================

function App() {

    const { isLoaded, isSignedIn } = useAuth();

    const path = window.location.pathname;

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    // =========================
    // SIGN UP PAGE
    // =========================

    if (path === "/sign-up" || path.startsWith("/sign-up/")) {
        return (
            <div className="auth-page">

                {/* Animated background bubbles */}
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="bubble bubble-4"></div>
                <div className="bubble bubble-5"></div>

                {/* Clerk Sign Up */}
                <div className="auth-card">
                    <SignUp
                        appearance={{
                            elements: {
                                formButtonPrimary: {
                                    background: "#6d4aff",
                                    color: "#ffffff",
                                },
                            },
                        }}
                    />
                </div>

            </div>
        );
    }

    // =========================
    // SIGN IN PAGE
    // =========================

    if (!isSignedIn) {
        return (
            <div className="auth-page">

                {/* Animated background bubbles */}
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="bubble bubble-4"></div>
                <div className="bubble bubble-5"></div>

                {/* Clerk Sign In */}
                <div className="auth-card">
                    <SignIn
                        signUpUrl="/sign-up"
                        appearance={{
                            elements: {
                                formButtonPrimary: {
                                    background: "#6d4aff",
                                    color: "#ffffff",
                                },
                            },
                        }}
                    />
                </div>
                
                <div className="built-by">
             Built with <span className="heart">♥</span> by <strong>Shwetank</strong>
        </div>

            </div>
        );
    }

    // =========================
    // MAIN APPLICATION
    // =========================

    return <ChatApp />;
}

export default App;