// ============================================================
//  Commande : invites — Interface moderne
//  Statistiques d'invitations avec navigation
// ============================================================

const { 
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js')
const { getStats, topInviters, getTotal } = require('../utils/invites')

const COLOR = 0xFF0000

module.exports = {
  name: 'invites',
  description: 'Voir les invitations d\'un membre ou le classement',
  aliases: ['inv', 'invitations'],

  run: async (client, message, args, prefix) => {
    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()
    const userId = message.author.id

    // Mode : 'user' ou 'leaderboard'
    let mode = 'user'
    let targetId = message.author.id

    if (sub === 'top' || sub === 'lb' || sub === 'leaderboard') {
      mode = 'leaderboard'
    } else {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
      if (target) targetId = target.id
    }

    const msg = await message.reply({
      components: [buildPanel(message.guild, mode, targetId, userId, 0)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)

    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 300000,
    })

    col.on('collect', async i => {
      if (!i.isButton()) return

      const parts = i.customId.split('_')
      const action = parts[1]

      if (action === 'switchuser') {
        await i.update({
          components: [buildPanel(message.guild, 'user', userId, userId, 0)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      } else if (action === 'switchtop') {
        await i.update({
          components: [buildPanel(message.guild, 'leaderboard', userId, userId, 0)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      } else if (action === 'prevpage') {
        const page = parseInt(parts[2]) || 0
        await i.update({
          components: [buildPanel(message.guild, 'leaderboard', userId, userId, Math.max(0, page - 1))],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      } else if (action === 'nextpage') {
        const page = parseInt(parts[2]) || 0
        await i.update({
          components: [buildPanel(message.guild, 'leaderboard', userId, userId, page + 1)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }
    })

    col.on('end', () => {
      const end = new ContainerBuilder()
        .setAccentColor(COLOR)
        .addTextDisplayComponents(td => td.setContent(
          `## Invitations\n-# Session expirée · \`${prefix}invites\` pour rouvrir`
        ))
      msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
    })
  },
}

// ── Builder ───────────────────────────────────────────────────
function buildPanel(guild, mode, targetId, userId, page = 0) {
  const container = new ContainerBuilder().setAccentColor(COLOR)

  if (mode === 'user') {
    // Mode utilisateur individuel
    const member = guild.members.cache.get(targetId)
    if (!member) {
      container.addTextDisplayComponents(td => td.setContent(
        `## Invitations\n### Membre introuvable\n-# L'utilisateur a peut-être quitté le serveur`
      ))
      return container
    }

    const s = getStats(guild.id, targetId)
    const total = getTotal(guild.id, targetId)

    container.addSectionComponents(sec => sec
      .addTextDisplayComponents(td => td.setContent(
        `## Invitations\n` +
        `### ${member.user.username}\n` +
        `-# ${total} invitation${total > 1 ? 's' : ''} au total`
      ))
      .setThumbnailAccessory(thumb => thumb.setURL(member.user.displayAvatarURL({ size: 128, extension: 'png' })))
    )

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    container.addTextDisplayComponents(td => td.setContent(
      `### Détails\n` +
      `**Réelles :** ${s.real || 0}\n` +
      `**Bonus :** ${s.bonus || 0}\n` +
      `**Fausses :** ${s.fake || 0}\n` +
      `**Membres partis :** ${s.left || 0}`
    ))

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    // Bouton pour voir le classement
    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder()
        .setCustomId(`invites_switchtop_${userId}`)
        .setLabel('Voir le classement')
        .setStyle(ButtonStyle.Primary)
    ))

  } else {
    // Mode leaderboard
    const ITEMS_PER_PAGE = 10
    const top = topInviters(guild.id, 100) // Récupère top 100
    const maxPage = Math.max(0, Math.ceil(top.length / ITEMS_PER_PAGE) - 1)
    const currentPage = Math.max(0, Math.min(page, maxPage))

    const startIdx = currentPage * ITEMS_PER_PAGE
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, top.length)
    const pageData = top.slice(startIdx, endIdx)

    container.addTextDisplayComponents(td => td.setContent(
      `## Classement des inviteurs\n` +
      `### ${guild.name}\n` +
      `-# Page ${currentPage + 1}/${maxPage + 1} • ${top.length} inviteurs`
    ))

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    if (pageData.length === 0) {
      container.addTextDisplayComponents(td => td.setContent(
        `### Aucune invitation\n-# Personne n'a encore invité de membres sur ce serveur`
      ))
    } else {
      const medals = ['🥇', '🥈', '🥉']
      const lines = pageData.map((u, i) => {
        const globalIdx = startIdx + i
        const member = guild.members.cache.get(u.userId)
        const name = member ? member.user.username : `Membre (${u.userId.slice(0, 6)}…)`
        const rank = globalIdx < 3 ? medals[globalIdx] : `\`${(globalIdx + 1).toString().padStart(2, '0')}.\``
        return (
          `${rank} **${name}** — ${u.total} invitations\n` +
          `-# ${u.real} réelles · ${u.bonus} bonus · ${u.left} partis · ${u.fake} fausses`
        )
      })

      container.addTextDisplayComponents(td => td.setContent(lines.join('\n\n')))
    }

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    // Boutons de navigation
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`invites_prevpage_${currentPage}`)
        .setLabel('◀ Précédent')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId(`invites_switchuser_${userId}`)
        .setLabel('Mes invitations')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`invites_nextpage_${currentPage}`)
        .setLabel('Suivant ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= maxPage)
    )

    container.addActionRowComponents(() => row)
  }

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  container.addTextDisplayComponents(td => td.setContent(
    `-# Les invitations sont suivies automatiquement`
  ))

  return container
}
