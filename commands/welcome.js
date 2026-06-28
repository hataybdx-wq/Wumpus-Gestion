// ============================================================
//  Commande : welcome
//  Message automatique quand un membre arrive ou part.
//  Support complet des variables.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  SectionBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

// Variables disponibles : {user} {username} {server} {membercount} {mention}
function formatMessage(tmpl, member, guild) {
  return tmpl
    .replace(/\{user\}/g,        member.user.username)
    .replace(/\{username\}/g,    member.user.username)
    .replace(/\{mention\}/g,     `<@${member.id}>`)
    .replace(/\{tag\}/g,         member.user.tag)
    .replace(/\{id\}/g,          member.id)
    .replace(/\{server\}/g,      guild.name)
    .replace(/\{servername\}/g,  guild.name)
    .replace(/\{membercount\}/g, guild.memberCount)
    .replace(/\{count\}/g,       guild.memberCount)
}

module.exports = {
  name: 'welcome',
  description: 'Configure les messages d\'arrivée et de départ',
  aliases: ['goodbye', 'welcome-setup', 'setup-welcome'],
  formatMessage,  // exporté pour les events

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    const getCfg = () => db.get(`welcome_${gid}`) || {}
    const setCfg = (cfg) => db.set(`welcome_${gid}`, cfg)

    // ── info (défaut) — interface moderne ──────────────────
    if (!sub || sub === 'info' || sub === 'status') {
      const cfg = getCfg()

      const container = new ContainerBuilder().setAccentColor(COLOR)
      const icon = message.guild.iconURL({ size: 256 })

      container.addSectionComponents(sec => sec
        .addTextDisplayComponents(td => td.setContent(
          `## Welcome & Goodbye\n### Messages automatiques\n-# Configurez les messages à l'arrivée et au départ`
        ))
        .setThumbnailAccessory(thumb => thumb.setURL(icon || client.user.displayAvatarURL()))
        .setFooter({ text: 'Made by Wumpus' })
      )

      container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

      // Welcome
      const welcomeActive = cfg.welcome_channel && cfg.welcome_message
      container.addTextDisplayComponents(td => td.setContent(
        `### ${welcomeActive ? '🟢' : '⚫'} Message d'arrivée\n` +
        `**Salon :** ${cfg.welcome_channel ? `<#${cfg.welcome_channel}>` : '_non défini_'}\n` +
        `**Message :**\n${cfg.welcome_message ? `> ${cfg.welcome_message.replace(/\n/g, '\n> ')}` : '_non défini_'}\n` +
        `**DM à l'arrivée :** ${cfg.welcome_dm ? '🟢 Activé' : '⚫ Désactivé'}`
      ))

      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

      // Goodbye
      const goodbyeActive = cfg.goodbye_channel && cfg.goodbye_message
      container.addTextDisplayComponents(td => td.setContent(
        `### ${goodbyeActive ? '🟢' : '⚫'} Message de départ\n` +
        `**Salon :** ${cfg.goodbye_channel ? `<#${cfg.goodbye_channel}>` : '_non défini_'}\n` +
        `**Message :**\n${cfg.goodbye_message ? `> ${cfg.goodbye_message.replace(/\n/g, '\n> ')}` : '_non défini_'}`
      ))

      container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

      container.addTextDisplayComponents(td => td.setContent(
        `### Variables disponibles\n` +
        `\`{user}\` \`{username}\` · Pseudo du membre\n` +
        `\`{mention}\` · Mention (@membre)\n` +
        `\`{tag}\` · Tag complet (pseudo#0000)\n` +
        `\`{server}\` · Nom du serveur\n` +
        `\`{membercount}\` \`{count}\` · Nombre de membres\n` +
        `\`{id}\` · ID du membre`
      ))

      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

      container.addTextDisplayComponents(td => td.setContent(
        `### Commandes\n` +
        `\`${prefix}welcome channel #salon\` · Salon d'arrivée\n` +
        `\`${prefix}welcome message <texte>\` · Message d'arrivée\n` +
        `\`${prefix}welcome dm <texte>\` · Message DM à l'arrivée\n` +
        `\`${prefix}welcome dm-off\` · Désactiver les DM\n` +
        `\`${prefix}goodbye channel #salon\` · Salon de départ\n` +
        `\`${prefix}goodbye message <texte>\` · Message de départ\n` +
        `\`${prefix}welcome test\` · Tester les messages`
      ))

      // Actions rapides
      container.addActionRowComponents(row => row.setComponents(
        new ButtonBuilder().setCustomId(`wc_test_${message.author.id}`).setLabel('Tester').setStyle(ButtonStyle.Primary).setDisabled(!welcomeActive && !goodbyeActive),
        new ButtonBuilder().setCustomId(`wc_reset_${message.author.id}`).setLabel('Réinitialiser').setStyle(ButtonStyle.Danger),
      ))

      const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 })

      const col = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 300000 })
      col.on('collect', async i => {
        if (i.customId.startsWith('wc_test_')) {
          const c = getCfg()
          if (c.welcome_channel && c.welcome_message) {
            const ch = message.guild.channels.cache.get(c.welcome_channel)
            if (ch) ch.send(formatMessage(c.welcome_message, message.member, message.guild)).catch(() => false)
          }
          if (c.goodbye_channel && c.goodbye_message) {
            const ch = message.guild.channels.cache.get(c.goodbye_channel)
            if (ch) ch.send(formatMessage(c.goodbye_message, message.member, message.guild)).catch(() => false)
          }
          return i.reply({ content: 'Messages de test envoyés dans les salons configurés.', flags: 64 })
        }
        if (i.customId.startsWith('wc_reset_')) {
          db.delete(`welcome_${gid}`)
          return i.reply({ content: 'Configuration réinitialisée.', flags: 64 })
        }
      })
      return
    }

    // ── welcome channel / goodbye channel ─────────────────
    const isGoodbye = (args[0] && args[0].toLowerCase() === 'goodbye') || message.content.toLowerCase().startsWith(`${prefix}goodbye`)
    // Si la commande commence par "goodbye", on décale les args
    const realSub = message.content.toLowerCase().startsWith(`${prefix}goodbye`)
      ? args[0]?.toLowerCase()
      : args[1]?.toLowerCase()

    const key = isGoodbye ? 'goodbye' : 'welcome'

    // Support des sous-commandes simples (on reparse correctement)
    const actualSub = message.content.toLowerCase().startsWith(`${prefix}goodbye`) ? args[0]?.toLowerCase() : sub
    const actualArgs = message.content.toLowerCase().startsWith(`${prefix}goodbye`) ? args.slice(1) : args.slice(1)
    const prefix_key = message.content.toLowerCase().startsWith(`${prefix}goodbye`) ? 'goodbye' : 'welcome'

    // ── channel #salon ────────────────────────────────────
    if (actualSub === 'channel') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(actualArgs[0])
      if (!ch) return message.reply(`Usage : \`${prefix}${prefix_key} channel #salon\``)

      const cfg = getCfg()
      cfg[`${prefix_key}_channel`] = ch.id
      setCfg(cfg)
      return message.reply(`Salon ${prefix_key} défini sur <#${ch.id}>.`)
    }

    // ── message <texte> ───────────────────────────────────
    if (actualSub === 'message' || actualSub === 'msg') {
      const text = actualArgs.join(' ')
      if (!text) return message.reply(`Usage : \`${prefix}${prefix_key} message <texte>\`\nVariables : \`{user}\` \`{mention}\` \`{server}\` \`{count}\``)

      const cfg = getCfg()
      cfg[`${prefix_key}_message`] = text
      setCfg(cfg)

      const preview = formatMessage(text, message.member, message.guild)
      return message.reply({ embeds: [{
        title: `Message ${prefix_key} enregistré`,
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
        description: `**Aperçu :**\n${preview}`,
        color: COLOR,
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      }] })
    }

    // ── dm <texte> (welcome only) ─────────────────────────
    if (actualSub === 'dm' && prefix_key === 'welcome') {
      const text = actualArgs.join(' ')
      if (!text) return message.reply(`Usage : \`${prefix}welcome dm <texte>\`\nCe message sera envoyé en privé au membre qui arrive.`)

      const cfg = getCfg()
      cfg.welcome_dm = text
      setCfg(cfg)
      return message.reply('Message DM de bienvenue enregistré.')
    }

    if (actualSub === 'dm-off' && prefix_key === 'welcome') {
      const cfg = getCfg()
      delete cfg.welcome_dm
      setCfg(cfg)
      return message.reply('DM de bienvenue désactivé.')
    }

    // ── test ───────────────────────────────────────────────
    if (actualSub === 'test') {
      const cfg = getCfg()
      let sent = 0
      if (cfg.welcome_channel && cfg.welcome_message) {
        const ch = message.guild.channels.cache.get(cfg.welcome_channel)
        if (ch) {
          ch.send(formatMessage(cfg.welcome_message, message.member, message.guild)).catch(() => false)
          sent++
        }
      }
      if (cfg.goodbye_channel && cfg.goodbye_message) {
        const ch = message.guild.channels.cache.get(cfg.goodbye_channel)
        if (ch) {
          ch.send(formatMessage(cfg.goodbye_message, message.member, message.guild)).catch(() => false)
          sent++
        }
      }
      return message.reply(`${sent} message(s) de test envoyé(s).`)
    }

    // Aide
    message.reply(
      `**Configuration :**\n` +
      `\`${prefix}welcome channel #salon\` · Salon d'arrivée\n` +
      `\`${prefix}welcome message <texte>\` · Message d'arrivée\n` +
      `\`${prefix}welcome dm <texte>\` · DM à l'arrivée\n` +
      `\`${prefix}welcome dm-off\` · Désactiver DM\n` +
      `\`${prefix}goodbye channel #salon\` · Salon de départ\n` +
      `\`${prefix}goodbye message <texte>\` · Message de départ\n` +
      `\`${prefix}welcome info\` · Voir la config complète\n` +
      `\`${prefix}welcome test\` · Tester`
    )
  },
}
