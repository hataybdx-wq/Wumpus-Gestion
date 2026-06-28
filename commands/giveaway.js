// ============================================================
//  Commande : giveaway — Giveaway personnalisable
//
//  Options :
//    - durée (ex: 1h, 30m, 1d)
//    - prix (texte libre)
//    - nombre de gagnants
//    - rôle requis (optionnel)
//    - nombre d'invitations requis (optionnel)
//
//  Sous-commandes :
//    !giveaway start              → lance l'interface de création
//    !giveaway create <durée> <gagnants> <prix>   → création rapide
//    !giveaway end <id>           → terminer manuellement
//    !giveaway reroll <id>        → tirer un nouveau gagnant
//    !giveaway list               → liste des giveaways actifs
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js')
const jsondb = require('../utils/jsondb')
const { getTotal } = require('../utils/invites')

const gdb = jsondb('giveaways')

// ── Parse durée (1h, 30m, 2d) ─────────────────────────────────
function parseDuration(str) {
  const m = /^(\d+)\s*(s|m|h|d|w)$/i.exec(str)
  if (!m) return null
  const n = parseInt(m[1])
  const unit = m[2].toLowerCase()
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 }
  return n * (multipliers[unit] || 0)
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []
  if (d) parts.push(`${d}j`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (!d && !h && sec) parts.push(`${sec}s`)
  return parts.join(' ') || '0s'
}

function randomPick(arr, n) {
  const copy = [...arr]
  const out  = []
  while (copy.length > 0 && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

// ── Embed du giveaway ─────────────────────────────────────────
function buildEmbed(g, participants) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
    .setTitle(`GIVEAWAY — ${g.prize}`)
    .setColor(0xFF0000)
    .setDescription(
    .setFooter({ text: 'Made by Wumpus' })
      `**Fin :** <t:${Math.floor(g.endsAt / 1000)}:R>\n` +
      `**Gagnants :** ${g.winners}\n` +
      `**Organisé par :** <@${g.hostId}>` +
      (g.requiredRoleId || g.requiredInvites
        ? '\n\n**Prérequis :**\n' +
          (g.requiredRoleId  ? `> Rôle requis : <@&${g.requiredRoleId}>\n` : '') +
          (g.requiredInvites ? `> Invitations requises : **${g.requiredInvites}**` : '')
        : '') +
      `\n\n**Participants :** ${participants.length}`
    )
    .setFooter({ text: `ID : ${g.id} | Made by Wumpus` })
    .setTimestamp(g.endsAt)

  return embed
}

function buildRow(g, ended) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`gw_join_${g.id}`)
      .setLabel('Participer')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(ended),
  )
}

// ── Scheduler : vérifier les giveaways expirés ────────────────
function scheduleCheck(client) {
  setInterval(() => {
    const all = gdb.all()
    const now = Date.now()
    for (const [id, g] of Object.entries(all)) {
      if (g.ended) continue
      if (g.endsAt <= now) endGiveaway(client, id).catch(() => {})
    }
  }, 15000)
}

async function endGiveaway(client, id) {
  const g = gdb.get(id)
  if (!g || g.ended) return

  g.ended = true
  gdb.set(id, g)

  const guild = client.guilds.cache.get(g.guildId)
  if (!guild) return
  const channel = guild.channels.cache.get(g.channelId)
  if (!channel) return
  const msg = await channel.messages.fetch(g.messageId).catch(() => null)
  if (!msg) return

  const participants = g.participants || []
  const winners      = randomPick(participants, g.winners)

  // Mettre à jour l'embed
  const winnersText = winners.length > 0
    ? winners.map(w => `<@${w}>`).join(', ')
    : 'Aucun participant'

  const endEmbed = new EmbedBuilder()
    .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
    .setTitle(`GIVEAWAY TERMINÉ — ${g.prize}`)
    .setColor(0x00FF88)
    .setDescription(
    .setFooter({ text: 'Made by Wumpus' })
      `**Gagnant${winners.length > 1 ? 's' : ''} :** ${winnersText}\n` +
      `**Organisé par :** <@${g.hostId}>\n` +
      `**Participants :** ${participants.length}`
    )
    .setFooter({ text: `ID : ${g.id} | Made by Wumpus` })
    .setTimestamp()

  msg.edit({ embeds: [endEmbed], components: [buildRow(g, true)] }).catch(() => false)

  if (winners.length > 0) {
    channel.send({
      content: `Félicitations ${winners.map(w => `<@${w}>`).join(', ')} ! Vous avez gagné **${g.prize}** !`,
    }).catch(() => false)
  } else {
    channel.send(`Giveaway terminé — aucun participant pour **${g.prize}**.`).catch(() => false)
  }
}

