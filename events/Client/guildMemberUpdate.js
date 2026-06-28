// ============================================================
//  Événement : guildMemberUpdate
//  - Système de tag pseudo
//  - Log rôles ajoutés/retirés + surnom
//  - Tracking prevnames (username / nickname)
// ============================================================

const { sendLog } = require('../../utils/logs')
const prevnamesDB = require('../../utils/prevnamesDB')
const db = require('quick.db')

module.exports = async (client, oldMember, newMember) => {
  if (!newMember.guild) return

  const guildId = newMember.guild.id
  const userId = newMember.id

  // ── Système de tag pseudo ────────────────────────────────
  const tagCfg = db.get(`tag_${guildId}`)
  if (tagCfg?.active && tagCfg?.roleId && tagCfg?.text) {
    const oldNick = (oldMember.nickname ?? oldMember.user.username ?? '').toLowerCase()
    const newNick = (newMember.nickname ?? newMember.user.username ?? '').toLowerCase()
    const tag     = tagCfg.text.toLowerCase()
    const hadTag  = oldNick.includes(tag)
    const hasTag  = newNick.includes(tag)

    if (!hadTag && hasTag) {
      newMember.roles.add(tagCfg.roleId, 'Tag détecté dans le pseudo').catch(() => false)
    } else if (hadTag && !hasTag) {
      newMember.roles.remove(tagCfg.roleId, 'Tag retiré du pseudo').catch(() => false)
      newMember.user.send(
        `Le rôle **<@&${tagCfg.roleId}>** vous a été retiré sur **${newMember.guild.name}** car le tag \`${tagCfg.text}\` n'est plus présent dans votre pseudo.`
      ).catch(() => false)
    }
  }

  // ── Rôles ajoutés ────────────────────────────────────────
  const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id))
  if (addedRoles.size > 0) {
    sendLog(newMember.guild, 'roles', 'Rôle(s) ajouté(s)',
      `**Membre :** <@${userId}>\n**Rôle(s) :** ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`,
      0x00FF88)
  }

  // ── Rôles retirés ────────────────────────────────────────
  const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id))
  if (removedRoles.size > 0) {
    sendLog(newMember.guild, 'roles', 'Rôle(s) retiré(s)',
      `**Membre :** <@${userId}>\n**Rôle(s) :** ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`,
      0xFF4444)
  }

  // ── @username global modifié ─────────────────────────────
  if (oldMember.user?.username !== newMember.user?.username && oldMember.user?.username) {
    prevnamesDB.addPrevName(guildId, userId, oldMember.user.username, 'username')
  }

  // ── Surnom serveur (nickname) modifié ────────────────────
  if (oldMember.nickname !== newMember.nickname) {
    sendLog(newMember.guild, 'members', 'Surnom modifié',
      `**Membre :** <@${userId}>\n**Avant :** ${oldMember.nickname ?? '*aucun*'}\n**Après :** ${newMember.nickname ?? '*aucun*'}`,
      0x5865F2)
    if (oldMember.nickname) {
      prevnamesDB.addPrevName(guildId, userId, oldMember.nickname, 'nickname')
    }
  }
}
