function MemberList({ members, creatorId, currentUserId, onTransferOwnership }) {
  const isCurrentUserCreator = creatorId && currentUserId && String(creatorId) === String(currentUserId)

  return (
    <section className="glass-panel rounded-2xl p-4">
      <h3 className="mb-4 text-center text-2xl font-bold text-gray-100">MEMBERS LIST</h3>
      <div className="space-y-3">
        {members.map((member) => {
          const isLeader = creatorId && String(member.id) === String(creatorId)
          const canTransfer = isCurrentUserCreator && !isLeader

          return (
            <article
              key={member.id}
              className="flex items-center justify-between rounded-xl bg-black/25 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/80 text-sm font-bold text-black">
                    {member.avatar}
                  </div>
                  {member.online ? (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-lime-400 ring-2 ring-slate-950" />
                  ) : null}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base text-white">{member.name}</p>
                    {isLeader && (
                      <span className="text-yellow-400" title="Group Leader">
                        👑
                      </span>
                    )}
                  </div>
                  {canTransfer && (
                    <button
                      onClick={() => onTransferOwnership(member.id)}
                      className="mt-1 text-xs text-emerald-300 hover:text-emerald-200 underline"
                    >
                      Make Leader
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-amber-300">🔥 {member.points}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default MemberList
