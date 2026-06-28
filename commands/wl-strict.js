// ============================================================
//  Commande : wl-strict — Mode strict WL par action
//  Quand actif pour une action, même les membres WL et les
//  admins Discord seront sanctionnés si ils font cette action.
//  Seuls server owner, bot owner et owner restent exempts.
//
//  Usage :
//    +wl-strict list               → voir toutes les configs
//    +wl-strict <action> on        → activer le mode strict
//    +wl-strict <action> off       → désactiver (WL exempt)
//
//  Actions : ban | kick | massban | masskick | massmention
//            spam | link | bot | channel | guildupdate | invite
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

const ACTIONS = {
  ban:         'Quelqu\'un ban un membre',
  kick:        'Quelqu\'un expulse un membre',
  massban:     'Mass-ban (>2 bans en 10s)',
  masskick:    'Mass-kick (>2 kicks en 10s)',
  massmention: 'Ping @everyone/@here',
  spam:        'Spam de messages',
  link:        'Lien d\'invitation Discord',
  bot:         'Ajout d\'un bot',
  channel:     'Créa/suppression/modif salon',
  guildupdate: 'Modification du serveur (URL, nom…)',
  invite:      'Création d\'invitation',
}

module.exports = {
  name: 'wl-strict',
  description: 'Mode strict : même les admins/WL sont sanctionnés',
  aliases: ['wls'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub  = args[0]?.toLowerCase()
    const val  = args[1]?.toLowerCase()

    // ── +wl-strict list ──────────────────────────────────────
    if (sub === 'list' || !sub) {
      const rows = Object.entries(ACTIONS).map(([action, desc]) => {
        const strict = db.get(`wl_strict.${gid}.${action}`) === true
        return `${strict ? '🔴' : '🟢'} \`${action.padEnd(14)}\` — ${strict ? '**Strict** (WL non exempt)' : 'Normal (WL exempt)'}`
      })

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('🛡️ Mode Strict WL — Configuration')
        .setColor(0xFF8800)
        .setDescription(rows.join('\n'))
        .addFields({
        .setFooter({ text: 'Made by Wumpus' })
          name: 'ℹ️ Explication',
          value:
            '🟢 **Normal** : WL + admins Discord sont exempts de l\'anti-raid\n' +
            '🔴 **Strict** : PERSONNE n\'est exempt sauf server owner et bot owner\n\n' +
            `**Modifier :** \`${prefix}wl-strict <action> on/off\``,
        })
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── +wl-strict <action> on/off ────────────────────────────
    if (!ACTIONS[sub]) {
      return message.reply(
        `❌ Action inconnue : \`${sub}\`\n` +
        `Actions disponibles : ${Object.keys(ACTIONS).map(a => `\`${a}\``).join(', ')}`
      )
    }

    if (val !== 'on' && val !== 'off') {
      return message.reply(`❌ Utilisez \`on\` ou \`off\`. Ex: \`${prefix}wl-strict ban on\``)
    }

    const strict = val === 'on'
    db.set(`wl_strict.${gid}.${sub}`, strict)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`${strict ? '🔴 Mode Strict' : '🟢 Mode Normal'} — \`${sub}\``)
      .setColor(strict ? 0xFF0000 : 0x00FF88)
      .setDescription(
      .setFooter({ text: 'Made by Wumpus' })
        strict
          ? `⚠️ **Mode strict activé** pour \`${sub}\`\n> Même les membres WL et admins seront sanctionnés si ils font cette action.\n> Seuls le propriétaire du serveur et le bot owner restent exempts.`
          : `✅ **Mode normal rétabli** pour \`${sub}\`\n> Les membres WL et admins Discord sont à nouveau exempts de sanction pour cette action.`
      )
      .setFooter({ text: 'Made by Wumpus' })
      .setTimestamp()

    return message.reply({ embeds: [embed] })
  },
}
