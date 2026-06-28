// ============================================================
//  Commande : set-sanction
//  Configure la sanction ET le seuil de chaque protection.
//
//  Usage :
//    !set-sanction list
//    !set-sanction <action> <sanction> [durée]
//    !set-sanction <action> seuil <nombre>   → changer le seuil
//    !set-sanction default <sanction>
//    !set-sanction reset
//
//  Exemples :
//    !set-sanction massban ban          → ban si mass-ban
//    !set-sanction massban seuil 3      → déclencher après 3 bans en 10s
//    !set-sanction spam mute
//    !set-sanction spam seuil 3         → déclencher après 3 messages en 7s
//    !set-sanction massmention seuil 1  → sanctionner au 1er @everyone
//
//  En mode SECUR-MAX, tous les seuils sont forcés à 1.
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

// seuil: null = pas de compteur (se déclenche à chaque fois)
// seuil: N    = défaut N avant déclenchement
const ACTIONS = {
  ban:         { desc: 'Quelqu\'un bannit sans autorisation',           seuil: null },
  kick:        { desc: 'Quelqu\'un expulse sans autorisation',          seuil: null },
  massban:     { desc: 'Mass-ban',                                      seuil: 2    },
  masskick:    { desc: 'Mass-kick',                                     seuil: 2    },
  massmention: { desc: 'Ping @everyone/@here',                          seuil: 1    },
  spam:        { desc: 'Spam de messages',                              seuil: 5    },
  link:        { desc: 'Lien Discord envoyé sans autorisation',         seuil: null },
  bot:         { desc: 'Bot ajouté sans autorisation',                  seuil: 1    },
  channel:     { desc: 'Salon créé/supprimé/modifié sans autorisation', seuil: 1    },
  guildupdate: { desc: 'Serveur modifié (nom, icône…)',                 seuil: null },
  invite:      { desc: 'Invitation créée sans autorisation',            seuil: null },
  raid:        { desc: 'Nouveau membre en mode anti-raid',              seuil: null },
}

const SANCTIONS = ['warn', 'mute', 'kick', 'ban', 'tempban']
const DURATIONS = {
  '1h': 3600000, '6h': 21600000, '12h': 43200000,
  '24h': 86400000, '7d': 604800000, '30d': 2592000000,
}

// ── Getter seuil — utilisé par les events ─────────────────────
// IMPORTANT : le spam n'est PAS forcé à 1 en secur-max
// (seuil 1 = tout message = sanction immédiate = faux positifs massifs)
function getSeuil(gid, action) {
  const stored = db.get(`sanctions.${gid}.${action}_seuil`)

  if (db.get(`secur_${gid}`) === true) {
    if (action === 'spam') {
      // Minimum 3 messages en secur-max, jamais 1
      return stored ? Math.max(stored, 3) : 3
    }
    // Toutes les autres actions → seuil 1 en secur-max
    return 1
  }

  return stored ?? (ACTIONS[action]?.seuil ?? 1)
}

