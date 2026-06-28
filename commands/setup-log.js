// ============================================================
//  Commande : setup-log — Configure un type de log individuellement
//
//  Usage :
//    !setup-log <type> #salon
//    !setup-log list           → voir la config actuelle
//    !setup-log reset          → réinitialiser tout
//
//  Types : mod | secur | members | messages | voice | invites | roles | channels
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

const LOG_TYPES = {
  mod:      'Bans, kicks, mutes, clears, tempbans',
  secur:    'Anti-raid, anti-spam, protections actives',
  members:  'Arrivées, départs, changements de surnom',
  messages: 'Messages supprimés et modifiés',
  voice:    'Connexions et déconnexions vocales',
  invites:  'Créations d\'invitations',
  roles:    'Rôles créés, supprimés, modifiés',
  channels: 'Salons créés, supprimés, modifiés',
}

module.exports = {
  name: 'setup-log',
  description: 'Configure un type de log individuellement',
  aliases: ['log-setup'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const sub = args[0]?.toLowerCase()
    const gid = message.guild.id

    // !setup-log list
    if (sub === 'list' || !sub) {
      const global = db.get(`logs_${gid}`)
      const rows = Object.entries(LOG_TYPES).map(([key, desc]) => {
        const id = db.get(`logs_${key}_${gid}`)
        return `\`${key.padEnd(8)}\` ${id ? `<#${id}>` : `*non configuré${global ? ' (utilise le global)' : ''}*`}\n> ${desc}`
      })

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Configuration des logs')
        .setColor(0xFF0000)
        .setDescription(rows.join('\n'))
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Salon global', value: global ? `<#${global}>` : '*Non défini*' },
          { name: 'Configuration', value: `\`${prefix}setup-log <type> #salon\` — Définir un salon\n\`${prefix}setup-log reset\` — Tout réinitialiser\n\`${prefix}setup-logs\` — Création automatique` },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // !setup-log reset
    if (sub === 'reset') {
      for (const key of Object.keys(LOG_TYPES)) db.set(`logs_${key}_${gid}`, null)
      db.set(`logs_${gid}`, null)
      return message.reply('Configuration des logs réinitialisée.')
    }

    // !setup-log <type> #salon
    if (!LOG_TYPES[sub]) {
      return message.reply(
        `Type inconnu : \`${sub}\`\n` +
        `Types disponibles : ${Object.keys(LOG_TYPES).map(k => `\`${k}\``).join(', ')}`
      )
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1])
    if (!channel) return message.reply(`Usage : \`${prefix}setup-log ${sub} #salon\``)

    db.set(`logs_${sub}_${gid}`, channel.id)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('Salon de logs configuré')
      .setColor(0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Type',   value: `\`${sub}\` — ${LOG_TYPES[sub]}`, inline: false },
        { name: 'Salon',  value: `<#${channel.id}>`,                 inline: true  },
      )
      .setFooter({ text: 'Made by Wumpus' })
      .setTimestamp()

    return message.reply({ embeds: [embed] })
  },
}
