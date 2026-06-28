// ============================================================
//  Événement : presenceUpdate (Automod)
//  Deux systèmes configurables par serveur :
//  1. set-status  → rôle selon texte de statut
//  2. support     → rôle de soutien public
// ============================================================

const db = require('quick.db')

module.exports = async (client, oldPresence, newPresence) => {
  if (!newPresence?.guild) return
  if (!newPresence.userId) return

  const guild = newPresence.guild

  const customActivity = newPresence.activities?.find(a => a.type === 4)
  const stateText      = customActivity?.state ?? ''

  const member = guild.members.cache.get(newPresence.userId)
  if (!member || member.user.bot) return

  // ── 1. Système set-status ───────────────────────────────────
  const statusRoleId = db.get(`${guild.id}.statusrole`)
  const statusText   = db.get(`${guild.id}.statusmessage`)

  if (statusRoleId && statusText && guild.roles.cache.has(statusRoleId)) {
    if (stateText.includes(statusText)) {
      if (!member.roles.cache.has(statusRoleId))
        member.roles.add(statusRoleId, 'Set-Status : texte détecté').catch(() => false)
    } else {
      if (member.roles.cache.has(statusRoleId))
        member.roles.remove(statusRoleId, 'Set-Status : texte absent').catch(() => false)
    }
  }

  // ── 2. Système de soutien public ────────────────────────────
  const supportActive = db.get(`${guild.id}.support.active`)
  const supportRoleId = db.get(`${guild.id}.support.roleId`)
  const supportText   = db.get(`${guild.id}.support.text`)

  if (!supportActive || !supportRoleId || !supportText) return
  if (!guild.roles.cache.has(supportRoleId)) return

  const isSupporting = stateText.includes(supportText)
  const hadRole      = member.roles.cache.has(supportRoleId)

  if (isSupporting && !hadRole) {
    await member.roles.add(supportRoleId, 'Support : statut détecté').catch(() => false)

    // Vérifier si le DM a déjà été envoyé à ce membre sur ce serveur
    const dmKey = `support_dm_sent_${guild.id}_${member.id}`
    const alreadySent = db.get(dmKey) === true

    if (!alreadySent) {
      // DM de récompense (une seule fois par membre)
      const rewardMsg = db.get(`${guild.id}.support.reward`)
      if (rewardMsg) {
        const formatted = rewardMsg
          .replace(/{user}/g,   member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{role}/g,   guild.roles.cache.get(supportRoleId)?.name ?? '')

        const sent = await member.user.send(`💎 **${guild.name}** — ${formatted}`)
          .then(() => true).catch(() => false)

        // Marquer comme envoyé seulement si l'envoi a réussi
        if (sent) db.set(dmKey, true)
      }

      // Log uniquement lors de la première fois
      const logsChId = db.get(`logs_members_${guild.id}`) || db.get(`logs_${guild.id}`)
      if (logsChId) {
        const logsCh = guild.channels.cache.get(logsChId)
        if (logsCh) {
          const { EmbedBuilder } = require('discord.js')
          logsCh.send({
            embeds: [new EmbedBuilder()
              .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
              .setTitle('💎 Nouveau Supporter')
              .setDescription(`<@${member.id}> soutient maintenant le serveur !\nRôle accordé : <@&${supportRoleId}>`)
              .setFooter({ text: 'Made by Wumpus' })
              .setColor(0xFFD700).setTimestamp()],
          }).catch(() => false)
        }
      }
    }

  } else if (!isSupporting && hadRole) {
    member.roles.remove(supportRoleId, 'Support : statut retiré').catch(() => false)
  }
}
