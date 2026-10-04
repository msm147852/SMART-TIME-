              type="button"
              onClick={() => setShowMembersSidebar((prev) => !prev)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl ${chatIconButton} ${
                showMembersSidebar
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-500/15 ring-1 ring-sky-500/40'
                  : 'text-slate-700 dark:text-slate-300'
              } transition-all hover:scale-105 flex items-center gap-1.5`}
              title={isAr ? 'الأعضاء' : 'Members'}
            >
              <Users className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'الأعضاء' : 'Members'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {roomMembers.filter((m) => m.isOnline).length || 1}
              </span>
            </button>

            {/* Direct Add Member / Contact */}
            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className={`p-2 sm:p-2.5 rounded-xl ${chatIconButton} text-emerald-500 transition-all hover:scale-105`}
              title={isAr ? 'إضافة عضو / بدء محادثة مباشرة' : 'Add member / start direct chat'}
              aria-label={isAr ? 'إضافة عضو أو بدء محادثة مباشرة' : 'Add member or start direct chat'}
            >
              <UserPlus className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveCall('voice')}
              className={`p-2 sm:p-2.5 rounded-xl ${chatIconButton} text-sky-500 transition-all hover:scale-105`}
              title={isAr ? 'مكالمة صوتية' : 'Voice Call'}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveCall('video')}
              className={`p-2 sm:p-2.5 rounded-xl ${chatIconButton} text-sky-500 transition-all hover:scale-105`}
              title={isAr ? 'مكالمة فيديو' : 'Video Call'}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRoomInfoModal(true)}
              className={`p-2 sm:p-2.5 rounded-xl ${chatIconButton} text-slate-600 dark:text-slate-300 transition-all hover:scale-105`}
              title={isAr ? 'إعدادات الغرفة' : 'Room Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>