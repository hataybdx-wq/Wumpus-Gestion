// ============================================================
//  Commande : setup-logs
//  Crée ou configure les salons de logs — Electron Gestion
//
//  Usage :
//    !setup-logs              → crée les 8 salons automatiquement
//    !setup-logs #salon       → un seul salon global pour tout
// ============================================================

const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const db = require('quick.db')

const LOG_TYPES = {
  mod:      { name: '🔨・logs-moderation',  topic: 'Bans, kicks, mutes, clears, tempbans' },
  secur:    { name: '🛡️・logs-securite',    topic: 'Anti-raid, anti-spam, protections actives' },
  members:  { name: '👥・logs-membres',     topic: 'Arrivées, départs, changements de surnom' },
  messages: { name: '💬・logs-messages',    topic: 'Messages supprimés et modifiés' },
  voice:    { name: '🎙️・logs-vocal',       topic: 'Connexions et déconnexions vocales' },
  invites:  { name: '🔗・logs-invitations', topic: 'Créations d\'invitations' },
  roles:    { name: '🎭・logs-roles',       topic: 'Rôles créés, supprimés, modifiés' },
  channels: { name: '📁・logs-salons',      topic: 'Salons créés, supprimés, modifiés' },
}

module.exports = {
  name: 'setup-logs',
  description: 'Crée ou configure les salons de logs automatiquement',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    // !setup-logs #salon → salon global unique
    if (args[0]?.startsWith('<#') || message.mentions.channels.first()) {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])
      if (!channel) return message.reply(`Usage : \`${prefix}setup-logs\` ou \`${prefix}setup-logs #salon\``)
      db.set(`logs_${message.guild.id}`, channel.id)
      return message.reply(
        `Salon de logs global défini sur <#${channel.id}>.\n` +
        `Tous les types de logs non configurés individuellement iront dans ce salon.`
      )
    }

    // !setup-logs → création automatique avec emojis
    const wait = await message.reply('Création des salons de logs en cours...')

    try {
      const category = await message.guild.channels.create({
        name:   '〔 LOGS 〕',
        type:   ChannelType.GuildCategory,
        reason: `Setup logs — ${message.author.username}`,
        permissionOverwrites: [
          { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: message.guild.members.me,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      })

      const created = {}
      for (const [key, def] of Object.entries(LOG_TYPES)) {
        const ch = await message.guild.channels.create({
          name:   def.name,
          type:   ChannelType.GuildText,
          topic:  def.topic,
          parent: category.id,
          reason: `Setup logs — ${key}`,
          permissionOverwrites: [
            { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: message.guild.members.me,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ],
        })
        db.set(`logs_${key}_${message.guild.id}`, ch.id)
        created[key] = ch.id
      }

      // Salon global = mod par défaut
      db.set(`logs_${message.guild.id}`, created.mod)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Salons de logs créés')
        .setColor(0xFF0000)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          Object.entries(LOG_TYPES).map(([key]) =>
            `\`${key.padEnd(8)}\` → <#${created[key]}>`
          ).join('\n') +
          '\n\nCes salons sont invisibles pour les membres.'
        )
        .addFields({
        .setFooter({ text: 'Made by Wumpus' })
          name: 'Configuration individuelle',
          value: `Utilisez \`${prefix}setup-log <type> #salon\` pour rediriger un type vers un salon existant.`,
        })
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      wait.edit({ content: null, embeds: [embed] }).catch(() => false)
    } catch (err) {
      wait.edit(`Erreur lors de la création : ${err.message}`).catch(() => false)
    }
  },
}