module.exports = {
  name: 'set-sanction',
  description: 'Configure la sanction et le seuil de déclenchement de chaque protection',
  aliases: ['sanction-set', 'ss'],
  getSeuil,

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid      = message.guild.id
    const sub      = args[0]?.toLowerCase()
    const securMax = db.get(`secur_${gid}`) === true

    // ── list ─────────────────────────────────────────────────
    if (sub === 'list' || !sub) {
      const defSanction = db.get(`sanctions.${gid}.default`) || 'kick'

      const rows = Object.entries(ACTIONS).map(([action, info]) => {
        const type   = db.get(`sanctions.${gid}.${action}`) || `*(${defSanction})*`
        const dur    = db.get(`sanctions.${gid}.${action}_duration`)
        const durStr = dur ? ` ${formatDur(dur)}` : ''

        let seuilStr = ''
        if (info.seuil !== null) {
          const val = securMax ? '**1** *(secur-max)*' : `**${db.get(`sanctions.${gid}.${action}_seuil`) ?? info.seuil}**`
          seuilStr = ` · seuil: ${val}`
        }

        return `\`${action.padEnd(12)}\` **${type}**${durStr}${seuilStr}`
      })

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Sanctions & Seuils')
        .setColor(securMax ? 0xFF0000 : 0xFF8800)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          (securMax ? '**SECUR-MAX actif** — seuils forcés à **1**.\n\n' : '') +
          rows.join('\n')
        )
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Sanction par défaut', value: `\`${defSanction}\``, inline: true },
          { name: 'Changer sanction', value: `\`${prefix}set-sanction <action> <sanction>\``, inline: false },
          { name: 'Changer seuil',    value: `\`${prefix}set-sanction <action> seuil <nombre>\``, inline: false },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      return message.reply({ embeds: [embed] })
    }

    // ── reset ────────────────────────────────────────────────
    if (sub === 'reset') {
      for (const action of [...Object.keys(ACTIONS), 'default']) {
        db.set(`sanctions.${gid}.${action}`, null)
        db.set(`sanctions.${gid}.${action}_duration`, null)
        db.set(`sanctions.${gid}.${action}_seuil`, null)
      }
      return message.reply('Sanctions et seuils remis aux valeurs par défaut.')
    }

    // ── default ──────────────────────────────────────────────
    if (sub === 'default') {
      const s = args[1]?.toLowerCase()
      if (!SANCTIONS.includes(s))
        return message.reply(`Sanctions valides : ${SANCTIONS.map(s => `\`${s}\``).join(' · ')}`)
      db.set(`sanctions.${gid}.default`, s)
      return message.reply(`Sanction par défaut → \`${s}\``)
    }

    // ── <action> seuil <n> ───────────────────────────────────
    if (args[1]?.toLowerCase() === 'seuil') {
      if (!ACTIONS[sub])
        return message.reply(`Action inconnue : \`${sub}\``)
      if (ACTIONS[sub].seuil === null)
        return message.reply(`\`${sub}\` n'a pas de seuil — elle se déclenche à chaque action.`)

      const n = parseInt(args[2])
      if (isNaN(n) || n < 1 || n > 50)
        return message.reply(`Usage : \`${prefix}set-sanction ${sub} seuil <1-50>\``)

      db.set(`sanctions.${gid}.${sub}_seuil`, n)

      const note = securMax ? '\n**Note :** secur-max est actif, ce seuil sera ignoré (forcé à 1).' : ''
      return message.reply(`Seuil \`${sub}\` → **${n}**${note}`)
    }

    // ── <action> <sanction> [durée] ──────────────────────────
    const action   = sub
    const sanction = args[1]?.toLowerCase()
    const durStr   = args[2]?.toLowerCase()

    if (!ACTIONS[action])
      return message.reply(
        `Action inconnue : \`${action}\`\n\n**Actions disponibles :**\n` +
        Object.entries(ACTIONS).map(([k, v]) => `> \`${k}\` — ${v.desc}`).join('\n')
      )

    if (!SANCTIONS.includes(sanction))
      return message.reply(
        `Sanction invalide : \`${sanction}\`\n` +
        `Disponibles : ${SANCTIONS.map(s => `\`${s}\``).join(' · ')}\n\n` +
        `Pour modifier le seuil : \`${prefix}set-sanction ${action} seuil <nombre>\``
      )

    let durationMs = DURATIONS['24h']
    if (sanction === 'tempban' && durStr) {
      durationMs = DURATIONS[durStr]
      if (!durationMs)
        return message.reply(
          `Durée invalide : \`${durStr}\`\n` +
          `Durées valides : ${Object.keys(DURATIONS).map(d => `\`${d}\``).join(' · ')}`
        )
    }

    db.set(`sanctions.${gid}.${action}`, sanction)
    db.set(`sanctions.${gid}.${action}_duration`, sanction === 'tempban' ? durationMs : null)

    const durLabel = sanction === 'tempban' ? ` (${durStr || '24h'})` : ''

    message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Sanction configurée')
        .setColor(0xFF0000)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Action',      value: `\`${action}\``,              inline: true },
          { name: 'Sanction',    value: `\`${sanction}\`${durLabel}`, inline: true },
          { name: 'Description', value: ACTIONS[action].desc,         inline: false },
        )
        .setFooter({ text: `${prefix}set-sanction ${action} seuil <n> pour configurer le seuil | Made by Wumpus` })
        .setTimestamp(),
    ] })
  },
}

function formatDur(ms) {
  if (ms >= 2592000000) return `${ms / 2592000000}j`
  if (ms >= 604800000)  return `${ms / 604800000}sem`
  if (ms >= 86400000)   return `${ms / 86400000}h×24`
  if (ms >= 3600000)    return `${ms / 3600000}h`
  return `${ms / 60000}m`
}
