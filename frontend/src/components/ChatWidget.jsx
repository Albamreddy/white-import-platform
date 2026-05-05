import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

const GREETING = 'Привет! 👋 Я Виктория, менеджер платформы «Белый Ввоз». Подскажу по курсам, помогу выбрать подходящий. Спрашивайте!';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = newMessages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await api.sendChat(chatHistory, sessionId);
      setSessionId(resp.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.reply }]);
      if (!open) setUnread(prev => prev + 1);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ой, что-то пошло не так 😅 Попробуйте ещё раз или напишите нам в Telegram: https://t.me/beliy_vvoz'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat bubble */}
      <button
        className={`chat-bubble ${open ? 'chat-bubble-hidden' : ''}`}
        onClick={() => setOpen(true)}
        title="Написать консультанту"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {unread > 0 && <span className="chat-unread">{unread}</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar-online">
                <div className="chat-avatar-small">Ð'</div>
                <span className="chat-online-dot" />
              </div>
              <div>
                <div className="chat-header-name">Виктория</div>
                <div className="chat-header-status">онлайн • консультант</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">Ð'</div>
                )}
                <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-msg-bubble-user' : 'chat-msg-bubble-assistant'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-avatar">Ð'</div>
                <div className="chat-msg-bubble chat-msg-bubble-assistant chat-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
