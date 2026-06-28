// ============================================================
//  Commande : antilink
//  Configure le système anti-liens : mode, whitelist, activation.
//
//  Sous-commandes :
//    !antilink on / off         → activer / désactiver
//    !antilink info             → voir la config actuelle
//    !antilink mode all         → bloquer tous les liens (défaut)
//    !antilink mode invites     → bloquer que les invitations Discord
//    !antilink allow <domaine>  → ajouter à la whitelist
//    !antilink deny <domaine>   → retirer de la whitelist
//    !antilink whitelist        → voir les domaines autorisés
//    !antilink clear            → vider la whitelist
//
//  Exemples :
//    !antilink allow youtube.com
//    !antilink allow twitter.com
//    !antilink mode all
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'antilink',
  description: 'Configure le système anti-liens (mode, whitelist)',
  aliases: ['anti-link', 'antilien', 'anti-lien'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── info (défaut) ──────────────────────────────────────
    if (!sub || sub === 'info' || sub === 'status') {
      const active    = db.get(`link_${gid}`) === true
      const mode      = db.get(`link_mode_${gid}`) || 'all'
      const whitelist = db.get(`link_whitelist_${gid}`) || []

      const modeDesc = {
        all:     'Tous les liens sont bloqués (sauf whitelist)',
        invites: 'Uniquement les invitations Discord sont bloquées',
      }

      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Anti-Link — Configuration')
        .setColor(active ? 0x00FF88 : 0xFF4444)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'État',  value: active ? '🟢 Activé' : '⚫ Désactivé', inline: true },
          { name: 'Mode',  value: `\`${mode}\``, inline: true },
          { name: 'Description', value: modeDesc[mode] || 'Mode inconnu', inline: false },
          {
            name: `Whitelist · ${whitelist.length} domaine(s)`,
            value: whitelist.length > 0
              ? whitelist.map(d => `\`${d}\``).join(', ')
              : '_Aucun domaine autorisé_',
            inline: false,
          },
        )
        .setFooter({ text:
          `${prefix}antilink on/off · mode <all|invites> · allow <domaine> · deny <domaine>`
        })
        .setTimestamp()
      ] })
    }

    // ── on ──────────────────────────────────────────────────
    if (sub === 'on' || sub === 'enable') {
      db.set(`link_${gid}`, true)
      const mode = db.get(`link_mode_${gid}`) || 'all'
      return message.reply(`Anti-Link **activé** en mode \`${mode}\`.`)
    }

    // ── off ─────────────────────────────────────────────────
    if (sub === 'off' || sub === 'disable') {
      db.set(`link_${gid}`, false)
      return message.reply('Anti-Link **désactivé**.')
    }

    // ── mode <all|invites> ──────────────────────────────────
    if (sub === 'mode') {
      const newMode = (args[1] || '').toLowerCase()
      if (!['all', 'invites'].includes(newMode)) {
        return message.reply(
          `Usage : \`${prefix}antilink mode <all|invites>\`\n\n` +
          `**\`all\`** — Bloque tous les liens (sauf la whitelist)\n` +
          `**\`invites\`** — Bloque uniquement les invitations Discord`
        )
      }
      db.set(`link_mode_${gid}`, newMode)
      return message.reply(`Mode anti-link défini sur \`${newMode}\`.`)
    }

    // ── allow <domaine> ─────────────────────────────────────
    if (sub === 'allow' || sub === 'add') {
      const domain = args[1]?.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]

      if (!domain || !domain.includes('.')) {
        return message.reply(
          `Usage : \`${prefix}antilink allow <domaine>\`\n` +
          `**Exemple :** \`${prefix}antilink allow youtube.com\``
        )
      }

      const whitelist = db.get(`link_whitelist_${gid}`) || []
      if (whitelist.includes(domain)) {
        return message.reply(`\`${domain}\` est déjà dans la whitelist.`)
      }

      whitelist.push(domain)
      db.set(`link_whitelist_${gid}`, whitelist)
      return message.reply(`\`${domain}\` ajouté à la whitelist. Les sous-domaines sont également autorisés.`)
    }

    // ── deny <domaine> ──────────────────────────────────────
    if (sub === 'deny' || sub === 'remove' || sub === 'rm') {
      const domain = args[1]?.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]

      if (!domain) return message.reply(`Usage : \`${prefix}antilink deny <domaine>\``)

      const whitelist = db.get(`link_whitelist_${gid}`) || []
      const filtered  = whitelist.filter(d => d !== domain)

      if (filtered.length === whitelist.length) {
        return message.reply(`\`${domain}\` n'est pas dans la whitelist.`)
      }

      db.set(`link_whitelist_${gid}`, filtered)
      return message.reply(`\`${domain}\` retiré de la whitelist.`)
    }

    // ── whitelist / list ────────────────────────────────────
    if (sub === 'whitelist' || sub === 'list' || sub === 'ls') {
      const whitelist = db.get(`link_whitelist_${gid}`) || []

      if (whitelist.length === 0) {
        return message.reply(
          `Whitelist vide.\n` +
          `Ajoutez des domaines avec \`${prefix}antilink allow <domaine>\``
        )
      }

      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`Whitelist Anti-Link · ${whitelist.length} domaine(s)`)
        .setColor(0xFF0000)
        .setDescription(whitelist.map(d => `• \`${d}\``).join('\n'))
        .setFooter({ text: 'Les sous-domaines sont également autorisés' })
      ] })
    }

    // ── clear ───────────────────────────────────────────────
    if (sub === 'clear' || sub === 'reset') {
      db.set(`link_whitelist_${gid}`, [])
      return message.reply('Whitelist vidée.')
    }

    // Aide
    message.reply(
      `**\`${prefix}antilink on/off\`** · Activer/désactiver\n` +
      `**\`${prefix}antilink info\`** · Voir la config\n` +
      `**\`${prefix}antilink mode <all|invites>\`** · Mode de détection\n` +
      `**\`${prefix}antilink allow <domaine>\`** · Ajouter à la whitelist\n` +
      `**\`${prefix}antilink deny <domaine>\`** · Retirer de la whitelist\n` +
      `**\`${prefix}antilink whitelist\`** · Voir la whitelist\n` +
      `**\`${prefix}antilink clear\`** · Vider la whitelist`
    )
  },
}
