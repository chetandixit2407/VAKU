import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  Hash,
  User as UserIcon,
  Users,
  Search,
  Sparkles,
  AlertCircle,
  Clock,
  Coffee,
  Building,
  Shield,
  Award,
  CheckCircle2,
  CheckCheck,
  Tag,
  DoorOpen,
  MessageSquare,
  ChevronDown,
  Bell,
  RefreshCw,
} from 'lucide-react';
import type { ChatMessage, ChatChannel, User, UserRole, Candidate, Room } from '../types/index.ts';
import { authenticatedFetch } from '../utils/apiClient.ts';

interface InternalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentRole: UserRole;
  candidates?: Candidate[];
  rooms?: Room[];
  defaultRecipientId?: string;
  defaultChannelId?: string;
  initialCandidateId?: string;
  initialRoomId?: string;
  initialMessage?: string;
  onOpenCandidateDossier?: (candidateId: string) => void;
  onOpenRoomContext?: (roomId: string, roomName?: string) => void;
  onNewMessageSent?: () => void;
}

export const InternalChatModal: React.FC<InternalChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  candidates = [],
  rooms = [],
  defaultRecipientId,
  defaultChannelId = 'general',
  initialCandidateId,
  initialRoomId,
  initialMessage,
  onOpenCandidateDossier,
  onOpenRoomContext,
  onNewMessageSent,
}) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [activeChatType, setActiveChatType] = useState<'channel' | 'direct'>('channel');
  const [activeChannelId, setActiveChannelId] = useState<string>(defaultChannelId);
  const [activeRecipientId, setActiveRecipientId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isPriority, setIsPriority] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [unreadMap, setUnreadMap] = useState<{
    channels: Record<string, number>;
    direct: Record<string, number>;
  }>({
    channels: {},
    direct: {},
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize active conversation when opened with default target or initial values
  useEffect(() => {
    if (defaultRecipientId) {
      setActiveChatType('direct');
      setActiveRecipientId(defaultRecipientId);
    } else if (defaultChannelId) {
      setActiveChatType('channel');
      setActiveChannelId(defaultChannelId);
    }

    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
    }
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    }
    if (initialMessage) {
      setMessageInput(initialMessage);
    }
  }, [defaultRecipientId, defaultChannelId, initialCandidateId, initialRoomId, initialMessage, isOpen]);

  // Load channels and staff users
  useEffect(() => {
    if (!isOpen) return;

    fetchChannels();
    fetchStaffUsers();
    fetchUnreadCounts();
  }, [isOpen]);

  const fetchChannels = async () => {
    try {
      const res = await authenticatedFetch('/api/chat/channels');
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Failed to load chat channels', err);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await authenticatedFetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setStaffUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load staff users', err);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await authenticatedFetch(`/api/chat/unread?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setUnreadMap({
          channels: data.channels || {},
          direct: data.direct || {},
        });
      }
    } catch (err) {
      console.error('Failed to load unread counts', err);
    }
  };

  // Fetch messages for active channel or direct recipient
  useEffect(() => {
    if (!isOpen) return;
    fetchConversationMessages();
  }, [activeChatType, activeChannelId, activeRecipientId, isOpen]);

  const fetchConversationMessages = async () => {
    setLoadingMessages(true);
    try {
      let url = '/api/chat/messages?';
      if (activeChatType === 'channel' && activeChannelId) {
        url += `channelId=${encodeURIComponent(activeChannelId)}`;
      } else if (activeChatType === 'direct' && activeRecipientId && currentUser?.id) {
        url += `recipientId=${encodeURIComponent(activeRecipientId)}&userId=${encodeURIComponent(currentUser.id)}`;
      } else {
        setLoadingMessages(false);
        return;
      }

      const res = await authenticatedFetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        scrollToBottom();
      }

      // Mark messages as read
      markAsRead();
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      await authenticatedFetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          channelId: activeChatType === 'channel' ? activeChannelId : undefined,
          recipientId: activeChatType === 'direct' ? activeRecipientId : undefined,
        }),
      });

      // Update local unread counts
      setUnreadMap((prev) => {
        if (activeChatType === 'channel') {
          const updatedChannels = { ...prev.channels };
          delete updatedChannels[activeChannelId];
          return { ...prev, channels: updatedChannels };
        } else {
          const updatedDirect = { ...prev.direct };
          delete updatedDirect[activeRecipientId];
          return { ...prev, direct: updatedDirect };
        }
      });
    } catch (err) {
      console.warn('Failed marking read', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Listen to window custom event or global SSE message broadcast
  useEffect(() => {
    const handleIncomingChatMessage = (e: any) => {
      const newMsg: ChatMessage = e.detail || e.payload;
      if (!newMsg || !newMsg.id) return;

      const isForActiveChannel =
        activeChatType === 'channel' && newMsg.channelId === activeChannelId;
      const isForActiveDirect =
        activeChatType === 'direct' &&
        ((newMsg.senderId === activeRecipientId && newMsg.recipientId === currentUser?.id) ||
          (newMsg.senderId === currentUser?.id && newMsg.recipientId === activeRecipientId));

      if (isForActiveChannel || isForActiveDirect) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const next = [...prev, newMsg];
          return next.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        scrollToBottom();
        markAsRead();
      } else {
        // Increment unread map
        if (newMsg.channelId) {
          setUnreadMap((prev) => ({
            ...prev,
            channels: {
              ...prev.channels,
              [newMsg.channelId!]: (prev.channels[newMsg.channelId!] || 0) + 1,
            },
          }));
        } else if (newMsg.recipientId === currentUser?.id) {
          setUnreadMap((prev) => ({
            ...prev,
            direct: {
              ...prev.direct,
              [newMsg.senderId]: (prev.direct[newMsg.senderId] || 0) + 1,
            },
          }));
        }
      }
    };

    window.addEventListener('wcr:chat-message', handleIncomingChatMessage as EventListener);
    return () => {
      window.removeEventListener('wcr:chat-message', handleIncomingChatMessage as EventListener);
    };
  }, [activeChatType, activeChannelId, activeRecipientId, currentUser?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    const room = rooms.find((r) => r.id === selectedRoomId || r.roomId === selectedRoomId);
    const recipientUser = staffUsers.find((u) => u.id === activeRecipientId);

    const payload = {
      channelId: activeChatType === 'channel' ? activeChannelId : undefined,
      recipientId: activeChatType === 'direct' ? activeRecipientId : undefined,
      recipientName: recipientUser?.name,
      content: messageInput.trim(),
      candidateId: candidate?.id,
      candidateName: candidate?.fullName,
      roomId: room?.id,
      roomName: room?.name,
      isPriority,
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      senderRole: currentUser?.role || currentRole,
    };

    setSending(true);
    try {
      const res = await authenticatedFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add to local message list if not already added by realtime
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        const next = [...prev, data.message];
        return next.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      setMessageInput('');
      setIsPriority(false);
      setSelectedCandidateId('');
      setSelectedRoomId('');
      scrollToBottom();

      if (onNewMessageSent) onNewMessageSent();
    } catch (err) {
      console.error('Send message failed', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeRecipient = staffUsers.find((u) => u.id === activeRecipientId);

  // Filter staff users based on search
  const filteredStaff = useMemo(() => {
    return staffUsers.filter((u) => {
      if (u.id === currentUser?.id) return false; // don't show self in DMs list
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    });
  }, [staffUsers, currentUser?.id, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  // Contextual template triggers
  const applyQuickTemplate = (templateType: 'bring' | 'send' | 'ready' | 'prepare' | 'clean' | 'water') => {
    const cand = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
    const room = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
    const candName = cand?.fullName || 'Rahul Sharma';
    const roomName = room?.name || 'The Skyline';

    if (templateType === 'bring') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Bring ${candName} to ${roomName}.`);
    } else if (templateType === 'send') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Send ${candName} to ${roomName}.`);
    } else if (templateType === 'ready') {
      if (!selectedCandidateId && cand) setSelectedCandidateId(cand.id);
      setMessageInput(`Candidate ${candName} is ready in Reception.`);
    } else if (templateType === 'prepare') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Prepare ${roomName} with mineral water and sanitized glassware.`);
    } else if (templateType === 'clean') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Please clean and reset ${roomName} after the interview.`);
    } else if (templateType === 'water') {
      if (!selectedRoomId && room) setSelectedRoomId(room.id);
      setMessageInput(`Please serve water & refreshments in ${roomName}.`);
    }
  };

  // Quick message snippets
  const quickSnippets = [
    'Candidate has arrived in Lobby',
    'Please serve water & refreshments',
    'Room is cleaned & ready',
    'Stage cleared, advancing to Next Round',
    'Please escort candidate to cabin',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] sm:h-[84vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  WCR Internal Office Chat
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Real-Time
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in as: <strong className="text-white">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || currentRole})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Internal Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Sidebar: Channels & Staff List */}
          <div className="w-full md:w-72 lg:w-80 bg-slate-950/60 border-r border-slate-800 flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels or staff..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {/* Channels Section */}
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Office Channels</span>
                  <span className="text-[10px] text-slate-500 font-mono">#{channels.length}</span>
                </div>
                <div className="space-y-1 mt-1">
                  {filteredChannels.map((c) => {
                    const isActive = activeChatType === 'channel' && activeChannelId === c.id;
                    const unread = unreadMap.channels[c.id] || 0;

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChatType('channel');
                          setActiveChannelId(c.id);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className="truncate">{c.name}</span>
                        </div>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Messages Section */}
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Direct Messages</span>
                  <span className="text-[10px] text-slate-500 font-mono">{filteredStaff.length}</span>
                </div>
                <div className="space-y-1 mt-1">
                  {filteredStaff.map((u) => {
                    const isActive = activeChatType === 'direct' && activeRecipientId === u.id;
                    const unread = unreadMap.direct[u.id] || 0;

                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveChatType('direct');
                          setActiveRecipientId(u.id);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200 shrink-0">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-medium text-white">{u.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {u.role} • {u.department || 'Operations'}
                            </span>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Chat Pane */}
          <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
            {/* Conversation Header */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChatType === 'channel' ? (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        #{activeChannel?.name || activeChannelId}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {activeChannel?.description || 'Office coordination channel'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {activeRecipient?.name.substring(0, 2).toUpperCase() || 'DM'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {activeRecipient?.name || 'Staff Member'}
                        </h3>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {activeRecipient?.role || 'Staff'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {activeRecipient?.designation || activeRecipient?.department || 'WCR Team Member'} {activeRecipient?.phone ? `• ${activeRecipient.phone}` : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={fetchConversationMessages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Refresh messages"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Loading message stream...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <p className="text-xs font-medium">No messages yet in this conversation.</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Start communication with your colleagues. All staff receive updates in real time.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                        <span className="font-bold text-slate-300">{isMine ? 'You' : msg.senderName}</span>
                        {!isMine && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-slate-800 text-[9px] font-semibold text-amber-400 border border-slate-700">
                            {msg.senderRole}
                          </span>
                        )}
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {msg.isPriority && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold">
                            PRIORITY
                          </span>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-md sm:max-w-lg p-3 rounded-2xl text-xs space-y-2 ${
                          isMine
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-md shadow-amber-500/10'
                            : msg.isPriority
                            ? 'bg-rose-950/40 border border-rose-500/40 text-rose-100 rounded-tl-xs'
                            : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                        }`}
                      >
                        {/* Context Pills (Candidate / Room) */}
                        {(msg.candidateName || msg.roomName) && (
                          <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-black/10 dark:border-white/10">
                            {msg.candidateName && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (msg.candidateId && onOpenCandidateDossier) {
                                    onOpenCandidateDossier(msg.candidateId);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold transition cursor-pointer ${
                                  isMine
                                    ? 'bg-amber-600/30 text-slate-950 border border-amber-700/40 hover:bg-amber-600/50'
                                    : 'bg-slate-900/90 border border-slate-700 text-amber-300 hover:bg-slate-800 hover:border-amber-400'
                                }`}
                                title="Click to open candidate dossier"
                              >
                                <UserIcon className="w-3 h-3 text-amber-400" />
                                <span>Candidate: <u>{msg.candidateName}</u></span>
                              </button>
                            )}

                            {msg.roomName && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenRoomContext) {
                                    onOpenRoomContext(msg.roomId || '', msg.roomName);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold transition cursor-pointer ${
                                  isMine
                                    ? 'bg-amber-600/30 text-slate-950 border border-amber-700/40 hover:bg-amber-600/50'
                                    : 'bg-slate-900/90 border border-slate-700 text-sky-300 hover:bg-slate-800 hover:border-sky-400'
                                }`}
                                title="Click to view room context"
                              >
                                <DoorOpen className="w-3 h-3 text-sky-400" />
                                <span>Room: <u>{msg.roomName}</u></span>
                              </button>
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Action Task Synchronized Badge */}
                        {/\b(bring|send|escort|ready|prepare|clean|water|refreshments)\b/i.test(msg.content) && (
                          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isMine
                              ? 'bg-amber-600/30 text-slate-950 border border-amber-700/30'
                              : 'bg-slate-950/60 text-amber-300 border border-amber-500/30'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>⚡ Dashboard Action Alert created & synchronized</span>
                          </div>
                        )}

                        {/* Delivery / Read confirmation status */}
                        <div className="flex items-center justify-between text-[9px] opacity-75 pt-1 border-t border-black/10 dark:border-white/10">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span className="flex items-center gap-0.5">
                              {msg.readBy && msg.readBy.length > 1 ? (
                                <span className="flex items-center gap-0.5 text-sky-950 dark:text-sky-300 font-semibold" title="Read by colleagues">
                                  <CheckCheck className="w-3 h-3 text-sky-900 dark:text-sky-300" /> Read
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-slate-800 dark:text-slate-400 font-medium" title="Delivered to office">
                                  <CheckCircle2 className="w-3 h-3" /> Delivered
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Context Templates Bar */}
            <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 text-[10px] font-bold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Actions:
              </span>
              <button
                type="button"
                onClick={() => applyQuickTemplate('bring')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-[10px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1"
                title="Send escort request to Reception Dashboard"
              >
                <span>🚶 “Bring [Candidate] to [Room]”</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('send')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
                title="Send candidate escort instruction"
              >
                <span>🚀 “Send [Candidate] to [Room]”</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('ready')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
                title="Candidate is ready alert"
              >
                <span>🛎️ “Candidate is ready”</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('prepare')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
                title="Pantry room prep alert"
              >
                <span>🚪 “Prepare [Room]”</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('clean')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
                title="Pantry clean & reset request"
              >
                <span>🧹 Clean Room</span>
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('water')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
              >
                <span>☕ Serve Refreshments</span>
              </button>
            </div>

            {/* Input & Form Area */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Candidate & Room Tags Selector Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Candidate Tag Option */}
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-hidden focus:border-amber-400 max-w-[170px] truncate"
                    >
                      <option value="">Attach candidate (optional)</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Tag Option */}
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-hidden focus:border-sky-400 max-w-[170px] truncate"
                    >
                      <option value="">Attach room (optional)</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPriority(!isPriority)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    isPriority
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{isPriority ? 'High Priority Alert' : 'Normal'}</span>
                </button>
              </div>

              {/* Text Input Row */}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activeChatType === 'channel' ? `#${activeChannel?.name || activeChannelId}` : activeRecipient?.name || 'staff member'}... (Enter = send, Shift+Enter = new line)`}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 resize-none"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition shadow-lg shadow-amber-500/10 cursor-pointer shrink-0 flex items-center justify-center"
                  title="Send message"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
