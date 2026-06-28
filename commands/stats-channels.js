// ============================================================
//  Commande : stats-channels
//  Salons vocaux qui affichent automatiquement les statistiques.
//
//  Types de stats disponibles :
//    members  → Total de membres (humains + bots)
//    humans   → Membres humains uniquement
//    bots     → Bots uniquement
//    online   → Membres en ligne (hors offline)
//    boosters → Nombre de boosters
//    roles    → Nombre de rôles
//    channels → Nombre de salons
//
//  Sous-commandes :
//    !stats-channels setup              → créer automatiquement tout
//    !stats-channels add <type> <label> → ajouter un salon custom
//    !stats-channels list               → voir les salons
//    !stats-channels remove <id>        → supprimer
//    !stats-channels reset              → tout supprimer
//    !stats-channels refresh            → forcer la mise à jour
//
//  Les salons sont mis à jour automatiquement toutes les 10 min.
// ============================================================

const { PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js')
const db = require('quick.db')

const STATS_TYPES = {
  members:  { label: 'Total',       getValue: g => g.memberCount },
  humans:   { label: 'Humains',     getValue: g => g.members.cache.filter(m => !m.user.bot).size },
  bots:     { label: 'Bots',        getValue: g => g.members.cache.filter(m => m.user.bot).size },
  online:   { label: 'En ligne',    getValue: g => g.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size },
  boosters: { label: 'Boosters',    getValue: g => g.premiumSubscriptionCount ?? 0 },
  roles:    { label: 'Rôles',       getValue: g => g.roles.cache.size },
  channels: { label: 'Salons',      getValue: g => g.channels.cache.size },
}

function getConfig(gid) {
  return db.get(`statschan_${gid}`) || []
}
function setConfig(gid, list) {
  db.set(`statschan_${gid}`, list)
}

async function refreshChannel(guild, entry) {
  const typeInfo = STATS_TYPES[entry.type]
  if (!typeInfo) return

  const channel = guild.channels.cache.get(entry.channelId)
  if (!channel) return false

  const value = typeInfo.getValue(guild)
  const name  = entry.template.replace('{n}', value).replace('{value}', value)

  if (channel.name !== name) {
    await channel.setName(name, 'Stats update').catch(() => false)
  }
  return true
}

async function refreshAll(client) {
  for (const guild of client.guilds.cache.values()) {
    const list = getConfig(guild.id)
    for (const entry of list) {
      await refreshChannel(guild, entry).catch(() => false)
    }
  }
}

// Scheduler : toutes les 10 minutes
function startScheduler(client) {
  if (client._statsSchedulerStarted) return
  client._statsSchedulerStarted = true
  setInterval(() => refreshAll(client).catch(() => {}), 10 * 60 * 1000)
}

module.exports = {
  name: 'stats-channels',
  description: 'Salons vocaux qui affichent les statistiques du serveur',
  aliases: ['statschan', 'stats-chan', 'statsch'],
  startScheduler,
  refreshAll,

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    // S'assurer que le scheduler tourne
    startScheduler(client)

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── setup ────────────────────────────────────────────
    if (sub === 'setup') {
      const wait = await message.reply('Création des salons de stats...')
      try {
        // Catégorie
        const category = await message.guild.channels.create({
          name: '〔 STATS 〕',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.Connect] },
          ],
        })

        const defaults = [
          { type: 'members',  template: 'Membres · {n}' },
          { type: 'humans',   template: 'Humains · {n}' },
          { type: 'bots',     template: 'Bots · {n}' },
          { type: 'boosters', template: 'Boosters · {n}' },
        ]

        const list = getConfig(gid)

        for (const d of defaults) {
          const value = STATS_TYPES[d.type].getValue(message.guild)
          const name  = d.template.replace('{n}', value)
          const ch = await message.guild.channels.create({
            name,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
              { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.Connect] },
            ],
          })
          list.push({ channelId: ch.id, type: d.type, template: d.template })
        }

        setConfig(gid, list)

        return wait.edit({ content: null, embeds: [new EmbedBuilder()
          .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
          .setTitle('Stats channels configurés')
          .setColor(0x00FF88)
          .setDescription(
          .setFooter({ text: 'Made by Wumpus' })
            `Catégorie créée : <#${category.id}>\n\n` +
            defaults.map(d => `> \`${d.type}\` — ${d.template}`).join('\n') + '\n\n' +
            `Les salons se mettent à jour automatiquement toutes les 10 minutes.\n` +
            `Utilisez \`${prefix}stats-channels refresh\` pour forcer la mise à jour.`
          )] })
      } catch (err) {
        return wait.edit(`Erreur : ${err.message}`)
      }
    }

    // ── list ─────────────────────────────────────────────
    if (!sub || sub === 'list') {
      const list = getConfig(gid)
      if (list.length === 0) {
        return message.reply(
          `Aucun salon de stats configuré.\n` +
          `Lancez \`${prefix}stats-channels setup\` pour créer automatiquement 4 salons (membres, humains, bots, boosters).\n\n` +
          `Ou ajoutez manuellement : \`${prefix}stats-channels add <type> <template>\`\n` +
          `Types : ${Object.keys(STATS_TYPES).map(t => `\`${t}\``).join(' · ')}`
        )
      }

      const lines = list.map(e => `> <#${e.channelId}> · \`${e.type}\` · template: \`${e.template}\``)

      return message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Stats Channels')
        .setColor(0xFF0000)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `${list.length} salon(s) · Mis à jour toutes les 10 min` })] })
    }

    // ── add <type> <template> ────────────────────────────
    if (sub === 'add') {
      const type     = args[1]?.toLowerCase()
      const template = args.slice(2).join(' ') || `${STATS_TYPES[type]?.label} · {n}`

      if (!STATS_TYPES[type]) {
        return message.reply(
          `Type inconnu : \`${type}\`\n` +
          `Types disponibles : ${Object.keys(STATS_TYPES).map(t => `\`${t}\``).join(' · ')}\n\n` +
          `Usage : \`${prefix}stats-channels add <type> <template>\`\n` +
          `Exemple : \`${prefix}stats-channels add members 🧑 Membres : {n}\``
        )
      }

      const value = STATS_TYPES[type].getValue(message.guild)
      const name  = template.replace('{n}', value)

      const ch = await message.guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.Connect] },
        ],
      }).catch(() => null)

      if (!ch) return message.reply('Impossible de créer le salon.')

      const list = getConfig(gid)
      list.push({ channelId: ch.id, type, template })
      setConfig(gid, list)

      return message.reply(`Salon <#${ch.id}> ajouté (\`${type}\`).`)
    }

    // ── remove <channelId> ───────────────────────────────
    if (sub === 'remove' || sub === 'rm') {
      const chId = args[1]?.replace(/[<#>]/g, '') || message.mentions.channels.first()?.id
      if (!chId) return message.reply(`Usage : \`${prefix}stats-channels remove <id_salon>\``)

      const list     = getConfig(gid)
      const filtered = list.filter(e => e.channelId !== chId)
      if (filtered.length === list.length) return message.reply('Salon introuvable dans la config.')

      setConfig(gid, filtered)

      // Optionnellement supprimer le vrai salon
      const ch = message.guild.channels.cache.get(chId)
      if (ch) ch.delete('Stats channel retiré').catch(() => false)

      return message.reply(`Salon de stats supprimé.`)
    }

    // ── refresh ──────────────────────────────────────────
    if (sub === 'refresh' || sub === 'update') {
      const list = getConfig(gid)
      if (list.length === 0) return message.reply('Aucun salon de stats configuré.')

      let ok = 0
      for (const entry of list) {
        if (await refreshChannel(message.guild, entry)) ok++
      }
      return message.reply(`Mise à jour effectuée sur **${ok}/${list.length}** salons.`)
    }

    // ── reset ────────────────────────────────────────────
    if (sub === 'reset' || sub === 'clear') {
      const list = getConfig(gid)
      for (const entry of list) {
        const ch = message.guild.channels.cache.get(entry.channelId)
        if (ch) ch.delete('Stats channels reset').catch(() => false)
      }
      setConfig(gid, [])
      return message.reply('Tous les salons de stats supprimés.')
    }

    // Aide
    message.reply(
      `**${prefix}stats-channels setup** · Création automatique (membres, humains, bots, boosters)\n` +
      `**${prefix}stats-channels add <type> <template>** · Ajouter un salon custom\n` +
      `**${prefix}stats-channels list** · Voir les salons\n` +
      `**${prefix}stats-channels remove <id>** · Supprimer un salon\n` +
      `**${prefix}stats-channels refresh** · Forcer la mise à jour\n` +
      `**${prefix}stats-channels reset** · Tout supprimer\n\n` +
      `**Types :** ${Object.keys(STATS_TYPES).map(t => `\`${t}\``).join(' · ')}`
    )
  },
}
