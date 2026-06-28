// ============================================================
//  Commande : tag-setup — Système de tag pseudo
//
//  Quand un membre met le tag configuré dans son pseudo
//  et mentionne le bot dans le salon désigné,
//  le bot lui attribue automatiquement un rôle.
//  Quand le membre retire le tag de son pseudo,
//  le rôle lui est retiré automatiquement.
//
//  Sous-commandes :
//    !tag-setup @rôle <texte>    → configurer le tag et le rôle
//    !tag-setup channel #salon   → salon où pinguer le bot
//    !tag-setup on / off         → activer / désactiver
//    !tag-setup info             → voir la configuration
//    !tag-setup reset            → réinitialiser
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'tag-setup',
  description: 'Configure le système de tag pseudo (rôle automatique)',
  aliases: ['setup-tag', 'tag'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── info ──────────────────────────────────────────────
    if (!sub || sub === 'info') {
      const cfg = db.get(`tag_${gid}`) || {}

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Configuration — Système de Tag')
        .setColor(cfg.active ? 0x00FF88 : 0xFF4444)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Statut',          value: cfg.active ? 'Activé' : 'Désactivé',                         inline: true },
          { name: 'Tag à détecter',  value: cfg.text    ? `\`${cfg.text}\``     : 'Non configuré',        inline: true },
          { name: 'Rôle attribué',   value: cfg.roleId  ? `<@&${cfg.roleId}>`   : 'Non configuré',        inline: true },
          { name: 'Salon de vérif',  value: cfg.channelId ? `<#${cfg.channelId}>` : 'Non configuré',      inline: true },
        )
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          cfg.text && cfg.roleId
            ? `Les membres qui mettent **\`${cfg.text}\`** dans leur pseudo et mentionnent le bot dans <#${cfg.channelId || '...'}> recevront <@&${cfg.roleId}>.`
            : 'Configurez d\'abord le rôle et le tag avec `!tag-setup @rôle <texte>`.'
        )
        .setFooter({ text: `${prefix}tag-setup @rôle <texte> pour configurer | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── on ─────────────────────────────────────────────────
    if (sub === 'on') {
      const cfg = db.get(`tag_${gid}`) || {}
      if (!cfg.roleId || !cfg.text) {
        return message.reply(`Configurez d'abord le rôle et le tag :\n> \`${prefix}tag-setup @rôle <texte>\``)
      }
      cfg.active = true
      db.set(`tag_${gid}`, cfg)
      return message.reply('Système de tag **activé**.')
    }

    // ── off ────────────────────────────────────────────────
    if (sub === 'off') {
      const cfg = db.get(`tag_${gid}`) || {}
      cfg.active = false
      db.set(`tag_${gid}`, cfg)
      return message.reply('Système de tag **désactivé**.')
    }

    // ── reset ──────────────────────────────────────────────
    if (sub === 'reset') {
      db.delete(`tag_${gid}`)
      return message.reply('Configuration du système de tag réinitialisée.')
    }

    // ── channel #salon ─────────────────────────────────────
    if (sub === 'channel') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1])
      if (!ch) return message.reply(`Usage : \`${prefix}tag-setup channel #salon\``)

      const cfg = db.get(`tag_${gid}`) || {}
      cfg.channelId = ch.id
      db.set(`tag_${gid}`, cfg)
      return message.reply(`Salon de vérification défini sur <#${ch.id}>.\nLes membres devront mentionner le bot dans ce salon pour obtenir leur rôle.`)
    }

    // ── @rôle <texte> ──────────────────────────────────────
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    const text = args.slice(role ? 1 : 0).join(' ').trim()

    if (!role || !text) {
      return message.reply(
        `**Usage :** \`${prefix}tag-setup @rôle <texte_du_tag>\`\n` +
        `> Ex : \`${prefix}tag-setup @Taggé | MonServeur\`\n\n` +
        `**Autres sous-commandes :**\n` +
        `> \`${prefix}tag-setup channel #salon\` · Salon de vérification\n` +
        `> \`${prefix}tag-setup on/off\` · Activer/désactiver\n` +
        `> \`${prefix}tag-setup info\` · Voir la config`
      )
    }

    const cfg = {
      roleId:    role.id,
      text,
      channelId: db.get(`tag_${gid}`)?.channelId ?? null,
      active:    true,
    }
    db.set(`tag_${gid}`, cfg)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('Système de tag configuré')
      .setColor(0x00FF88)
      .setDescription(
      .setFooter({ text: 'Made by Wumpus' })
        `Les membres qui mettent **\`${text}\`** dans leur pseudo et mentionnent le bot dans le salon configuré recevront <@&${role.id}>.\n\n` +
        `Quand le tag est retiré du pseudo, le rôle est retiré automatiquement.\n\n` +
        (cfg.channelId
          ? `Salon de vérification : <#${cfg.channelId}>`
          : `> Définissez le salon avec \`${prefix}tag-setup channel #salon\``)
      )
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Tag',  value: `\`${text}\``,  inline: true },
        { name: 'Rôle', value: `<@&${role.id}>`, inline: true },
      )
      .setFooter({ text: `Configuré par ${message.author.username} | Made by Wumpus` })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
