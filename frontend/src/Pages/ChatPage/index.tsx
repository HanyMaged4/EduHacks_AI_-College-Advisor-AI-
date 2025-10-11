import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  AppBar,
  Toolbar,
  Button,
  Fade,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Logout as LogoutIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client'; // Import socket.io-client

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string; // uuid-like string
  title: string;
  createdAt: number; // epoch ms
  messages: Message[];
}

const ChatBot: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null); /
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, chats]);

  const storageKey = (userId?: string | number) => `college_ai_chats_user_${userId ?? 'guest'}`;

  const createGreetingMessage = (): Message => ({
    id: 1,
    text: "Hello! I'm your AI College Advisor. I'm here to help you with college selection, applications, and career guidance. What would you like to know?",
    sender: 'bot',
    timestamp: new Date(),
  });

  const createNewChatSession = (title?: string): ChatSession => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: title || 'New chat',
    createdAt: Date.now(),
    messages: [createGreetingMessage()],
  });

  // Load chats from localStorage when user is known
  useEffect(() => {
    const key = storageKey(user?.id as any);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];

        const revived = parsed.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) } as Message)),
        }));
        setChats(revived);
        setActiveChatId(revived[0]?.id || '');
      } else {
        const first = createNewChatSession('New chat');
        setChats([first]);
        setActiveChatId(first.id);
      }
    } catch (e) {
      const first = createNewChatSession('New chat');
      setChats([first]);
      setActiveChatId(first.id);
    }

  }, [user?.id]);


  useEffect(() => {
    if (!chats.length) return;
    const key = storageKey(user?.id as any);
    const toStore = chats.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
    }));
    localStorage.setItem(key, JSON.stringify(toStore));
  }, [chats, user?.id]);

  useEffect(() => {
    const newSocket = io('ws://localhost:3000', {
      query: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'],
    });
    console.log(`http://localhost:3000?token=${localStorage.getItem('token')}`);

    const appendBotMessage = (text: string) => {
      setChats((prev) => {
        if (!prev.length) return prev;
        const idx = prev.findIndex((c) => c.id === activeChatId) ?? 0;
        const i = idx >= 0 ? idx : 0;
        const chat = prev[i];
        const nextMsgId = (chat.messages[chat.messages.length - 1]?.id || 0) + 1;
        const updated: ChatSession = {
          ...chat,
          messages: [
            ...chat.messages,
            { id: nextMsgId, text, sender: 'bot', timestamp: new Date() },
          ],
        };
        const copy = [...prev];
        copy[i] = updated;
        return copy;
      });
    };

    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
      appendBotMessage(data.message);
    });


    newSocket.on('chat_update', (data) => {
      console.log('Chat update:', data);
      setIsTyping(true);
    });


    newSocket.on('chat_response', (data) => {
      console.log('Chat response:', data);
      setIsTyping(false);
      if (data.status === 'success') {
        appendBotMessage(data.message);
      } else {
        appendBotMessage(`Error: ${data.message}`);
      }
    });


    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      appendBotMessage('WebSocket error occurred.');
    });

    // Set the socket instance
    setSocket(newSocket);

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
    // We intentionally exclude activeChatId from deps to avoid re-wiring socket listeners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !socket) return;

    // Append to active chat
    setChats((prev) => {
      if (!prev.length) return prev;
      const idx = prev.findIndex((c) => c.id === activeChatId) ?? 0;
      const i = idx >= 0 ? idx : 0;
      const chat = prev[i];
      const nextMsgId = (chat.messages[chat.messages.length - 1]?.id || 0) + 1;
      const updated: ChatSession = {
        ...chat,
        messages: [
          ...chat.messages,
          { id: nextMsgId, text: inputText, sender: 'user', timestamp: new Date() },
        ],
      };
      const copy = [...prev];
      copy[i] = updated;
      return copy;
    });
    setInputText('');
    setIsTyping(true);

    // Emit the chat message to the WebSocket server
    socket.emit('chat', { message: inputText });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'Find colleges for me',
    'Help with applications',
    'Scholarship information',
    'Career guidance',
    'Major selection help',
  ];

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const handleCreateNewChat = () => {
    const newChat = createNewChatSession('New chat');
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInputText('');
    setIsTyping(false);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        bgcolor: '#000000',
        color: 'white',
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 280,
          borderRight: '1px solid #333',
          bgcolor: '#0d0d0d',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar position="static" sx={{ bgcolor: '#121212', boxShadow: 'none' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Chats
            </Typography>
            <Tooltip title="Create new chat">
              <IconButton onClick={handleCreateNewChat} size="small" sx={{ color: '#00bcd4' }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense>
            {chats.map((c) => (
              <ListItemButton
                key={c.id}
                selected={c.id === activeChatId}
                onClick={() => setActiveChatId(c.id)}
                sx={{
                  '&.Mui-selected': { bgcolor: '#1c1c1c' },
                  '&:hover': { bgcolor: '#1a1a1a' },
                }}
              >
                <ListItemText
                  primary={c.title}
                  secondary={new Date(c.createdAt).toLocaleDateString()}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ color: '#888' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Divider sx={{ borderColor: '#333' }} />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={handleCreateNewChat}
            sx={{
              color: '#00bcd4',
              border: '1px solid #00bcd4',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(0,188,212,0.1)' },
            }}
          >
            New chat
          </Button>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: '#1a1a1a',
          borderBottom: '1px solid #333',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BotIcon sx={{ color: '#00bcd4' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              College AI Advisor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              Welcome, {user?.username}
            </Typography>
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                color: '#ff4757',
                '&:hover': { bgcolor: 'rgba(255, 71, 87, 0.1)' },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Quick Actions */}
      <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
        <Typography variant="body2" sx={{ mb: 1, color: '#aaa' }}>
          Quick actions:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickActions.map((action, index) => (
            <Chip
              key={index}
              label={action}
              size="small"
              onClick={() => setInputText(action)}
              sx={{
                bgcolor: '#333',
                color: 'white',
                '&:hover': { bgcolor: '#444' },
                border: '1px solid #555',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: '#111111',
        }}
      >
        {activeChat?.messages.map((message) => (
          <Fade in={true} key={message.id}>
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 3,
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              {message.sender === 'bot' && (
                <Avatar sx={{ bgcolor: '#00bcd4', width: 32, height: 32 }}>
                  <BotIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor:
                    message.sender === 'user' ? '#00bcd4' : '#2a2a2a',
                  color: message.sender === 'user' ? '#000' : '#fff',
                  borderRadius:
                    message.sender === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                  border: `1px solid ${
                    message.sender === 'user' ? '#00bcd4' : '#444'
                  }`,
                }}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                  {message.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                    fontSize: '0.7rem',
                  }}
                >
                  {formatTime(message.timestamp)}
                </Typography>
              </Paper>

              {message.sender === 'user' && (
                <Avatar sx={{ bgcolor: '#666', width: 32, height: 32 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
            </Box>
          </Fade>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <Fade in={isTyping}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#00bcd4', width: 32, height: 32 }}>
                <BotIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '18px 18px 18px 4px',
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map((dot) => (
                    <Box
                      key={dot}
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: '#666',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: `${dot * 0.16}s`,
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0)' },
                          '40%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Fade>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: '#1a1a1a',
          borderTop: '1px solid #333',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about colleges, applications, or career advice..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2a2a2a',
                color: 'white',
                borderRadius: '20px',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#666' },
                '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#aaa',
                opacity: 1,
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            sx={{
              bgcolor: '#00bcd4',
              color: '#000',
              width: 48,
              height: 48,
              '&:hover': { bgcolor: '#00acc1' },
              '&:disabled': { bgcolor: '#333', color: '#666' },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
};

export default ChatBot;