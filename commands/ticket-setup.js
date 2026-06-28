// ============================================================
//  Commande : ticket-setup
//  Panel interactif tout-en-un pour configurer les tickets.
//  Setup automatique en 1 clic ou configuration manuelle.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

module.exports = {
  name: 'ticket-setup',
  description: 'Configure le système de tickets (panel interactif complet)',
  aliases: ['setup-ticket', 'tickets-setup', 'ticket-config'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid    = message.guild.id
    const userId = message.author.id

    const msg = await message.reply({
      components: [buildPanel(message.guild, gid, userId)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)
    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 900_000, // 15 min
    })

    col.on('collect', async i => {

      // ── Setup automatique ────────────────────────────────
      if (i.isButton() && i.customId === `ts_auto_${userId}`) {
        await i.deferUpdate()
        try {
          const guild = message.guild

          let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && /ticket/i.test(c.name))
          if (!category) category = await guild.channels.create({
            name: '🎫 Tickets', type: ChannelType.GuildCategory,
            permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }],
          })

          let staffRole = guild.roles.cache.find(r => /support|staff/i.test(r.name) && !r.managed)
          if (!staffRole) staffRole = await guild.roles.create({ name: 'Support', color: 0x5865F2, reason: 'Setup tickets' })

          let panelChannel = guild.channels.cache.find(c => /crée?-?(un-)?ticket|ticket-panel/i.test(c.name))
          if (!panelChannel) panelChannel = await guild.channels.create({
            name: 'créer-un-ticket', type: ChannelType.GuildText, parent: category.id,
            permissionOverwrites: [
              { id: guild.id,       allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
              { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel] },
            ],
          })

          let logsChannel = guild.channels.cache.find(c => /ticket.*log|log.*ticket/i.test(c.name))
          if (!logsChannel) logsChannel = await guild.channels.create({
            name: 'ticket-logs', type: ChannelType.GuildText, parent: category.id,
            permissionOverwrites: [
              { id: guild.id,       deny:  [PermissionFlagsBits.ViewChannel] },
              { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] },
              { id: staffRole.id,   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
            ],
          })

          const cfg = {
            enabled: true,
            categoryId: category.id,
            staffRoleId: staffRole.id,
            panelChannelId: panelChannel.id,
            logsChannelId: logsChannel.id,
            maxOpen: 1,
            openMessage: 'Bienvenue {user} ! Décrivez votre demande, notre équipe vous répond dès que possible.',
            transcript: true,
            mention: true,
            types: [],
          }
          db.set(`tickets_${gid}`, cfg)
          await sendPanelMessage(panelChannel, guild, cfg)

          await i.editReply({
            content: `✅ **Setup terminé !** · Catégorie ${category} · Staff ${staffRole} · Panel ${panelChannel} · Logs ${logsChannel}`,
            components: [buildPanel(guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => {})
        } catch (err) {
          await i.followUp({ content: `❌ Erreur setup : ${err.message}`, flags: 64 })
        }
        return
      }

      // ── Envoyer le message panel ─────────────────────────
      if (i.isButton() && i.customId === `ts_send_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        if (!cfg.panelChannelId) { await i.reply({ content: '❌ Aucun salon panel configuré.', flags: 64 }); return }
        const ch = message.guild.channels.cache.get(cfg.panelChannelId)
        if (!ch) { await i.reply({ content: '❌ Salon introuvable.', flags: 64 }); return }
        await sendPanelMessage(ch, message.guild, cfg)
        await i.reply({ content: `✅ Message envoyé dans ${ch}`, flags: 64 })
        return
      }

      // ── Toggle ON/OFF ────────────────────────────────────
      if (i.isButton() && i.customId === `ts_toggle_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.enabled = !cfg.enabled
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }

      // ── Toggle mention staff ─────────────────────────────
      if (i.isButton() && i.customId === `ts_mention_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.mention = !cfg.mention
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }

      // ── Toggle transcript ────────────────────────────────
      if (i.isButton() && i.customId === `ts_transcript_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.transcript = cfg.transcript === false ? true : false
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }

      // ── Max tickets (modal) ──────────────────────────────
      if (i.isButton() && i.customId === `ts_maxopen_${userId}`) {
        const modal = new ModalBuilder()
          .setCustomId(`ts_modal_maxopen_${userId}`)
          .setTitle('Max tickets par membre')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('val').setLabel('Nombre max (0 = illimité)').setStyle(TextInputStyle.Short).setPlaceholder('1').setMaxLength(2)
          ))
        await i.showModal(modal)
        return
      }

      // ── Message d'accueil (modal) ────────────────────────
      if (i.isButton() && i.customId === `ts_welcome_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        const modal = new ModalBuilder()
          .setCustomId(`ts_modal_welcome_${userId}`)
          .setTitle('Message d\'accueil du ticket')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('val')
              .setLabel('Message ({user} {type} {server} disponibles)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(cfg.openMessage || 'Bienvenue {user} !')
              .setMaxLength(500)
          ))
        await i.showModal(modal)
        return
      }

      // ── Selects ──────────────────────────────────────────
      if (i.isStringSelectMenu() && i.customId === `ts_cat_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.categoryId = i.values[0]
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }
      if (i.isStringSelectMenu() && i.customId === `ts_staff_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.staffRoleId = i.values[0]
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }
      if (i.isStringSelectMenu() && i.customId === `ts_panelch_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.panelChannelId = i.values[0]
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }
      if (i.isStringSelectMenu() && i.customId === `ts_logsch_${userId}`) {
        const cfg = db.get(`tickets_${gid}`) || {}
        cfg.logsChannelId = i.values[0]
        db.set(`tickets_${gid}`, cfg)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }

      // ── Reset ────────────────────────────────────────────
      if (i.isButton() && i.customId === `ts_reset_${userId}`) {
        db.delete(`tickets_${gid}`)
        await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
        return
      }

      // ── Modaux ───────────────────────────────────────────
      if (i.isModalSubmit()) {
        const cfg = db.get(`tickets_${gid}`) || {}

        if (i.customId === `ts_modal_maxopen_${userId}`) {
          cfg.maxOpen = Math.max(0, parseInt(i.fields.getTextInputValue('val')) || 0)
          db.set(`tickets_${gid}`, cfg)
          await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }
        if (i.customId === `ts_modal_welcome_${userId}`) {
          cfg.openMessage = i.fields.getTextInputValue('val').trim() || 'Bienvenue {user} !'
          db.set(`tickets_${gid}`, cfg)
          await i.update({ components: [buildPanel(message.guild, gid, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }
      }
    })

    col.on('end', () => {
      const end = new ContainerBuilder().setAccentColor(COLOR)
      end.addTextDisplayComponents(td => td.setContent(
        `## Configuration Tickets\n-# Session expirée · \`${prefix}ticket-setup\` pour rouvrir`
      ))
      msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
    })
  },
}

// ─────────────────────────────────────────────────────────────
//  Builder du panel de configuration
// ─────────────────────────────────────────────────────────────
function buildPanel(guild, gid, userId) {
  const cfg = db.get(`tickets_${gid}`) || {}
  const c   = new ContainerBuilder().setAccentColor(COLOR)

  c.addTextDisplayComponents(td => td.setContent(
    `## 🎫 Configuration Tickets\n` +
    `### ${cfg.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
    `-# Toutes les options ici — plus besoin d'autres commandes`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  if (!cfg.categoryId || !cfg.staffRoleId || !cfg.panelChannelId) {
    c.addTextDisplayComponents(td => td.setContent(
      `### ⚡ Setup Automatique\n-# Crée en 1 clic : catégorie · rôle Staff · salons panel et logs`
    ))
    c.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`ts_auto_${userId}`).setLabel('Setup Automatique').setEmoji('⚡').setStyle(ButtonStyle.Success)
    ))
    c.addSeparatorComponents(s => s.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(`-# Ou configurez manuellement ci-dessous :`))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  }

  c.addTextDisplayComponents(td => td.setContent(
    `### Salons & Rôles\n` +
    `📁 **Catégorie :** ${cfg.categoryId ? `<#${cfg.categoryId}>` : '`Non configurée`'}\n` +
    `👮 **Staff :** ${cfg.staffRoleId ? `<@&${cfg.staffRoleId}>` : '`Non configuré`'}\n` +
    `📺 **Panel :** ${cfg.panelChannelId ? `<#${cfg.panelChannelId}>` : '`Non configuré`'}\n` +
    `📋 **Logs :** ${cfg.logsChannelId ? `<#${cfg.logsChannelId}>` : '`Non configuré`'}`
  ))

  const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory)
  if (categories.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder().setCustomId(`ts_cat_${userId}`).setPlaceholder('📁 Catégorie des tickets')
        .addOptions(categories.map(ch => new StringSelectMenuOptionBuilder()
          .setLabel(ch.name).setValue(ch.id).setDefault(ch.id === cfg.categoryId)
        ).slice(0, 25))
    ))
  }

  const roles = guild.roles.cache.filter(r => !r.managed && r.id !== guild.id)
  if (roles.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder().setCustomId(`ts_staff_${userId}`).setPlaceholder('👮 Rôle staff')
        .addOptions(roles.map(r => new StringSelectMenuOptionBuilder()
          .setLabel(r.name).setValue(r.id).setDefault(r.id === cfg.staffRoleId)
        ).slice(0, 25))
    ))
  }

  const textCh = guild.channels.cache.filter(c => c.type === ChannelType.GuildText)
  if (textCh.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder().setCustomId(`ts_panelch_${userId}`).setPlaceholder('📺 Salon pour le message panel')
        .addOptions(textCh.map(ch => new StringSelectMenuOptionBuilder()
          .setLabel(`#${ch.name}`).setValue(ch.id).setDefault(ch.id === cfg.panelChannelId)
        ).slice(0, 25))
    ))
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder().setCustomId(`ts_logsch_${userId}`).setPlaceholder('📋 Salon de logs')
        .addOptions(textCh.map(ch => new StringSelectMenuOptionBuilder()
          .setLabel(`#${ch.name}`).setValue(ch.id).setDefault(ch.id === cfg.logsChannelId)
        ).slice(0, 25))
    ))
  }

  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  c.addTextDisplayComponents(td => td.setContent(
    `### Options\n` +
    `🎭 **Mention staff à l'ouverture :** ${cfg.mention !== false ? '✅' : '❌'}\n` +
    `📄 **Transcript HTML :** ${cfg.transcript !== false ? '✅' : '❌'}\n` +
    `🔢 **Max tickets par membre :** ${cfg.maxOpen || '1'}\n` +
    `💬 **Message d'accueil :** ${cfg.openMessage ? '`Configuré`' : '`Défaut`'}`
  ))
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`ts_mention_${userId}`).setLabel('Mention staff').setEmoji('🎭')
      .setStyle(cfg.mention !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ts_transcript_${userId}`).setLabel('Transcript').setEmoji('📄')
      .setStyle(cfg.transcript !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ts_maxopen_${userId}`).setLabel('Max tickets').setEmoji('🔢').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ts_welcome_${userId}`).setLabel('Message accueil').setEmoji('💬').setStyle(ButtonStyle.Secondary),
  ))

  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`ts_toggle_${userId}`)
      .setLabel(cfg.enabled ? 'Désactiver' : 'Activer').setStyle(cfg.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ts_send_${userId}`)
      .setLabel('Envoyer le panel').setEmoji('📤').setStyle(ButtonStyle.Primary).setDisabled(!cfg.panelChannelId),
    new ButtonBuilder().setCustomId(`ts_reset_${userId}`)
      .setLabel('Réinitialiser').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  ))

  c.addSeparatorComponents(s => s.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(`-# Configuration sauvegardée automatiquement`))

  return c
}

