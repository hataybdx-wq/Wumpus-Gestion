// ============================================================
//  Commande : support-setup
//  Configure le système de soutien public pour ce serveur.
//  Le soutien = un membre met un texte spécifique dans son statut
//  personnalisé Discord → reçoit automatiquement un rôle.
//
//  Usage : !support-setup @rôle <texte_du_statut>
//  Ex    : !support-setup @Supporter discord.gg/monserveur
//
//  Réservé aux ADMINISTRATEURS.
//  Chaque serveur a sa propre config indépendante.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'support-setup',
  description: 'Configure le système de soutien par statut',
  aliases: ['setup-support'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    // ── Sous-commande : voir la config actuelle ──────────────
    if (args[0] === 'info') {
      const roleId  = db.get(`${message.guild.id}.support.roleId`)
      const text    = db.get(`${message.guild.id}.support.text`)
      const active  = db.get(`${message.guild.id}.support.active`)
      const reward  = db.get(`${message.guild.id}.support.reward`)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Config du système de soutien')
        .setColor(active ? 0x00FF88 : 0xFF4444)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Statut',          value: active ? 'Activé' : 'Désactivé',          inline: true  },
          { name: 'Rôle accordé',    value: roleId ? `<@&${roleId}>` : 'Non configuré',     inline: true  },
          { name: 'Texte détecté',   value: text   ? `\`${text}\``  : 'Non configuré',     inline: false },
          { name: 'Récompense msg',  value: reward ?? 'Aucun message de récompense défini', inline: false },
        )
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) ?? undefined })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── Sous-commande : désactiver ───────────────────────────
    if (args[0] === 'off') {
      db.set(`${message.guild.id}.support.active`, false)
      return message.reply('Système de soutien **désactivé**.')
    }

    // ── Sous-commande : activer ──────────────────────────────
    if (args[0] === 'on') {
      const roleId = db.get(`${message.guild.id}.support.roleId`)
      const text   = db.get(`${message.guild.id}.support.text`)
      if (!roleId || !text) return message.reply('Configurez d\'abord le rôle et le texte !\n> `!support-setup @rôle <texte>`')
      db.set(`${message.guild.id}.support.active`, true)
      return message.reply('Système de soutien **activé**.')
    }

    // ── Configuration principale : @rôle + texte ────────────
    const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    const text   = args.slice(role ? 1 : 0).join(' ')

    if (!role)   return message.reply(`**Usage :** \`${prefix}support-setup @rôle <texte_du_statut>\`\n> Ex : \`${prefix}support-setup @Supporter discord.gg/monserveur\``)
    if (!text)   return message.reply(`**Usage :** \`${prefix}support-setup @rôle <texte_du_statut>\`\n> Ex : \`${prefix}support-setup @Supporter discord.gg/monserveur\``)

    // Sauvegarde la config propre à ce serveur
    db.set(`${message.guild.id}.support.roleId`, role.id)
    db.set(`${message.guild.id}.support.text`,   text)
    db.set(`${message.guild.id}.support.active`, true)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('Système de soutien configuré !')
      .setColor(0x00FF88)
      .setDescription(
      .setFooter({ text: 'Made by Wumpus' })
        `Les membres qui mettent **\`${text}\`** dans leur statut personnalisé Discord\n` +
        `recevront automatiquement le rôle <@&${role.id}> sur ce serveur.\n\n` +
        `> ℹ️ Pour modifier le message de récompense : \`${prefix}support-reward <message>\`\n` +
        `> ℹ️ Pour désactiver : \`${prefix}support-setup off\`\n` +
        `> ℹ️ Pour voir la config : \`${prefix}support-setup info\``
      )
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Rôle',  value: `<@&${role.id}>`, inline: true },
        { name: 'Texte', value: `\`${text}\``,    inline: true },
      )
      .setFooter({ text: `Configuré par ${message.author.username} | Made by Wumpus` })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
