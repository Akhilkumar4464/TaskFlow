import React, { useState } from 'react';
import useBoardStore from '../../store/useBoardStore';
import DarkModeToggle from '../Common/DarkModeToggle';
import { useSocket } from '../../context/SocketContext';
import { Share2, Check, Copy } from 'lucide-react';
import Modal from '../Common/Modal';

export const Header = () => {
  const { activeBoard, updateBoardTitle, inviteMember } = useBoardStore();
  const { presenceUsers } = useSocket();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');

  if (!activeBoard) {
    return (
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
        <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">
          Select a board or create one to get started
        </span>
        <DarkModeToggle />
      </header>
    );
  }

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = boardTitle.trim();
    if (finalTitle && finalTitle !== activeBoard.title) {
      updateBoardTitle(activeBoard._id, finalTitle);
    }
    setIsEditingTitle(false);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/boards/${activeBoard._id}/join`;
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    const res = await inviteMember(activeBoard._id, inviteEmail.trim());
    if (res.success) {
      setInviteMessage('Member added successfully!');
      setInviteEmail('');
    } else {
      setInviteMessage(res.message);
    }
    setTimeout(() => setInviteMessage(''), 3000);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
      
      {/* Board Title (Editable) */}
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit}>
            <input
              type="text"
              defaultValue={activeBoard.title}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              autoFocus
              className="px-2 py-1 text-base font-bold bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
            />
          </form>
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-base font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 px-2 py-1 rounded-lg transition-all duration-150"
            title="Click to rename board"
          >
            {activeBoard.title}
          </h1>
        )}
      </div>

      {/* Actions and Presence */}
      <div className="flex items-center gap-5">
        
        {/* Presence Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {presenceUsers.map((pUser) => (
            <div
              key={pUser.userId}
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-[10px] shadow-sm select-none"
              title={`${pUser.name} (${pUser.email}) - Online`}
            >
              {pUser.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {presenceUsers.length === 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Only you
            </span>
          )}
        </div>

        {/* Share/Invite Button */}
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 transition-all duration-150"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Invite</span>
        </button>

        <DarkModeToggle />
      </div>

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Collaborators">
        <div className="space-y-5">
          
          {/* Invitation link block */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Board Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/boards/${activeBoard._id}/join`}
                className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-indigo-650 dark:text-indigo-400 font-semibold rounded-xl text-xs border border-indigo-100 dark:border-indigo-900/60 transition-colors duration-150"
              >
                {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700/60" />

          {/* Invitation by email block */}
          <form onSubmit={handleInviteSubmit}>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Add User directly by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors duration-150"
              >
                Add Member
              </button>
            </div>
            
            {inviteMessage && (
              <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {inviteMessage}
              </p>
            )}
          </form>
          
        </div>
      </Modal>
    </header>
  );
};

export default Header;
