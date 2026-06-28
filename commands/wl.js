// ============================================================
//  Commande : wl — Gestion de la Whitelist
//
//  Réservée au propriétaire du bot (abonné ou owner).
//  Les membres WL peuvent utiliser toutes les commandes publiques
//  ET les commandes de modération (ban, kick, mute, clear, lock…).
//  Ils N'ont PAS accès aux commandes setup, secur, logs, antiraid.
//
//  Usage :
//    +wl add @membre         → ajouter à la WL
//    +wl remove @membre      → retirer de la WL
//    +wl list                → voir la liste
//    +wl info @membre        → infos sur un membre WL
// ============================================================

const { EmbedBuilder } = require('discord.js')
const { can, addToWL, removeFromWL, getWLList } = require('../utils/permissions')

module.exports = {
  name: 'wl',
  description: 'Gestion de la whitelist (add/remove/list/info)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    // Réservé bot_owner uniquement
    if (!can(message, 'bot_owner')) return

    const sub = args[0]?.toLowerCase()

    // ── +wl add @membre ──────────────────────────────────────
    if (sub === 'add') {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1])
      if (!target) return message.reply(`Usage : \`${prefix}wl add @membre\``)
      if (target.user.bot) return message.reply('Impossible d\'ajouter un bot à la WL.')
      if (target.id === message.author.id) return message.reply('Vous êtes déjà propriétaire.')

      addToWL(target.id, message.author.id)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Membre ajouté à la Whitelist')
        .setColor(0x00FF88)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: '👤 Membre',    value: `<@${target.id}>`,          inline: true },
          { name: '🔓 Accès',    value: 'Modération + Commandes pub', inline: true },
          { name: 'Bloqué',   value: 'Setup, Secur, Logs, Antiraid', inline: false },
        )
        .setFooter({ text: `Ajouté par ${message.author.username} | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── +wl remove @membre ───────────────────────────────────
    if (sub === 'remove' || sub === 'rm') {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1])
      if (!target) return message.reply(`Usage : \`${prefix}wl remove @membre\``)

      removeFromWL(target.id)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Membre retiré de la Whitelist')
        .setColor(0xFF4444)
        .addFields({ name: '👤 Membre', value: `<@${target.id}>`, inline: true })
        .setFooter({ text: `Retiré par ${message.author.username} | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── +wl list ─────────────────────────────────────────────
    if (sub === 'list' || sub === 'ls' || !sub) {
      const list = getWLList()

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`Whitelist du bot (${list.length} membre${list.length > 1 ? 's' : ''})`)
        .setColor(0x5865F2)
        .setFooter({ text: 'Made by Wumpus' })

      if (list.length === 0) {
        embed.setDescription('*Aucun membre en whitelist.*')
      } else {
        embed.setDescription(
          list.map((e, i) =>
            `**${i + 1}.** <@${e.userId}> — ajouté <t:${Math.floor(e.addedAt / 1000)}:R>`
          ).join('\n').slice(0, 4000)
        )
      }

      embed.addFields({
        name: 'ℹ️ Accès WL',
        value: 'Modération (ban, kick, mute, clear, lock…)\nToutes commandes publiques\nSetup logs/captcha, Secur, Antiraid',
      })
      .setFooter({ text: 'Made by Wumpus' })
      embed.setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── +wl info @membre ─────────────────────────────────────
    if (sub === 'info') {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1])
      if (!target) return message.reply(`Usage : \`${prefix}wl info @membre\``)

      const list = getWLList()
      const entry = list.find(e => e.userId === target.id)

      if (!entry) return message.reply(`<@${target.id}> n'est pas dans la whitelist.`)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Info Whitelist')
        .setColor(0x5865F2)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: '👤 Membre',   value: `<@${target.id}>`,                                     inline: true },
          { name: '📅 Ajouté',   value: `<t:${Math.floor(entry.addedAt / 1000)}:F>`,           inline: true },
          { name: '👑 Ajouté par', value: entry.addedBy ? `<@${entry.addedBy}>` : 'Inconnu', inline: true },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // Aide si sous-commande inconnue
    message.reply(
      `Sous-commande inconnue.\n` +
      `**Usage :**\n` +
      `> \`${prefix}wl add @membre\`\n` +
      `> \`${prefix}wl remove @membre\`\n` +
      `> \`${prefix}wl list\`\n` +
      `> \`${prefix}wl info @membre\``
    )
  },
}
