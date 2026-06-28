// ============================================================
//  Commande : public-mode
//  Permet à tous les membres d'utiliser les commandes fun/info
//  sans aucune permission Discord.
//
//  Mode PUBLIC activé :
//    - Tous les membres peuvent utiliser : 8ball, ping, gay,
//      pp, banner, userinfo, serveurinfo, member, vc, stat,
//      politique, pf, pp-random, pp-serveur, prevnames, snipe
//    - !help affiche un menu "public" adapté aux membres
//
//  Mode PUBLIC désactivé :
//    - Ces commandes n'ont aucun garde (elles fonctionnent
//      déjà pour tout le monde par défaut — ce mode sert
//      surtout à contrôler l'accès au !help public)
//
//  Usage :
//    !public-mode on      → activer
//    !public-mode off     → désactiver
//    !public-mode status  → voir l'état
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'public-mode',
  description: 'Permet à tous les membres d\'utiliser les commandes fun/info',
  aliases: ['pubmode', 'mode-public', 'openmode'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid    = message.guild.id
    const sub    = (args[0] || '').toLowerCase()
    const active = db.get(`public_mode_${gid}`) === true

    // ── status ─────────────────────────────────────────────
    if (!sub || sub === 'status' || sub === 'info') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Mode Public — Statut')
        .setColor(active ? 0x00FF88 : 0xFF4444)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          {
            name:   'Statut',
            value:  active
              ? 'Activé — tous les membres peuvent utiliser les commandes fun/info et voir le menu d\'aide.'
              : 'Désactivé — seuls les admins voient le menu d\'aide complet.',
            inline: false,
          },
          {
            name:   'Commandes accessibles à tous en mode public',
            value:
              `\`ping\` \`userinfo\` \`serveurinfo\` \`member\` \`vc\` \`stat\`\n` +
              `\`pp\` \`banner\` \`pp-random\` \`pp-serveur\` \`prevnames\`\n` +
              `\`8ball\` \`pf\` \`gay\` \`politique\` \`snipe\`\n` +
              `\`chess\` \`checkers\` \`poker\` \`fishing\` \`betrayal\` et tous les mini-jeux`,
            inline: false,
          },
          {
            name:   'Toujours réservé aux admins/staff',
            value:
              `\`ban\` \`kick\` \`mute\` \`clear\` \`lock\` et toutes les commandes de modération\n` +
              `\`setup-logs\` \`secur-max\` \`ticket-setup\` et toutes les commandes de configuration`,
            inline: false,
          },
        )
        .setFooter({ text: `${prefix}public-mode on/off pour changer | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── on ─────────────────────────────────────────────────
    if (sub === 'on' || sub === 'activer') {
      if (active) return message.reply('Le mode public est déjà activé.')

      db.set(`public_mode_${gid}`, true)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Mode Public activé')
        .setColor(0x00FF88)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `Tous les membres de **${message.guild.name}** peuvent désormais utiliser \`${prefix}help\` ` +
          `pour voir les commandes fun/info et les utiliser librement.\n\n` +
          `Les commandes de modération et de configuration restent réservées aux admins et à la whitelist.\n\n` +
          `Pour désactiver : \`${prefix}public-mode off\``
        )
        .setFooter({ text: `Activé par ${message.author.username} | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── off ────────────────────────────────────────────────
    if (sub === 'off' || sub === 'désactiver') {
      if (!active) return message.reply('Le mode public est déjà désactivé.')

      db.set(`public_mode_${gid}`, false)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Mode Public désactivé')
        .setColor(0xFF4444)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `Le mode public a été désactivé sur **${message.guild.name}**.\n` +
          `Le menu d'aide n'est plus accessible aux membres sans permission.\n\n` +
          `Pour réactiver : \`${prefix}public-mode on\``
        )
        .setFooter({ text: `Désactivé par ${message.author.username} | Made by Wumpus` })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    message.reply(`Usage : \`${prefix}public-mode on/off\` ou \`${prefix}public-mode status\``)
  },
}