module.exports = {
  name: 'giveaway',
  description: 'Lancer un giveaway personnalisable',
  aliases: ['gw', 'tirage'],

  // Exporter pour interaction handler
  endGiveaway,
  buildEmbed,
  buildRow,

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const sub = (args[0] || '').toLowerCase()

    // ── help ────────────────────────────────────────────
    if (!sub || sub === 'help') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Aide — giveaway')
        .setColor(0xFF0000)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          '```\n' +
          `${prefix}giveaway create <durée> <gagnants> <prix>\n` +
          `${prefix}giveaway end <id>\n` +
          `${prefix}giveaway reroll <id>\n` +
          `${prefix}giveaway list\n` +
          '```\n' +
          '**Options avancées (flags après le prix) :**\n' +
          '• `--role @rôle` · rôle requis pour participer\n' +
          '• `--invites N` · invitations requises\n\n' +
          '**Exemple :** `!giveaway create 1h 2 Nitro Classic --role @Membre --invites 3`\n' +
          '**Durées :** `30s` `5m` `2h` `1d` `1w`'
        )
      return message.reply({ embeds: [embed] })
    }

    // ── list ────────────────────────────────────────────
    if (sub === 'list') {
      const all = Object.values(gdb.all()).filter(g => g.guildId === message.guild.id && !g.ended)
      if (all.length === 0) return message.reply('Aucun giveaway actif.')

      const lines = all.map(g =>
        `**${g.prize}** · <#${g.channelId}> · fin <t:${Math.floor(g.endsAt / 1000)}:R> · \`${g.id}\``
      )
      return message.reply({ embeds: [
        new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setTitle('Giveaways actifs').setColor(0xFF0000).setDescription(lines.join('\n')),
      ] })
    }

    // ── end ─────────────────────────────────────────────
    if (sub === 'end') {
      const id = args[1]
      if (!id) return message.reply(`Usage : \`${prefix}giveaway end <id>\``)
      const g = gdb.get(id)
      if (!g) return message.reply('Giveaway introuvable.')
      if (g.ended) return message.reply('Ce giveaway est déjà terminé.')
      await endGiveaway(client, id)
      return message.reply(`Giveaway \`${id}\` terminé.`)
    }

    // ── reroll ──────────────────────────────────────────
    if (sub === 'reroll') {
      const id = args[1]
      if (!id) return message.reply(`Usage : \`${prefix}giveaway reroll <id>\``)
      const g = gdb.get(id)
      if (!g) return message.reply('Giveaway introuvable.')
      if (!g.ended) return message.reply('Ce giveaway n\'est pas encore terminé.')

      const participants = g.participants || []
      if (participants.length === 0) return message.reply('Aucun participant pour ce giveaway.')

      const winner = randomPick(participants, 1)[0]
      return message.channel.send(`Nouveau gagnant pour **${g.prize}** : <@${winner}> !`)
    }

    // ── create ──────────────────────────────────────────
    if (sub === 'create' || sub === 'start' || sub === 'new') {
      const rest = args.slice(1).join(' ')

      // Extraire les flags
      let requiredRoleId = null
      let requiredInvites = 0

      const roleMatch = /--role\s+(?:<@&)?(\d+)>?/.exec(rest)
      if (roleMatch) requiredRoleId = roleMatch[1]

      const invMatch = /--invites\s+(\d+)/.exec(rest)
      if (invMatch) requiredInvites = parseInt(invMatch[1])

      const cleaned = rest.replace(/--role\s+\S+/g, '').replace(/--invites\s+\d+/g, '').trim()
      const parts = cleaned.split(/\s+/)

      if (parts.length < 3) {
        return message.reply(`Usage : \`${prefix}giveaway create <durée> <gagnants> <prix>\``)
      }

      const durMs = parseDuration(parts[0])
      if (!durMs) return message.reply('Durée invalide. Exemple : `1h`, `30m`, `2d`.')

      const winnersCount = parseInt(parts[1])
      if (isNaN(winnersCount) || winnersCount <= 0) return message.reply('Nombre de gagnants invalide.')

      const prize = parts.slice(2).join(' ')
      if (!prize) return message.reply('Veuillez préciser un prix.')

      // Créer le giveaway
      const id = `gw${Date.now().toString(36)}${Math.floor(Math.random() * 1000).toString(36)}`
      const g = {
        id,
        guildId:        message.guild.id,
        channelId:      message.channel.id,
        messageId:      null,
        hostId:         message.author.id,
        prize,
        winners:        winnersCount,
        endsAt:         Date.now() + durMs,
        createdAt:      Date.now(),
        participants:   [],
        requiredRoleId,
        requiredInvites,
        ended:          false,
      }

      const embed = buildEmbed(g, [])
      const sent  = await message.channel.send({ embeds: [embed], components: [buildRow(g, false)] })
      g.messageId = sent.id
      gdb.set(id, g)

      message.delete().catch(() => false)
    }
  },
}
