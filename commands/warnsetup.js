// ============================================================
//  Commande : warnsetup — Auto-sanctions par nombre de warns
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'warnsetup',
  description: 'Configurer les actions automatiques par nombre de warns',
  aliases: ['warnconfig', 'setup-warns'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = args[0]?.toLowerCase()

    if (!sub || sub === 'list') {
      const rules = db.get(`warnrules_${gid}`) || {}
      const entries = Object.entries(rules).sort(([a], [b]) => parseInt(a) - parseInt(b))

      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Règles d\'auto-sanction par warns')
        .setColor(0xFF0000)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          entries.length > 0
            ? entries.map(([count, sanction]) => {
                const label = sanction === 'mute' ? 'Timeout 1h' : sanction === 'kick' ? 'Expulsion' : 'Bannissement'
                return `**${count} warn${count > 1 ? 's' : ''}** → ${label}`
              }).join('\n')
            : '_Aucune règle configurée_'
        )
        .addFields({
        .setFooter({ text: 'Made by Wumpus' })
          name: 'Commandes',
          value:
            `\`${prefix}warnsetup <N> mute\` · Timeout 1h à N warns\n` +
            `\`${prefix}warnsetup <N> kick\` · Expulsion à N warns\n` +
            `\`${prefix}warnsetup <N> ban\` · Bannissement à N warns\n` +
            `\`${prefix}warnsetup remove <N>\` · Retirer une règle\n` +
            `\`${prefix}warnsetup reset\` · Tout supprimer`,
        })
      ] })
    }

    if (sub === 'reset') {
      db.delete(`warnrules_${gid}`)
      return message.reply('Toutes les règles d\'auto-sanction supprimées.')
    }

    if (sub === 'remove' || sub === 'rm') {
      const n = parseInt(args[1])
      if (isNaN(n)) return message.reply(`Usage : \`${prefix}warnsetup remove <N>\``)

      const rules = db.get(`warnrules_${gid}`) || {}
      delete rules[n]
      db.set(`warnrules_${gid}`, rules)
      return message.reply(`Règle pour ${n} warns retirée.`)
    }

    const n = parseInt(sub)
    if (isNaN(n) || n < 1) {
      return message.reply(`Usage : \`${prefix}warnsetup <nombre_warns> <mute|kick|ban>\``)
    }

    const sanction = args[1]?.toLowerCase()
    if (!['mute', 'kick', 'ban'].includes(sanction)) {
      return message.reply(`Sanctions valides : \`mute\` \`kick\` \`ban\``)
    }

    const rules = db.get(`warnrules_${gid}`) || {}
    rules[n] = sanction
    db.set(`warnrules_${gid}`, rules)

    const label = sanction === 'mute' ? 'Timeout 1h' : sanction === 'kick' ? 'Expulsion' : 'Bannissement'
    return message.reply(`À **${n} warn${n > 1 ? 's' : ''}**, le membre sera automatiquement **${label}**.`)
  },
}
