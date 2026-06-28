// ============================================================
//  Commande : warn — Avertir un membre
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function applyAutoSanction(member, count, reason) {
  const rules = db.get(`warnrules_${member.guild.id}`) || {}
  const rule = rules[count]
  if (!rule) return null

  try {
    if (rule === 'mute') {
      await member.timeout(3600000, `Auto-sanction ${count} warns: ${reason}`)
      return 'Timeout 1h'
    }
    if (rule === 'kick') {
      await member.kick(`Auto-sanction ${count} warns: ${reason}`)
      return 'Expulsé'
    }
    if (rule === 'ban') {
      await member.ban({ reason: `Auto-sanction ${count} warns: ${reason}` })
      return 'Banni'
    }
  } catch { return null }
  return null
}

module.exports = {
  name: 'warn',
  description: 'Avertir un membre',
  aliases: ['warning', 'avertir'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!target) return message.reply(`Usage : \`${prefix}warn @membre <raison>\``)

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie'
    if (target.id === message.author.id) return message.reply('Vous ne pouvez pas vous avertir vous-même.')
    if (target.user.bot) return message.reply('Vous ne pouvez pas avertir un bot.')
    if (target.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Vous ne pouvez pas avertir un administrateur.')
    }

    const warn = {
      id:     genId(),
      modId:  message.author.id,
      reason,
      date:   Date.now(),
    }

    const all = db.get(`warns_${message.guild.id}`) || {}
    if (!all[target.id]) all[target.id] = []
    all[target.id].push(warn)
    db.set(`warns_${message.guild.id}`, all)

    const list = all[target.id]

    // DM au membre
    target.user.send({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Avertissement sur ${message.guild.name}`)
      .setColor(0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Raison',       value: reason, inline: false },
        { name: 'Warns totaux', value: `${list.length}`, inline: true },
        { name: 'ID du warn',   value: `\`${warn.id}\``, inline: true },
      )
      .setFooter({ text: 'Made by Wumpus' })
      .setTimestamp()
    ] }).catch(() => false)

    // Auto-sanction
    const autoAction = await applyAutoSanction(target, list.length, reason)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('Avertissement enregistré')
      .setColor(0xFF0000)
      .setDescription(
      .setFooter({ text: 'Made by Wumpus' })
        `<@${target.id}> a reçu un avertissement.\n\n` +
        `**Raison :** ${reason}\n` +
        `**Warns totaux :** ${list.length}\n` +
        `**ID :** \`${warn.id}\``
      )

    if (autoAction) {
      embed.addFields({ name: 'Action automatique', value: `**${autoAction}** (règle : ${list.length} warns)` })
    }

    message.reply({ embeds: [embed] })
  },
}
