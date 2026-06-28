// ============================================================
//  Commande : secur-max
//  Active 5 protections ciblées en mode maximum.
//
//  Protections actives :
//    - Anti-Bot          (bloque l'ajout de bots)
//    - Anti-Guild-Update (protège nom/icône/bannière)
//    - Anti-Lien         (supprime les liens/invites)
//    - Anti-Ban          (annule les bans non autorisés)
//    - Anti-Masse-Mention (@everyone/@here non autorisés)
//
//  Sanction par défaut : strip_roles (retire tous les rôles)
//  Seuls exempts : propriétaire + bot owner.
//
//  Usage :
//    !secur-max                 → activer
//    !secur-max off             → désactiver
//    !secur-max status          → état
//    !secur-max sanction <type> → changer la sanction
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  MessageFlags, PermissionFlagsBits,
} = require('discord.js')
const db = require('quick.db')

const PROTECTIONS = [
  { key: 'bots',            label: 'Anti-Bot',          emoji: '🤖', desc: 'Bloque l\'ajout de bots non autorisés' },
  { key: 'antiguildupdate', label: 'Anti-Guild-Update',  emoji: '🏠', desc: 'Protège le nom, l\'icône et la bannière' },
  { key: 'link',            label: 'Anti-Lien',          emoji: '🔗', desc: 'Supprime les liens et invitations Discord' },
  { key: 'bans',            label: 'Anti-Ban',           emoji: '🔨', desc: 'Annule les bans non autorisés' },
  { key: 'massping',        label: 'Anti-Masse-Mention', emoji: '📢', desc: 'Bloque les @everyone/@here non autorisés' },
]

const SANCTION_LABELS = {
  strip_roles: '🎭 Retire tous les rôles (défaut SecurMax)',
  warn:        '⚠️ Avertissement (DM)',
  mute:        '🔇 Mute (timeout 1h)',
  kick:        '👢 Expulsion',
  ban:         '🔨 Bannissement',
  tempban:     '⏳ Bannissement temporaire',
}

// Toutes les clés possibles (pour le off — on désactive tout)
const ALL_KEYS = [
  'bots','antiguildupdate','link','bans','massping',
  'kick','massbans','masskick','spam','channels','secur',
]

module.exports = {
  name: 'secur-max',
  description: 'Active les 5 protections essentielles (bots, serveur, liens, bans, everyone)',
  aliases: ['securmax'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── Changer la sanction ─────────────────────────────────
    if (sub === 'sanction') {
      const type  = (args[1] || '').toLowerCase()
      const valid = Object.keys(SANCTION_LABELS)
      if (!valid.includes(type))
        return message.reply(`❌ Sanction invalide. Valeurs possibles : \`${valid.join('` `')}\``)

      db.set(`sanctions.${gid}.default`, type)
      const c = new ContainerBuilder().setAccentColor(0xFF8800)
      c.addTextDisplayComponents(td => td.setContent(
        `## ⚙️ Sanction SecurMax modifiée\n${SANCTION_LABELS[type]}\n\n` +
        `-# S'applique à toutes les protections actives`
      ))
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
    }

    // ── Status ──────────────────────────────────────────────
    if (sub === 'status' || sub === 'info') {
      const active   = db.get(`secur_${gid}`) === true
      const sanction = db.get(`sanctions.${gid}.default`) || 'strip_roles'
      const lines    = PROTECTIONS.map(p => {
        const on = db.get(`${p.key}_${gid}`) === true
        return `${on ? '🟢' : '🔴'} ${p.emoji} **${p.label}** — ${p.desc}`
      })

      const c = new ContainerBuilder().setAccentColor(active ? 0xFF0000 : 0xFF8800)
      c.addTextDisplayComponents(td => td.setContent(
        `## ${active ? '🔴 SecurMax ACTIF' : '🟠 SecurMax inactif'}\n-# ${message.guild.name}`
      ))
      c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      c.addTextDisplayComponents(td => td.setContent(lines.join('\n')))
      c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      c.addTextDisplayComponents(td => td.setContent(
        `**Sanction :** ${SANCTION_LABELS[sanction] || sanction}\n` +
        `**Exempts :** Propriétaire du serveur + Bot owner uniquement\n\n` +
        `-# \`${prefix}secur-max sanction <type>\` pour changer`
      ))
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
    }

    // ── Off ─────────────────────────────────────────────────
    if (sub === 'off') {
      for (const key of ALL_KEYS) db.set(`${key}_${gid}`, false)
      db.set(`secur_${gid}`, false)

      const c = new ContainerBuilder().setAccentColor(0xFF8800)
      c.addTextDisplayComponents(td => td.setContent(
        `## 🟠 SecurMax désactivé\n` +
        `Toutes les protections ont été coupées.\n` +
        `Les admins Discord sont à nouveau exempts.\n\n` +
        `-# Désactivé par ${message.author.username}`
      ))
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
    }

    // ── On ──────────────────────────────────────────────────
    for (const p of PROTECTIONS) db.set(`${p.key}_${gid}`, true)
    db.set(`secur_${gid}`, true)

    // Sanction par défaut → strip_roles
    const currentSanction = db.get(`sanctions.${gid}.default`)
    if (!currentSanction || currentSanction === 'kick') {
      db.set(`sanctions.${gid}.default`, 'strip_roles')
    }
    const sanction = db.get(`sanctions.${gid}.default`) || 'strip_roles'

    const lines = PROTECTIONS.map(p => `🟢 ${p.emoji} **${p.label}** — ${p.desc}`).join('\n')

    const c = new ContainerBuilder().setAccentColor(0xFF0000)
    c.addTextDisplayComponents(td => td.setContent(
      `## 🔴 SecurMax activé\n-# ${message.guild.name}`
    ))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(lines))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(
      `**Sanction :** ${SANCTION_LABELS[sanction] || sanction}\n` +
      `**Exempts :** Propriétaire + Bot owner uniquement\n` +
      `> Admins et membres seront sanctionnés en cas d'action non autorisée.\n\n` +
      `-# \`${prefix}secur-max sanction <type>\` — changer la sanction\n` +
      `-# \`${prefix}secur-max off\` — désactiver · \`${prefix}secur-max status\` — état`
    ))

    message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
  },
}
