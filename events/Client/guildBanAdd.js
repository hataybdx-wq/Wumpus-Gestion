// ============================================================
//  Événement : guildBanAdd (Client) — Log bannissement
// ============================================================

const { sendLog } = require('../../utils/logs')
const { AuditLogEvent } = require('discord.js')

module.exports = async (client, ban) => {
  if (!ban.guild) return

  let moderator = 'Inconnu'
  let reason    = ban.reason ?? 'Aucune raison'
  try {
    const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
    const entry = audit.entries.first()
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      moderator = `<@${entry.executor.id}>`
      reason    = entry.reason ?? reason
    }
  } catch {}

  sendLog(
    ban.guild, 'mod',
    'Membre banni',
    `**Membre :** ${ban.user.username} (<@${ban.user.id}>)\n**Par :** ${moderator}\n**Raison :** ${reason}`,
    0xFF0000
  )
}