// ─────────────────────────────────────────────────────────────
//  Envoyer le message panel dans un salon
// ─────────────────────────────────────────────────────────────
async function sendPanelMessage(channel, guild, cfg) {
  const types = cfg.types || []
  const c = new ContainerBuilder().setAccentColor(COLOR)

  c.addTextDisplayComponents(td => td.setContent(`## 🎫 Créer un Ticket\n-# ${guild.name}`))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(
    'Besoin d\'aide ou une question ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\n' +
    'Notre équipe vous répondra dès que possible.'
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  if (types.length === 0) {
    c.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId('ticket_open_default').setLabel('Ouvrir un ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary)
    ))
  } else if (types.length <= 4) {
    c.addActionRowComponents(row => row.setComponents(
      ...types.map(t => new ButtonBuilder().setCustomId(`ticket_open_${t.id}`).setLabel(t.label).setEmoji(t.emoji || '🎫').setStyle(ButtonStyle.Primary))
    ))
  } else {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder().setCustomId('ticket_open_select').setPlaceholder('Choisissez le type de ticket')
        .addOptions(types.map(t => new StringSelectMenuOptionBuilder()
          .setLabel(t.label).setValue(t.id).setDescription(t.description || `Ticket ${t.label}`).setEmoji(t.emoji || '🎫')
        ).slice(0, 25))
    ))
  }

  await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 })
}
