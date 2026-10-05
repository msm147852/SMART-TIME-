import React, { useState, useEffect } from 'react';
import { UserPlus, Search, X, Check, Contact, Smartphone, Share2 } from 'lucide-react';
import { ChatMember } from '../types';
import { chatService } from '../services/chatService';
import { getStoredSession } from '../services/authService';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  existingMembers: ChatMember[];
  isAr: boolean;
  isDark: boolean;
  onMemberAdded?: (roomId?: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  roomId,
  existingMembers,
  isAr,
  isDark,
  onMemberAdded,
}) => {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; avatar: string; phone?: string; isOnline?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsMessage, setContactsMessage] = useState('');
  const [inviteContact, setInviteContact] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      chatService
        .getUsers()
        .then((list) => setUsers(list))
        .catch((err) => console.warn('Failed to load users:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const existingIds = new Set(existingMembers.map((m) => m.id));

  const createInviteLink = (name: string, phone: string) => {
    const params = new URLSearchParams({ invite: 'chat', from: 'smart-time', phone, name });
    const from = getStoredSession()?.user?.id || 'CURRENT_USER_ID';
    return 'https://smart-time.app/invite?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(phone);
  };

  const shareInvite = async (name: string, phone: string) => {
    const link = createInviteLink(name, phone);
    setInviteContact({ name, phone });
    setContactsMessage(isAr ? 'جهة الاتصال «' + (name || phone) + '» ليست مسجلة على SMART TIME. يمكنك إرسال رابط الدعوة لها.' : 'This contact is not registered on SMART TIME. You can send an invitation link.');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SMART TIME', text: isAr ? 'انضم إلى SMART TIME لفتح محادثة مباشرة معي.' : 'Join SMART TIME to start a direct chat with me.', url: link });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setContactsMessage(isAr ? 'تم نسخ رابط الدعوة. أرسله لجهة الاتصال للتسجيل.' : 'Invitation link copied. Send it to the contact.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        try { await navigator.clipboard?.writeText(link); setContactsMessage(isAr ? 'تم نسخ رابط الدعوة. أرسله لجهة الاتصال للتسجيل.' : 'Invitation link copied. Send it to the contact.'); }
        catch { setContactsMessage(isAr ? 'رابط الدعوة: ' + link : 'Invitation link: ' + link); }
      }
    }
  };

  const handleAdd = async (userId: string | null = selectedUserId) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const result = await chatService.createRoom({ title: 'محادثة مباشرة', type: 'direct', memberIds: [userId] });
      onMemberAdded?.(result.roomId);
      onClose();
    } catch (err: any) {
      setContactsMessage(err.message || (isAr ? 'تعذر فتح المحادثة.' : 'Could not open chat.'));
    } finally { setSubmitting(false); }
  };

  const openPhoneContacts = async () => {
    const contactsApi = (navigator as any).contacts;
    if (!contactsApi?.select) {
      setContactsMessage(isAr ? 'هذا المتصفح لا يدعم Contact Picker؛ تم تفعيل قائمة SMART TIME كبديل.' : 'Contact Picker is unavailable; SMART TIME users are shown as a fallback.');
      setUsers((prev) => prev.length ? prev : []);
      return;
    }
    setContactsLoading(true); setContactsMessage(''); setInviteContact(null);
    try {
      const picked = await contactsApi.select(['name', 'tel'], { multiple: true });
      const selectedContacts = (picked || []).map((c: any) => ({ name: Array.isArray(c.name) ? (c.name[0] || '') : (c.name || ''), phones: Array.isArray(c.tel) ? c.tel.filter(Boolean) : [] })).filter((c: any) => c.phones.length);
      if (!selectedContacts.length) { setContactsMessage(isAr ? 'لم يتم اختيار جهة اتصال بها رقم هاتف.' : 'No contact with a phone number was selected.'); return; }
      const phones = selectedContacts.flatMap((c: any) => c.phones);
      const matches = await chatService.lookupContacts(phones);
      if (matches.length) {
        setUsers((prev) => { const map = new Map(prev.map((u) => [u.id, u])); matches.forEach((u) => map.set(u.id, u)); return Array.from(map.values()); });
        setSelectedUserId(matches[0].id); return;
      }
      const firstContact = selectedContacts[0]; await shareInvite(firstContact.name, firstContact.phones[0]);
    } catch (err: any) { if (err?.name !== 'AbortError') setContactsMessage(err.message || (isAr ? 'تعذر قراءة جهات الاتصال.' : 'Could not read phone contacts.')); }
    finally { setContactsLoading(false); }
  };
  const filteredUsers = users.filter((u) =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').includes(searchQuery)
  );


  return (
    <div className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-lg rounded-3xl border ${isDark ? 'bg-slate-900 border-sky-500/40 text-white' : 'bg-white border-sky-500/40 text-slate-900'} shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {isAr ? 'إضافة عضو جديد للغرفة' : 'Add New Member'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isAr ? 'اختر جهة اتصال لديها SMART TIME لفتح محادثة مباشرة' : 'Choose a SMART TIME contact to start a direct chat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2 mb-3">
  <button type="button" onClick={openPhoneContacts} disabled={contactsLoading} className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-bold">📱 {contactsLoading?'جاري المزامنة...':'مزامنة جهات الاتصال'}</button>
  <button type="button" onClick={() => { const name=window.prompt('اسم جهة الاتصال الجديدة؟')||''; const phone=window.prompt('رقم الهاتف؟')||''; if(phone.trim()) shareInvite(name,phone); }} className="px-3 py-2 rounded-xl bg-sky-500/15 text-sky-600 text-xs font-bold">➕ إضافة جهة اتصال جديدة</button>
</div>

<button
              type="button"
              onClick={handleAdd}
              disabled={!selectedUserId || submitting}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md"
              title={isAr ? 'تأكيد وبدء المحادثة' : 'Confirm and start chat'}
              aria-label={isAr ? 'تأكيد وبدء المحادثة' : 'Confirm and start chat'}
            >
              {submitting ? <Smartphone className="w-5 h-5 animate-pulse" /> : <Check className="w-5 h-5 stroke-[3]" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phone Contacts */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={openPhoneContacts}
            disabled={contactsLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-extrabold shadow-md transition-all"
          >
            {contactsLoading ? <Smartphone className="w-4 h-4 animate-pulse" /> : <Contact className="w-4 h-4" />}
            {contactsLoading ? (isAr ? 'جاري قراءة جهات الاتصال...' : 'Reading contacts...') : (isAr ? 'اختيار من جهات اتصال الهاتف' : 'Choose from phone contacts')}
          </button>
          {contactsMessage && <p className="mt-2 text-[10px] text-amber-500 font-medium">{contactsMessage}</p>}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو البريد الإلكتروني أو الهاتف...' : 'Search by name, email, or phone...'}
              className="w-full ps-9 pe-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-60">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
              {isAr ? 'جاري تحميل المستخدمين...' : 'Loading users...'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isAr ? 'لا يوجد مستخدمون متطابقون' : 'No users found'}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isAlreadyMember = existingIds.has(u.id);
              const isSelected = selectedUserId === u.id;

              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={isAlreadyMember}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between transition-all ${
                    isAlreadyMember
                      ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-850/30 border-slate-200 dark:border-slate-800'
                      : isSelected
                      ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      {u.isOnline && (
                        <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs truncate">{u.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{u.phone || u.email}</p>
                    </div>
                  </div>

                  <div className="shrink-0 ms-2">
                    {isAlreadyMember ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500">
                        {isAr ? 'عضو بالفعل' : 'Already in'}
                      </span>
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {inviteContact && (
          <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-900/40 bg-amber-500/5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{isAr ? 'يمكن دعوة جهة الاتصال للتسجيل ثم بدء المحادثة.' : 'Invite the contact to register, then start the chat.'}</p>
              <div className="text-[9px] text-slate-500 mt-1 break-all">{createInviteLink(inviteContact.name, inviteContact.phone)}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => void navigator.clipboard?.writeText(createInviteLink(inviteContact.name, inviteContact.phone))} className="px-2.5 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-extrabold">{isAr ? 'نسخ' : 'Copy'}</button>
              <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent((isAr?'انضم إلى SMART TIME: ':'Join SMART TIME: ')+createInviteLink(inviteContact.name, inviteContact.phone))}`} className="px-2.5 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-extrabold">WhatsApp</a>
              <button type="button" onClick={() => void shareInvite(inviteContact.name, inviteContact.phone)} className="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-extrabold"><Share2 className="w-4 h-4 inline" /> {isAr ? 'شير' : 'Share'}</button>
            </div>
            <img alt="QR" className="w-16 h-16 rounded-lg bg-white p-1" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(createInviteLink(inviteContact.name, inviteContact.phone))}`} />
          </div>
        )}

        {selectedUserId && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-emerald-500/5 flex items-center justify-between gap-3">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{isAr ? 'جهة الاتصال موجودة على SMART TIME.' : 'Contact is on SMART TIME.'}</p>
            <button type="button" disabled={submitting} onClick={() => void handleAdd(selectedUserId)} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold disabled:opacity-50">{isAr ? 'دردشة' : 'Chat'}</button>
          </div>
        )}
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!selectedUserId || submitting}
            onClick={handleAdd}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-md transition-all active:scale-95"
          >
            {submitting ? (isAr ? 'جاري فتح المحادثة...' : 'Opening chat...') : (isAr ? 'بدء المحادثة' : 'Start Chat')}
          </button>
        </div>
      </div>
    </div>
  );
};