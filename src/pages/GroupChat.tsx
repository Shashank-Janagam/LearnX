import React, { useState, useEffect, useRef } from 'react';
import '../styles/GroupChat.css';
import { Send, Bot, MessageCircle } from 'lucide-react';
import axios from 'axios';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function GroupChat({ socket, groupCode, groupName, userID }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userName = sessionStorage.getItem('userName');

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}/messages`);
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [groupCode]);

  // Join group chat via socket
  useEffect(() => {
    if (!socket || !groupCode || !userID) return;

    socket.emit('group:join-chat', { groupCode, userID });

    // Listen for new messages
    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.isAI) setAiThinking(false);
      scrollToBottom();
    };

    // Typing indicator
    const handleTyping = ({ userName: typingUser }) => {
      setTyping(typingUser);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
    };

    socket.on('group:new-message', handleNewMessage);
    socket.on('group:user-typing', handleTyping);

    return () => {
      socket.off('group:new-message', handleNewMessage);
      socket.off('group:user-typing', handleTyping);
      socket.emit('group:leave-chat', { groupCode });
    };
  }, [socket, groupCode, userID]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Load older messages
  const loadMore = async () => {
    if (messages.length === 0 || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]?.createdAt;
      const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}/messages`, {
        params: { before: oldest }
      });
      setMessages(prev => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Send message
  const handleSend = () => {
    if (!input.trim() || !socket) return;

    const content = input.trim();
    socket.emit('group:send-message', { groupCode, userID, content });

    // If @ai message, show thinking
    if (content.toLowerCase().startsWith('@ai')) {
      setAiThinking(true);
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Emit typing
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket) {
      socket.emit('group:typing', { groupCode, userName });
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={chatContainerRef}>
        {/* Load More */}
        {hasMore && (
          <div className="chat-load-more">
            <button onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {/* Welcome message if empty */}
        {messages.length === 0 && (
          <div className="chat-welcome">
            <MessageCircle size={40} className="chat-welcome-icon" />
            <h3>Start the conversation!</h3>
            <p>Send a message or type <strong>@ai</strong> followed by a question to chat with LearnX AI.</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isSelf = msg.sender === userID;
          const isAI = msg.isAI;
          const className = `chat-msg ${isSelf ? 'self' : ''} ${isAI ? 'ai' : ''}`;

          return (
            <div key={msg._id} className={className}>
              <div className="chat-msg-avatar">
                {isAI ? '🤖' : getInitials(msg.senderName)}
              </div>
              <div className="chat-msg-body">
                <div className="chat-msg-header">
                  <span className="chat-msg-name">
                    {isAI ? 'LearnX AI' : (isSelf ? 'You' : msg.senderName)}
                  </span>
                  {isAI && <span className="ai-badge"><Bot size={10} /> AI</span>}
                  <span className="chat-msg-time">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="chat-msg-content">{msg.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing / AI indicator */}
      <div className="chat-typing">
        {aiThinking ? (
          <div className="chat-ai-thinking">
            <Bot size={14} />
            LearnX AI is thinking
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        ) : typing ? (
          <>
            {typing} is typing
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </>
        ) : null}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="chat-ai-hint">
            Type <span>@ai</span> to ask LearnX AI
          </div>
        </div>
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default GroupChat;
