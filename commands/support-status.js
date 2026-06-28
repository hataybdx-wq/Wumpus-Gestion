// ============================================================
//  Commande : support-status
//  Vérifie si un membre soutient le serveur (a le statut requis).
//  Usage : !support-status [@mention]
// ============================================================

const { EmbedBuilder } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'support-status',
  description: 'Vérifie si un membre soutient actuellement le serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const cfg = {
      roleId: db.get(`${message.guild.id}.support.roleId`),
      text:   db.get(`${message.guild.id}.support.text`),
      active: db.get(`${message.guild.id}.support.active`),
    }

    if (!cfg.active || !cfg.roleId || !cfg.text)
      return message.reply('Le système de soutien n\'est pas configuré sur ce serveur.\n> Utilisez `support-setup`.')

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member

    // Vérifie si le membre a le rôle
    const hasRole = target.roles.cache.has(cfg.roleId)

    // Vérifie si le statut actuel contient le texte
    const presence = target.presence
    const customAct = presence?.activities?.find(a => a.type === 4)
    const hasStatus = customAct?.state?.includes(cfg.text) ?? false

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Statut de soutien — ${target.user.username}`)
      .setColor(hasRole ? 0x00FF88 : 0xFF4444)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Rôle accordé',   value: hasRole  ? 'Oui' : 'Non', inline: true  },
        { name: 'Statut actif',   value: hasStatus ? 'Oui' : 'Non', inline: true  },
        { name: '🔍 Texte requis',   value: `\`${cfg.text}\``,              inline: false },
        { name: 'Statut actuel',  value: customAct?.state ? `\`${customAct.state}\`` : '*Aucun statut personnalisé*', inline: false },
      )
      .setFooter({ text: 'Made by Wumpus' })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
