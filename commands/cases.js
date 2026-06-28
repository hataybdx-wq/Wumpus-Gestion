// ============================================================
//  Commande : cases
//  Historique de modération par membre.
//  Enregistre toutes les sanctions (warn, mute, kick, ban) avec ID.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

// Helper exporté pour être appelé par les commandes de sanction
function addCase(gid, userId, caseData) {
  const all = db.get(`cases_${gid}`) || {}
  if (!all[userId]) all[userId] = []
  const caseId = (all[userId].length + 1).toString().padStart(4, '0')
  const entry = { id: caseId, ...caseData, date: Date.now() }
  all[userId].push(entry)
  db.set(`cases_${gid}`, all)
  return entry
}

function getCases(gid, userId) {
  const all = db.get(`cases_${gid}`) || {}
  return all[userId] || []
}

const TYPE_ICONS = {
  warn:    '⚠️',
  mute:    '🔇',
  kick:    '👢',
  ban:     '🔨',
  tempban: '⏱️',
  unban:   '↩️',
  unmute:  '🔊',
}

const TYPE_LABELS = {
  warn:    'Avertissement',
  mute:    'Timeout',
  kick:    'Expulsion',
  ban:     'Bannissement',
  tempban: 'Bannissement temp.',
  unban:   'Déban',
  unmute:  'Untimeout',
}

module.exports = {
  name: 'cases',
  description: 'Voir l\'historique de modération d\'un membre',
  aliases: ['modlog', 'history', 'mod-history'],
  addCase,
  getCases,

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const target = message.mentions.members.first()
      || message.guild.members.cache.get(args[0])
      || await message.guild.members.fetch(args[0]).catch(() => null)

    const targetUser = target?.user || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author

    const cases = getCases(message.guild.id, targetUser.id)

    const container = new ContainerBuilder().setAccentColor(COLOR)

    container.addSectionComponents(sec => sec
      .addTextDisplayComponents(td => td.setContent(
        `## Historique de modération\n### ${targetUser.username}\n-# ${cases.length} cas enregistré${cases.length > 1 ? 's' : ''}`
      ))
      .setThumbnailAccessory(thumb => thumb.setURL(targetUser.displayAvatarURL({ size: 128 })))
    )

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    if (cases.length === 0) {
      container.addTextDisplayComponents(td => td.setContent('_Aucun cas de modération enregistré._'))
    } else {
      // Statistiques
      const stats = {}
      cases.forEach(c => { stats[c.type] = (stats[c.type] || 0) + 1 })
      const statsLine = Object.entries(stats).map(([type, count]) =>
        `${TYPE_ICONS[type] || '•'} ${count} ${TYPE_LABELS[type] || type}`
      ).join(' · ')

      container.addTextDisplayComponents(td => td.setContent(`### Statistiques\n${statsLine}`))

      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

      // Derniers cas
      const entries = [...cases].reverse().slice(0, 15).map(c => {
        const icon = TYPE_ICONS[c.type] || '•'
        const label = TYPE_LABELS[c.type] || c.type
        return `${icon} **\`#${c.id}\` ${label}**\n> ${c.reason || '_aucune raison_'}\n-# Par <@${c.modId}> · <t:${Math.floor(c.date / 1000)}:R>${c.duration ? ` · Durée : ${c.duration}` : ''}`
      }).join('\n\n')

      container.addTextDisplayComponents(td => td.setContent(`### Cas récents\n${entries}`))

      if (cases.length > 15) {
        container.addTextDisplayComponents(td => td.setContent(`-# +${cases.length - 15} cas plus anciens non affichés`))
      }
    }

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
  },
}
