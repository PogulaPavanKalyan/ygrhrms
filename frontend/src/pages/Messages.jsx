import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import chatApi from '../services/api/chat';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function formatDateLabel(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function getDateKey(isoStr) {
  if (!isoStr) return '';
  try { return new Date(isoStr).toDateString(); }
  catch { return ''; }
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '💯', '🙏'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ user, size = 36, style = {} }) {
  const [imgError, setImgError] = useState(false);
  const name = user?.name || user?.username || user?.sender_name || '';
  const pic = user?.profile_pic || user?.sender_avatar;

  if (pic && !imgError) {
    return (
      <img
        src={pic}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0, ...style
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 700,
      fontSize: size * 0.38, flexShrink: 0, ...style
    }}>
      {getInitials(name)}
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    Online: '#22c55e', Away: '#f59e0b', Busy: '#ef4444',
    'In Meeting': '#8b5cf6', 'Working From Home': '#06b6d4', Offline: '#94a3b8',
  };
  return (
    <span style={{
      display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
      background: colors[status] || colors.Offline,
      border: '2px solid #fff', flexShrink: 0,
    }} title={status} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Messages = () => {
  const { user } = useAuth();

  // ── State ──
  const [allUsers, setAllUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  // activeChat: { type: 'dm'|'channel'|'team', id, name, is_announcement_only }

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');

  const [contextMenu, setContextMenu] = useState(null);
  // { x, y, msg }
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // msg id
  const [showEmojiInput, setShowEmojiInput] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamUsers, setTeamUsers] = useState([]);

  const [showForward, setShowForward] = useState(null); // msg to forward
  const [forwardReceivers, setForwardReceivers] = useState([]);

  const [imagePreview, setImagePreview] = useState(null);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const lastIdRef = useRef(0);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load sidebar ──
  const loadSidebar = useCallback(async () => {
    try {
      const [usersRes, roomsRes] = await Promise.all([
        chatApi.getAllUsers(),
        chatApi.getAllChatRooms(),
      ]);
      setAllUsers(usersRes.data || []);
      setChannels(roomsRes.data?.channels || []);
      setTeams(roomsRes.data?.teams || []);
    } catch (e) {
      console.error('Sidebar load error', e);
    } finally {
      setLoadingSidebar(false);
    }
  }, []);

  useEffect(() => {
    loadSidebar();
    // Mark presence as Online
    chatApi.updatePresence({ status: 'Online' }).catch(() => {});
    return () => {
      chatApi.updatePresence({ status: 'Offline' }).catch(() => {});
    };
  }, [loadSidebar]);

  // ── Load messages for active chat ──
  const loadMessages = useCallback(async (reset = false) => {
    if (!activeChat) return;
    if (reset) {
      setLoadingMsgs(true);
      lastIdRef.current = 0;
    }
    try {
      const params = reset ? {} : { last_id: lastIdRef.current };
      if (activeChat.type === 'dm') params.user_id = activeChat.id;
      else params.room_id = activeChat.id;

      const res = await chatApi.getChatHistory(params);
      const msgs = res.data?.messages || [];

      if (reset) {
        setMessages(msgs);
      } else if (msgs.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = msgs.filter(m => !existingIds.has(m.id));
          return newMsgs.length ? [...prev, ...newMsgs] : prev;
        });
      }

      if (msgs.length > 0) {
        lastIdRef.current = msgs[msgs.length - 1].id;
      }
    } catch (e) {
      console.error('Load messages error', e);
    } finally {
      if (reset) setLoadingMsgs(false);
    }
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    loadMessages(true);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(false), 3000);
    return () => clearInterval(pollRef.current);
  }, [activeChat, loadMessages]);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Close context menu on outside click ──
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ── Send message ──
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text && !fileInputRef.current?.files[0]) return;
    if (!activeChat) return;

    const formData = new FormData();
    formData.append('text', text);
    if (activeChat.type === 'dm') formData.append('receiver_id', activeChat.id);
    else formData.append('room_id', activeChat.id);
    if (replyTo) formData.append('reply_to_id', replyTo.id);
    const fileEl = fileInputRef.current;
    if (fileEl?.files[0]) {
      formData.append('file', fileEl.files[0]);
      fileEl.value = '';
    }

    setInputText('');
    setReplyTo(null);

    try {
      const res = await chatApi.sendMessage(formData);
      const msg = res.data;
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        return ids.has(msg.id) ? prev : [...prev, msg];
      });
      lastIdRef.current = msg.id;
    } catch (e) {
      alert(e?.response?.data?.detail || 'Failed to send message.');
    }
  };

  // ── Edit submit ──
  const handleEditSubmit = async () => {
    if (!editingMsg || !editText.trim()) return;
    try {
      await chatApi.editMessage({
        message_id: editingMsg.id,
        is_group: editingMsg.is_group,
        text: editText,
      });
      setMessages(prev => prev.map(m => m.id === editingMsg.id
        ? { ...m, text: editText, edited: true } : m));
    } catch (e) {
      alert(e?.response?.data?.detail || 'Edit failed.');
    }
    setEditingMsg(null);
    setEditText('');
  };

  // ── Delete message ──
  const handleDelete = async (msg, mode) => {
    try {
      await chatApi.deleteMessage({ message_id: msg.id, is_group: msg.is_group, mode });
      if (mode === 'everyone') {
        setMessages(prev => prev.map(m => m.id === msg.id
          ? { ...m, is_deleted: true, text: '', file_url: null } : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }
    } catch (e) {
      alert(e?.response?.data?.detail || 'Delete failed.');
    }
    setContextMenu(null);
  };

  // ── React emoji ──
  const handleReact = async (msg, emoji) => {
    try {
      const res = await chatApi.toggleReaction({ message_id: msg.id, is_group: msg.is_group, emoji });
      setMessages(prev => prev.map(m => m.id === msg.id
        ? { ...m, reactions: res.data.reactions } : m));
    } catch (e) { console.error(e); }
    setEmojiPickerFor(null);
  };

  // ── Forward ──
  const handleForward = async () => {
    if (!showForward || !forwardReceivers.length) return;
    try {
      await chatApi.forwardMessage({ msg_ids: [showForward.id], receiver_ids: forwardReceivers });
      alert('Message forwarded.');
    } catch (e) { alert('Forward failed.'); }
    setShowForward(null);
    setForwardReceivers([]);
  };

  // ── Create team ──
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await chatApi.createTeam({ name: teamName, description: teamDesc, users: teamUsers });
      setShowCreateTeam(false);
      setTeamName(''); setTeamDesc(''); setTeamUsers([]);
      loadSidebar();
    } catch (e) { alert(e?.response?.data?.detail || 'Failed to create team.'); }
  };

  // ── Typing ──
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!typing) setTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setTyping(false), 2000);
  };

  // ── Filtered users ──
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );
  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Active chat title info ──
  const activeDmUser = activeChat?.type === 'dm'
    ? allUsers.find(u => u.id === activeChat.id) : null;
  const activeChatTitle = activeChat?.name || '';

  // ── Build messages with date separators ──
  const messagesWithDates = [];
  let lastDateKey = '';
  messages.forEach(msg => {
    const dk = getDateKey(msg.created_at_iso);
    if (dk && dk !== lastDateKey) {
      messagesWithDates.push({ _type: 'separator', label: formatDateLabel(msg.created_at_iso), key: dk });
      lastDateKey = dk;
    }
    messagesWithDates.push(msg);
  });

  // ── Is image file ──
  function isImage(name) {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name || '');
  }

  const canPost = !activeChat?.is_announcement_only ||
    user?.role === 'MD' || user?.role === 'HR';

  return (
    <div>
      {/* ── Inline CSS ── */}
      <style>{`
        /* ── Layout ── */
        .uc-wrap {
          display: flex;
          height: calc(100vh - 90px);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          position: relative;
        }

        /* ── Sidebar ── */
        .uc-sidebar {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
        }
        .uc-sidebar-top {
          padding: 14px 14px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .uc-sidebar-title {
          font-size: 13px;
          font-weight: 800;
          color: #092a49;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .uc-search {
          width: 100%;
          padding: 7px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12.5px;
          outline: none;
          background: #fff;
          color: #1e293b;
        }
        .uc-search:focus { border-color: #3b82f6; }
        .uc-sidebar-list { flex: 1; overflow-y: auto; padding: 8px 6px; }
        .uc-section-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .7px;
          color: #94a3b8;
          padding: 10px 8px 4px;
        }
        .uc-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 9px;
          border-radius: 8px;
          cursor: pointer;
          transition: background .15s;
          position: relative;
        }
        .uc-item:hover { background: #eff6ff; }
        .uc-item.active { background: rgba(59,130,246,.12); }
        .uc-item-info { flex: 1; min-width: 0; }
        .uc-item-name {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .uc-item.active .uc-item-name { color: #1d4ed8; }
        .uc-item-sub {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }
        .uc-unread {
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          flex-shrink: 0;
        }
        .uc-channel-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #dbeafe;
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* ── New Group button ── */
        .uc-new-btn {
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          cursor: pointer;
          transition: background .15s;
        }
        .uc-new-btn:hover { background: #1e40af; }

        /* ── Chat Window ── */
        .uc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── Header ── */
        .uc-header {
          padding: 12px 18px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
        }
        .uc-header-info { flex: 1; min-width: 0; }
        .uc-header-name {
          font-size: 15px;
          font-weight: 800;
          color: #092a49;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .uc-header-sub {
          font-size: 11.5px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 1px;
        }

        /* ── Messages Area ── */
        .uc-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* ── Date Separator ── */
        .uc-date-sep {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 6px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .4px;
        }
        .uc-date-sep::before, .uc-date-sep::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        /* ── Message Row ── */
        .uc-msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin: 2px 0;
          max-width: 100%;
          position: relative;
        }
        .uc-msg-row.sent { flex-direction: row-reverse; }
        .uc-msg-row.sent .uc-bubble {
          background: #1d4ed8;
          color: #fff;
          border-bottom-right-radius: 3px;
        }
        .uc-msg-row.received .uc-bubble {
          background: #fff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 3px;
        }

        .uc-bubble {
          max-width: 60%;
          min-width: 80px;
          padding: 9px 13px 7px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.5;
          position: relative;
          word-break: break-word;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }

        /* ── Sender name (group) ── */
        .uc-sender-name {
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 3px;
        }

        /* ── Reply preview inside bubble ── */
        .uc-reply-preview {
          background: rgba(0,0,0,.08);
          border-left: 3px solid rgba(255,255,255,.5);
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
          font-size: 11.5px;
          opacity: .9;
        }
        .uc-msg-row.received .uc-reply-preview {
          background: #f1f5f9;
          border-left-color: #3b82f6;
        }
        .uc-reply-preview-sender { font-weight: 700; color: #3b82f6; margin-bottom: 1px; }

        /* ── Message meta ── */
        .uc-msg-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          font-size: 10.5px;
          opacity: .75;
          justify-content: flex-end;
        }
        .uc-tick { font-size: 10px; }
        .uc-tick.read { color: #34d399; }

        /* ── Edited badge ── */
        .uc-edited { font-size: 10px; font-style: italic; opacity: .7; margin-right: 4px; }

        /* ── Deleted msg ── */
        .uc-deleted {
          font-style: italic;
          opacity: .55;
          font-size: 12.5px;
        }

        /* ── Reactions ── */
        .uc-reactions {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-top: 4px;
        }
        .uc-reaction-chip {
          background: rgba(59,130,246,.1);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 1px 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background .12s;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .uc-reaction-chip:hover { background: rgba(59,130,246,.2); }
        .uc-reaction-count { font-size: 10px; font-weight: 700; color: #1d4ed8; }

        /* ── Image attachment ── */
        .uc-img-attach {
          max-width: 220px;
          max-height: 180px;
          border-radius: 8px;
          object-fit: cover;
          cursor: pointer;
          margin-top: 4px;
        }

        /* ── File attachment ── */
        .uc-file-attach {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,.06);
          border-radius: 8px;
          padding: 7px 10px;
          margin-top: 4px;
          font-size: 12px;
          text-decoration: none;
          color: inherit;
        }
        .uc-msg-row.sent .uc-file-attach { color: #fff; }
        .uc-file-attach:hover { background: rgba(0,0,0,.1); }

        /* ── Context menu ── */
        .uc-ctx {
          position: fixed;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,.12);
          z-index: 9999;
          min-width: 160px;
          padding: 4px 0;
          font-size: 13px;
        }
        .uc-ctx-item {
          padding: 9px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background .12s;
          color: #1e293b;
        }
        .uc-ctx-item:hover { background: #f1f5f9; }
        .uc-ctx-item.danger { color: #ef4444; }
        .uc-ctx-sep { height: 1px; background: #e2e8f0; margin: 3px 0; }

        /* ── Emoji picker (reaction) ── */
        .uc-emoji-picker {
          position: absolute;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,.1);
          z-index: 9998;
          padding: 8px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          width: 200px;
        }
        .uc-emoji-btn {
          font-size: 18px;
          cursor: pointer;
          padding: 3px;
          border-radius: 5px;
          transition: background .1s;
          background: none;
          border: none;
          line-height: 1;
        }
        .uc-emoji-btn:hover { background: #f1f5f9; }

        /* ── Input area ── */
        .uc-input-wrap {
          border-top: 1px solid #e2e8f0;
          background: #fff;
        }
        .uc-reply-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px 0;
          font-size: 12px;
          color: #64748b;
          background: #f0f9ff;
          border-top: 1px solid #bae6fd;
        }
        .uc-reply-strip-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #0369a1;
          font-weight: 600;
        }
        .uc-reply-close {
          cursor: pointer;
          font-size: 15px;
          color: #94a3b8;
          line-height: 1;
          padding: 2px 5px;
          border: none;
          background: none;
        }
        .uc-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
        }
        .uc-input-box {
          flex: 1;
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          font-size: 13.5px;
          outline: none;
          background: #f8fafc;
          color: #1e293b;
          transition: border-color .15s;
          resize: none;
        }
        .uc-input-box:focus { border-color: #3b82f6; background: #fff; }
        .uc-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          padding: 5px;
          border-radius: 8px;
          color: #64748b;
          transition: background .12s, color .12s;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .uc-icon-btn:hover { background: #f1f5f9; color: #1d4ed8; }
        .uc-send-btn {
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 17px;
          flex-shrink: 0;
          transition: background .15s, transform .1s;
        }
        .uc-send-btn:hover { background: #1e40af; transform: scale(1.05); }
        .uc-send-btn:disabled { background: #cbd5e1; cursor: default; transform: none; }

        /* ── Edit bar ── */
        .uc-edit-bar {
          background: #fef9c3;
          border-top: 1px solid #fde68a;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #92400e;
        }
        .uc-edit-input {
          flex: 1;
          padding: 7px 10px;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          font-size: 13.5px;
          outline: none;
          background: #fff;
        }

        /* ── Empty state ── */
        .uc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          gap: 12px;
          background: #f8fafc;
        }
        .uc-empty-icon { font-size: 52px; }
        .uc-empty-title { font-size: 17px; font-weight: 700; color: #475569; }
        .uc-empty-sub { font-size: 13px; max-width: 280px; text-align: center; }

        /* ── Modal overlay ── */
        .uc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }
        .uc-modal {
          background: #fff;
          border-radius: 14px;
          padding: 24px;
          width: 420px;
          max-width: 95vw;
          box-shadow: 0 20px 40px rgba(0,0,0,.15);
        }
        .uc-modal-title {
          font-size: 16px;
          font-weight: 800;
          color: #092a49;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .uc-modal-close {
          background: none; border: none; font-size: 20px;
          cursor: pointer; color: #94a3b8; line-height: 1;
        }
        .uc-modal-close:hover { color: #ef4444; }
        .uc-form-group { margin-bottom: 14px; }
        .uc-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }
        .uc-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13.5px;
          outline: none;
          color: #1e293b;
        }
        .uc-input:focus { border-color: #3b82f6; }
        .uc-submit-btn {
          width: 100%;
          padding: 11px;
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s;
          margin-top: 4px;
        }
        .uc-submit-btn:hover { background: #1e40af; }

        /* ── Image lightbox ── */
        .uc-lightbox {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.88);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .uc-lightbox img {
          max-width: 90vw;
          max-height: 88vh;
          border-radius: 8px;
          object-fit: contain;
        }
        .uc-lightbox-close {
          position: fixed;
          top: 20px; right: 20px;
          font-size: 30px;
          color: #fff;
          cursor: pointer;
          background: none;
          border: none;
          opacity: .8;
          transition: opacity .15s;
        }
        .uc-lightbox-close:hover { opacity: 1; }

        /* ── Announcement locked notice ── */
        .uc-locked-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: #fef3c7;
          border-top: 1px solid #fde68a;
          font-size: 12.5px;
          color: #92400e;
        }

        /* ── Emoji picker for input ── */
        .uc-emoji-input-picker {
          position: absolute;
          bottom: 60px;
          left: 14px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          width: 220px;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          z-index: 9000;
        }

        @media (max-width: 768px) {
          .uc-wrap { border-radius: 0; height: calc(100vh - 90px); }
          .uc-sidebar { width: 100%; position: absolute; top: 0; left: 0; bottom: 0; z-index: 100; }
          .uc-sidebar.hidden { display: none; }
          .uc-main { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
          .uc-bubble { max-width: 82%; }
        }
      `}</style>

      <div className="uc-wrap">
        {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
        <div className="uc-sidebar">
          <div className="uc-sidebar-top">
            <div className="uc-sidebar-title">
              <span>💬 Messages</span>
              <button className="uc-new-btn" onClick={() => setShowCreateTeam(true)}>
                + Team
              </button>
            </div>
            <input
              className="uc-search"
              placeholder="🔍 Search people, channels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="uc-sidebar-list">
            {/* Channels */}
            <div className="uc-section-label">📢 Channels</div>
            {loadingSidebar ? (
              <div style={{ padding: '12px', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            ) : filteredChannels.length === 0 && !search ? (
              <div style={{ padding: '6px 8px', color: '#94a3b8', fontSize: 11.5, fontStyle: 'italic' }}>
                No channels yet
              </div>
            ) : filteredChannels.map(ch => (
              <div
                key={`ch-${ch.id}`}
                className={`uc-item ${activeChat?.id === ch.id && activeChat?.type === 'channel' ? 'active' : ''}`}
                onClick={() => setActiveChat({ type: 'channel', id: ch.id, name: ch.name, is_announcement_only: ch.is_announcement_only })}
              >
                <div className="uc-channel-icon">#</div>
                <div className="uc-item-info">
                  <div className="uc-item-name">{ch.name}</div>
                  <div className="uc-item-sub">{ch.last_msg_text || ch.description || 'No messages yet'}</div>
                </div>
              </div>
            ))}

            {/* Teams */}
            {filteredTeams.length > 0 && (
              <>
                <div className="uc-section-label">👥 Team Groups</div>
                {filteredTeams.map(t => (
                  <div
                    key={`tm-${t.id}`}
                    className={`uc-item ${activeChat?.id === t.id && activeChat?.type === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveChat({ type: 'team', id: t.id, name: t.name })}
                  >
                    <div className="uc-channel-icon" style={{ background: '#fef3c7', color: '#92400e' }}>👥</div>
                    <div className="uc-item-info">
                      <div className="uc-item-name">{t.name}</div>
                      <div className="uc-item-sub">{t.last_msg_text || 'Team chat'}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Direct Messages */}
            <div className="uc-section-label">✉️ Direct Messages</div>
            {filteredUsers.map(u => (
              <div
                key={`dm-${u.id}`}
                className={`uc-item ${activeChat?.id === u.id && activeChat?.type === 'dm' ? 'active' : ''}`}
                onClick={() => setActiveChat({ type: 'dm', id: u.id, name: u.name })}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar user={u} size={36} />
                  <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
                    <StatusDot status={u.status} />
                  </span>
                </div>
                <div className="uc-item-info">
                  <div className="uc-item-name">{u.name}</div>
                  <div className="uc-item-sub">
                    {u.status !== 'Offline' ? u.status : (u.last_msg_text || u.role)}
                  </div>
                </div>
                {u.unread > 0 && (
                  <div className="uc-unread">{u.unread > 99 ? '99+' : u.unread}</div>
                )}
              </div>
            ))}

            {filteredUsers.length === 0 && filteredChannels.length === 0 && search && (
              <div style={{ padding: '12px 8px', color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
                No results for "{search}"
              </div>
            )}
          </div>
        </div>

        {/* ─── CHAT WINDOW ─────────────────────────────────── */}
        <div className="uc-main">
          {!activeChat ? (
            /* Empty state */
            <div className="uc-empty">
              <div className="uc-empty-icon">💬</div>
              <div className="uc-empty-title">Open a Conversation</div>
              <div className="uc-empty-sub">
                Select a channel, team group or colleague from the sidebar to start messaging.
              </div>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div className="uc-header">
                {activeDmUser ? (
                  <div style={{ position: 'relative' }}>
                    <Avatar user={activeDmUser} size={40} />
                    <span style={{ position: 'absolute', bottom: 0, right: 0 }}>
                      <StatusDot status={activeDmUser.status} />
                    </span>
                  </div>
                ) : (
                  <div className="uc-channel-icon" style={{ width: 40, height: 40, borderRadius: 10, fontSize: 17 }}>
                    {activeChat.type === 'team' ? '👥' : '#'}
                  </div>
                )}
                <div className="uc-header-info">
                  <div className="uc-header-name">{activeChatTitle}</div>
                  <div className="uc-header-sub">
                    {activeDmUser ? (
                      <>
                        <StatusDot status={activeDmUser.status} />
                        <span>{activeDmUser.status}</span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span>{activeDmUser.role}</span>
                        {activeDmUser.department && (
                          <><span style={{ color: '#cbd5e1' }}>·</span><span>{activeDmUser.department}</span></>
                        )}
                      </>
                    ) : (
                      <span>
                        {activeChat.type === 'channel' ? 'Channel' : 'Team Group'}
                        {activeChat.is_announcement_only && ' · 📢 Announcements (read-only for non-admins)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Messages Feed ── */}
              <div className="uc-msgs">
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : messagesWithDates.map((item, idx) => {
                  if (item._type === 'separator') {
                    return (
                      <div key={`sep-${item.key}`} className="uc-date-sep">
                        {item.label}
                      </div>
                    );
                  }

                  const msg = item;
                  const isSent = msg.sender_id === user?.id;
                  const isGroup = msg.is_group;
                  const isDeleted = msg.is_deleted;

                  return (
                    <div
                      key={msg.id}
                      className={`uc-msg-row ${isSent ? 'sent' : 'received'}`}
                      style={{ marginBottom: 3 }}
                      onContextMenu={e => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, msg });
                      }}
                    >
                      {/* Avatar (received only) */}
                      {!isSent && (
                        <Avatar user={{ sender_avatar: msg.sender_avatar, name: msg.sender_name }} size={30} />
                      )}

                      {/* Bubble */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                        {/* Sender name (group received) */}
                        {isGroup && !isSent && (
                          <div className="uc-sender-name">{msg.sender_name}</div>
                        )}

                        <div
                          className="uc-bubble"
                          style={{ cursor: 'default' }}
                        >
                          {/* Reply preview */}
                          {msg.reply_to && (
                            <div className="uc-reply-preview">
                              <div className="uc-reply-preview-sender">↩ {msg.reply_to.sender_name}</div>
                              <div style={{ fontSize: 11 }}>{msg.reply_to.text_preview}</div>
                            </div>
                          )}

                          {/* Deleted */}
                          {isDeleted ? (
                            <span className="uc-deleted">🚫 This message was deleted</span>
                          ) : (
                            <>
                              {/* Text */}
                              {msg.text && <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}

                              {/* File / Image */}
                              {msg.file_url && (
                                isImage(msg.file_name) ? (
                                  <img
                                    src={msg.file_url}
                                    alt={msg.file_name}
                                    className="uc-img-attach"
                                    onClick={() => setImagePreview(msg.file_url)}
                                  />
                                ) : (
                                  <a href={msg.file_url} target="_blank" rel="noreferrer" className="uc-file-attach">
                                    📎 {msg.file_name || 'Attachment'}
                                  </a>
                                )
                              )}
                            </>
                          )}

                          {/* Meta row */}
                          <div className="uc-msg-meta">
                            {msg.edited && !isDeleted && <span className="uc-edited">edited</span>}
                            <span>{msg.created_at}</span>
                            {isSent && !isGroup && (
                              <span className={`uc-tick ${msg.is_read ? 'read' : ''}`}>
                                {msg.is_read ? '✓✓' : msg.is_delivered ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Emoji reactions */}
                        {!isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="uc-reactions">
                            {Object.entries(msg.reactions).map(([emoji, data]) => (
                              <button
                                key={emoji}
                                className="uc-reaction-chip"
                                onClick={() => handleReact(msg, emoji)}
                                title={data.usernames?.join(', ')}
                              >
                                {emoji}
                                <span className="uc-reaction-count">{data.users?.length || 1}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Add reaction btn (hover hint) */}
                        {!isDeleted && (
                          <div style={{ position: 'relative' }}>
                            {emojiPickerFor === msg.id && (
                              <div className="uc-emoji-picker" style={{ [isSent ? 'right' : 'left']: 0, bottom: 22 }}>
                                {EMOJI_LIST.map(e => (
                                  <button key={e} className="uc-emoji-btn" onClick={() => handleReact(msg, e)}>{e}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sent avatar */}
                      {isSent && (
                        <Avatar user={{ sender_avatar: user?.profile_pic, name: user?.first_name || user?.username }} size={30} />
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Edit bar ── */}
              {editingMsg && (
                <div className="uc-edit-bar">
                  <span>✏️ Editing:</span>
                  <input
                    className="uc-edit-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') { setEditingMsg(null); setEditText(''); } }}
                    autoFocus
                  />
                  <button className="uc-new-btn" onClick={handleEditSubmit}>Save</button>
                  <button className="uc-new-btn" style={{ background: '#64748b' }} onClick={() => { setEditingMsg(null); setEditText(''); }}>Cancel</button>
                </div>
              )}

              {/* ── Input area ── */}
              {!canPost ? (
                <div className="uc-locked-notice">
                  🔒 Only MD and HR can post in the Announcements channel.
                </div>
              ) : (
                <div className="uc-input-wrap" style={{ position: 'relative' }}>
                  {/* Reply strip */}
                  {replyTo && (
                    <div className="uc-reply-strip">
                      <span>↩ Replying to <strong>{replyTo.sender_name}</strong>:</span>
                      <span className="uc-reply-strip-text">{replyTo.text || '(attachment)'}</span>
                      <button className="uc-reply-close" onClick={() => setReplyTo(null)}>✕</button>
                    </div>
                  )}

                  {/* Emoji picker for input */}
                  {showEmojiInput && (
                    <div className="uc-emoji-input-picker">
                      {EMOJI_LIST.map(e => (
                        <button key={e} className="uc-emoji-btn"
                          onClick={() => { setInputText(t => t + e); setShowEmojiInput(false); inputRef.current?.focus(); }}
                        >{e}</button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSend}>
                    <div className="uc-input-row">
                      {/* Emoji */}
                      <button type="button" className="uc-icon-btn" onClick={() => setShowEmojiInput(s => !s)} title="Emoji">
                        😊
                      </button>

                      {/* Attachment */}
                      <button type="button" className="uc-icon-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
                        📎
                      </button>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={() => {}} />

                      {/* Text input */}
                      <input
                        ref={inputRef}
                        className="uc-input-box"
                        placeholder={`Message ${activeChat.type === 'dm' ? activeChatTitle : '#' + activeChatTitle}…`}
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                          if (e.key === 'Escape') setReplyTo(null);
                        }}
                        disabled={!!editingMsg}
                      />

                      {/* Send */}
                      <button
                        type="submit"
                        className="uc-send-btn"
                        disabled={!inputText.trim() && !fileInputRef.current?.files?.[0]}
                        title="Send"
                      >
                        ➤
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── CONTEXT MENU ─────────────────────────────────── */}
      {contextMenu && (
        <div
          className="uc-ctx"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {/* Reply */}
          <div className="uc-ctx-item" onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); }}>
            ↩ Reply
          </div>

          {/* React */}
          <div className="uc-ctx-item" onClick={() => { setEmojiPickerFor(contextMenu.msg.id); setContextMenu(null); }}>
            😊 Add Reaction
          </div>

          {/* Copy */}
          {contextMenu.msg.text && (
            <div className="uc-ctx-item" onClick={() => { navigator.clipboard.writeText(contextMenu.msg.text); setContextMenu(null); }}>
              📋 Copy Text
            </div>
          )}

          {/* Forward */}
          <div className="uc-ctx-item" onClick={() => { setShowForward(contextMenu.msg); setContextMenu(null); }}>
            ↗ Forward
          </div>

          {/* Edit (own, DM, within 10 min) */}
          {contextMenu.msg.sender_id === user?.id && !contextMenu.msg.is_deleted && (
            <div className="uc-ctx-item" onClick={() => {
              setEditingMsg(contextMenu.msg);
              setEditText(contextMenu.msg.text);
              setContextMenu(null);
            }}>
              ✏️ Edit
            </div>
          )}

          <div className="uc-ctx-sep" />

          {/* Delete for me */}
          <div className="uc-ctx-item danger" onClick={() => handleDelete(contextMenu.msg, 'me')}>
            🗑 Delete for Me
          </div>

          {/* Delete for everyone (sender only, DM) */}
          {contextMenu.msg.sender_id === user?.id && !contextMenu.msg.is_group && (
            <div className="uc-ctx-item danger" onClick={() => handleDelete(contextMenu.msg, 'everyone')}>
              🗑 Delete for Everyone
            </div>
          )}

          {/* Delete (group, sender only) */}
          {contextMenu.msg.sender_id === user?.id && contextMenu.msg.is_group && !contextMenu.msg.is_deleted && (
            <div className="uc-ctx-item danger" onClick={() => handleDelete(contextMenu.msg, 'everyone')}>
              🗑 Delete Message
            </div>
          )}
        </div>
      )}

      {/* ─── EMOJI PICKER (for reaction on message) ─── */}
      {emojiPickerFor !== null && (
        <div
          className="uc-modal-overlay"
          style={{ background: 'transparent' }}
          onClick={() => setEmojiPickerFor(null)}
        >
          <div
            className="uc-emoji-picker"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 240 }}
            onClick={e => e.stopPropagation()}
          >
            {EMOJI_LIST.map(e => (
              <button
                key={e}
                className="uc-emoji-btn"
                style={{ fontSize: 24, padding: 6 }}
                onClick={() => {
                  const msg = messages.find(m => m.id === emojiPickerFor);
                  if (msg) handleReact(msg, e);
                  setEmojiPickerFor(null);
                }}
              >{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* ─── IMAGE LIGHTBOX ─────────────────────────── */}
      {imagePreview && (
        <div className="uc-lightbox" onClick={() => setImagePreview(null)}>
          <button className="uc-lightbox-close" onClick={() => setImagePreview(null)}>✕</button>
          <img src={imagePreview} alt="Preview" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ─── CREATE TEAM MODAL ───────────────────────── */}
      {showCreateTeam && (
        <div className="uc-modal-overlay" onClick={() => setShowCreateTeam(false)}>
          <div className="uc-modal" onClick={e => e.stopPropagation()}>
            <div className="uc-modal-title">
              Create Team Group
              <button className="uc-modal-close" onClick={() => setShowCreateTeam(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="uc-form-group">
                <label className="uc-label">Team Name *</label>
                <input className="uc-input" value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="e.g. Development Team" />
              </div>
              <div className="uc-form-group">
                <label className="uc-label">Description</label>
                <input className="uc-input" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} placeholder="Optional description…" />
              </div>
              <div className="uc-form-group">
                <label className="uc-label">Add Members (hold Ctrl for multiple)</label>
                <select
                  multiple
                  className="uc-input"
                  style={{ height: 110 }}
                  value={teamUsers}
                  onChange={e => setTeamUsers(Array.from(e.target.selectedOptions, o => o.value))}
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="uc-submit-btn">🚀 Create Team</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── FORWARD MESSAGE MODAL ───────────────────── */}
      {showForward && (
        <div className="uc-modal-overlay" onClick={() => setShowForward(null)}>
          <div className="uc-modal" onClick={e => e.stopPropagation()}>
            <div className="uc-modal-title">
              Forward Message
              <button className="uc-modal-close" onClick={() => setShowForward(null)}>×</button>
            </div>
            <div style={{ marginBottom: 12, background: '#f1f5f9', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#475569' }}>
              "{showForward.text?.slice(0, 80) || '(attachment)'}"
            </div>
            <div className="uc-form-group">
              <label className="uc-label">Forward to (hold Ctrl for multiple)</label>
              <select
                multiple
                className="uc-input"
                style={{ height: 130 }}
                value={forwardReceivers}
                onChange={e => setForwardReceivers(Array.from(e.target.selectedOptions, o => o.value))}
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <button className="uc-submit-btn" onClick={handleForward} disabled={!forwardReceivers.length}>
              ↗ Forward
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
