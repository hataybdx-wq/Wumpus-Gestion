// ============================================================
//  Commande : warns — Voir l'historique d'avertissements
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

function getWarns(gid, uid) {
  const all = db.get(`warns_${gid}`) || {}
  return all[uid] || []
}

module.exports = {
  name: 'warns',
  description: 'Voir les avertissements d\'un membre',
  aliases: ['warnings', 'avertissements'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const target = message.mentions.members.first()
      || message.guild.members.cache.get(args[0])
      || message.member

    const list = getWarns(message.guild.id, target.id)

    const container = new ContainerBuilder().setAccentColor(COLOR)

    container.addSectionComponents(sec => sec
      .addTextDisplayComponents(td => td.setContent(
        `## Avertissements\n### ${target.user.username}\n-# ${list.length} warn${list.length > 1 ? 's' : ''} au total`
      ))
      .setThumbnailAccessory(thumb => thumb.setURL(target.user.displayAvatarURL({ size: 128 })))
    )

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

    if (list.length === 0) {
      container.addTextDisplayComponents(td => td.setContent(`_Ce membre n'a aucun avertissement._`))
    } else {
      const entries = [...list].reverse().slice(0, 15).map((w, i) => {
        return `**#${list.length - i}** · \`${w.id}\`\n> ${w.reason}\n-# Par <@${w.modId}> · <t:${Math.floor(w.date / 1000)}:R>`
      }).join('\n\n')

      container.addTextDisplayComponents(td => td.setContent(entries))

      if (list.length > 15) {
        container.addTextDisplayComponents(td => td.setContent(`-# +${list.length - 15} warns plus anciens non affichés`))
      }
    }

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

    container.addTextDisplayComponents(td => td.setContent(
      `-# \`${prefix}unwarn @m <id>\` retirer un warn · \`${prefix}clearwarns @m\` tout effacer`
    ))

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
  },
}
