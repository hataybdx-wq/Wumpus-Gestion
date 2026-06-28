// ============================================================
//  Événement : inviteCreate (Client) — Log création invitations
//  (distinct de SecurMax/inviteCreate qui bloque les invites)
// ============================================================

const { sendLog } = require('../../utils/logs')
const { getCache, setCache } = require('../../utils/invites')

module.exports = async (client, invite) => {
  if (!invite.guild) return

  // Mettre à jour le cache des invitations
  try {
    const cache = getCache(invite.guild.id)
    cache[invite.code] = invite.uses || 0
    setCache(invite.guild.id, cache)
  } catch { /* ignore */ }

  const maxAge  = invite.maxAge  === 0 ? 'Jamais'  : `${invite.maxAge / 3600}h`
  const maxUses = invite.maxUses === 0 ? 'Illimité' : invite.maxUses

  sendLog(
    invite.guild, 'invites',
    'Invitation créée',
    `**Code :** \`${invite.code}\`\n**Créé par :** <@${invite.inviterId}>\n**Salon :** <#${invite.channel?.id}>\n**Expire :** ${maxAge}\n**Utilisations max :** ${maxUses}`,
    0x5865F2
  )
}
