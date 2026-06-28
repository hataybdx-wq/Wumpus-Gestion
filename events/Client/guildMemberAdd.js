// ============================================================
//  Événement : guildMemberAdd — Log arrivée + tracking invite
// ============================================================

const { EmbedBuilder } = require('discord.js')
const { sendLog } = require('../../utils/logs')
const {
  getCache, setCache, getConfig, addInvite, getStats, getTotal,
} = require('../../utils/invites')
const db = require('quick.db')

module.exports = async (client, member) => {
  if (!member.guild) return
  if (member.user.bot) return

  // ── Message de bienvenue ─────────────────────────────────
  const welcomeCfg = db.get(`welcome_${member.guild.id}`) || {}
  if (welcomeCfg.welcome_channel && welcomeCfg.welcome_message) {
    const ch = member.guild.channels.cache.get(welcomeCfg.welcome_channel)
    if (ch) {
      const { formatMessage } = require('../../commands/welcome')
      ch.send(formatMessage(welcomeCfg.welcome_message, member, member.guild)).catch(() => false)
    }
  }
  if (welcomeCfg.welcome_dm) {
    const { formatMessage } = require('../../commands/welcome')
    member.user.send(formatMessage(welcomeCfg.welcome_dm, member, member.guild)).catch(() => false)
  }

  // ── Auto-rôles à l'arrivée ───────────────────────────────
  const autoroles = db.get(`autoroles_${member.guild.id}`) || []
  if (autoroles.length > 0) {
    for (const roleId of autoroles) {
      const role = member.guild.roles.cache.get(roleId)
      if (role && !member.roles.cache.has(roleId)) {
        member.roles.add(roleId, 'Auto-rôle à l\'arrivée').catch(() => false)
      }
    }
  }

  // ── Ghost ping à l'arrivée ───────────────────────────────
  const greetChannels = db.get(`${member.guild.id}.greets`) ?? []
  for (const channelId of greetChannels) {
    const ch = member.guild.channels.cache.get(channelId)
    if (!ch) continue
    try {
      const msg = await ch.send(`<@${member.id}>`)
      setTimeout(() => msg.delete().catch(() => false), 300)
    } catch { /* ignore: pas les permissions */ }
  }

  const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000)
  const isNew = accountAgeDays < 7

  // ── Log membre arrivé (system logs) ─────────────────────
  sendLog(
    member.guild, 'members',
    'Membre arrivé',
    `<@${member.id}> a rejoint le serveur.\n\n**ID :** \`${member.id}\`\n**Compte créé :** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Âge du compte :** ${accountAgeDays} jours${isNew ? '\n**Compte récent !**' : ''}`,
    isNew ? 0xFF4444 : 0x00FF88,
    [{ name: 'Membres total', value: `${member.guild.memberCount}`, inline: true }]
  )

  // ── Tracking d'invitations ──────────────────────────────
  const cfg = getConfig(member.guild.id)
  if (!cfg.active) return

  let inviter    = null
  let inviteCode = null

  try {
    const newInvites = await member.guild.invites.fetch()
    const cache      = getCache(member.guild.id)

    const used = newInvites.find(inv => {
      const prev = cache[inv.code] ?? 0
      return inv.uses > prev
    })

    if (used) {
      inviter    = used.inviter
      inviteCode = used.code
    }

    const newCache = {}
    newInvites.forEach(inv => { newCache[inv.code] = inv.uses || 0 })
    setCache(member.guild.id, newCache)
  } catch (err) {
    console.error(`[INVITES] fetch error:`, err.message)
  }

  // ── Enregistrer l'invitation + rôles paliers + DM ───────
  if (inviter) {
    addInvite(member.guild.id, inviter.id, member.id)
    const total = getTotal(member.guild.id, inviter.id)

    if (cfg.milestoneRoles && cfg.milestoneRoles.length > 0) {
      try {
        const inviterMember = await member.guild.members.fetch(inviter.id).catch(() => null)
        if (inviterMember) {
          const toGive = cfg.milestoneRoles.filter(r => total >= r.count)
          for (const m of toGive) {
            if (!inviterMember.roles.cache.has(m.roleId)) {
              await inviterMember.roles.add(m.roleId).catch(() => false)
            }
          }
        }
      } catch { /* ignore */ }

      const justReached = cfg.milestoneRoles.find(r => r.count === total)
      if (justReached && cfg.dmMessage) {
        const msg = cfg.dmMessage
          .replace('{user}',   inviter.username)
          .replace('{count}',  String(total))
          .replace('{server}', member.guild.name)
        inviter.send(msg).catch(() => false)
      }
    }
  }

  // ── Message join dans le salon configuré ────────────────
  if (cfg.logsChannelId) {
    const logChannel = member.guild.channels.cache.get(cfg.logsChannelId)
    if (logChannel) {
      const stats = inviter ? getStats(member.guild.id, inviter.id) : null

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setColor(0x00FF88)
        .setTitle('Nouveau membre')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `<@${member.id}> a rejoint **${member.guild.name}**.\n\n` +
          (inviter
            ? `Invité par <@${inviter.id}> (\`${inviteCode}\`)\nTotal de **${stats ? (stats.real || 0) : 0}** invitations réelles.`
            : 'Invitation inconnue (vanity URL ou lien expiré).')
        )
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Compte créé',        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Membres du serveur', value: `${member.guild.memberCount}`,                              inline: true },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      logChannel.send({ embeds: [embed] }).catch(() => false)
    }
  }
}
