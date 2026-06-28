// ============================================================
//  Commande : ghostjoin — Système de ghost ping à l'arrivée
//
//  Quand un membre rejoint le serveur, le bot le ping
//  dans tous les salons configurés puis supprime le message
//  immédiatement (ghost ping).
//
//  Sous-commandes :
//    !ghostjoin add #salon     → ajouter un salon
//    !ghostjoin remove #salon  → retirer un salon
//    !ghostjoin list           → voir les salons configurés
//    !ghostjoin test           → tester avec vous-même
//    !ghostjoin off            → désactiver complètement
//
//  Alias : !greet
//  Réservé aux membres avec la permission Gérer les salons.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ghostjoin',
  description: 'Configure le ghost ping à l\'arrivée d\'un membre',
  aliases: ['greet', 'ghost-join', 'ghostping'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── list (défaut) ──────────────────────────────────────
    if (!sub || sub === 'list' || sub === 'ls') {
      const channels = db.get(`${gid}.greets`) ?? []

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Ghost Join — Salons configurés')
        .setColor(0xFF0000)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          channels.length
            ? channels.map(id => `<#${id}>`).join('\n')
            : 'Aucun salon configuré.'
        )
        .addFields({
        .setFooter({ text: 'Made by Wumpus' })
          name: 'Commandes',
          value:
            `\`${prefix}ghostjoin add #salon\` · Ajouter\n` +
            `\`${prefix}ghostjoin remove #salon\` · Retirer\n` +
            `\`${prefix}ghostjoin test\` · Tester\n` +
            `\`${prefix}ghostjoin off\` · Désactiver tout`,
        })
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── add ────────────────────────────────────────────────
    if (sub === 'add' || sub === 'ajouter') {
      const channel = message.mentions.channels.first()
        || message.guild.channels.cache.get(args[1])

      if (!channel) return message.reply(`Usage : \`${prefix}ghostjoin add #salon\``)
      if (!channel.isTextBased()) return message.reply('Ce salon doit être un salon textuel.')

      const channels = db.get(`${gid}.greets`) ?? []
      if (channels.includes(channel.id)) {
        return message.reply(`Le salon <#${channel.id}> est déjà configuré.`)
      }

      channels.push(channel.id)
      db.set(`${gid}.greets`, channels)
      return message.reply(`Ghost ping activé dans <#${channel.id}>.\nTout nouveau membre sera pingé puis le message supprimé.`)
    }

    // ── remove ─────────────────────────────────────────────
    if (sub === 'remove' || sub === 'rm' || sub === 'retirer') {
      const channel = message.mentions.channels.first()
        || message.guild.channels.cache.get(args[1])

      if (!channel) return message.reply(`Usage : \`${prefix}ghostjoin remove #salon\``)

      const channels = db.get(`${gid}.greets`) ?? []
      const filtered = channels.filter(id => id !== channel.id)

      if (filtered.length === channels.length) {
        return message.reply(`<#${channel.id}> n'est pas dans la liste.`)
      }

      db.set(`${gid}.greets`, filtered)
      return message.reply(`Ghost ping désactivé dans <#${channel.id}>.`)
    }

    // ── off ────────────────────────────────────────────────
    if (sub === 'off' || sub === 'disable' || sub === 'desactiver') {
      db.set(`${gid}.greets`, [])
      return message.reply('Ghost ping désactivé sur tous les salons.')
    }

    // ── test ───────────────────────────────────────────────
    if (sub === 'test') {
      const channels = db.get(`${gid}.greets`) ?? []
      if (!channels.length) {
        return message.reply(`Aucun salon configuré. Utilisez \`${prefix}ghostjoin add #salon\`.`)
      }

      let count = 0
      for (const channelId of channels) {
        const ch = message.guild.channels.cache.get(channelId)
        if (!ch) continue
        try {
          const msg = await ch.send(`<@${message.author.id}>`)
          setTimeout(() => msg.delete().catch(() => false), 300)
          count++
        } catch { /* ignore permission errors */ }
      }

      return message.reply(`Test effectué dans **${count}** salon(s).`)
    }

    // Sous-commande inconnue
    return message.reply(`Usage : \`${prefix}ghostjoin add/remove/list/test/off\``)
  },
}
