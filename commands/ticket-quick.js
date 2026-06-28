// ============================================================
//  Commande : ticket-quick (ou ticket-setup quick)
//  Crée automatiquement TOUTE la structure des tickets :
//    - une catégorie "Tickets"
//    - un salon "ticket-panel" avec le panneau déjà envoyé
//    - un salon "ticket-logs" privé pour les logs
//    - enregistre toute la config
//
//  Usage : !ticket-quick [@rôle_staff]
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  EmbedBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ticket-quick',
  description: 'Setup automatique complet des tickets (catégorie + salons + panneau)',
  aliases: ['ticket-auto', 'quick-ticket', 'ticket-setup-quick'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid  = message.guild.id
    const wait = await message.reply('Création de la structure des tickets...')

    try {
      const staffRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])

      // ── 1. Catégorie ──────────────────────────────────────
      const category = await message.guild.channels.create({
        name:   '〔 TICKETS 〕',
        type:   ChannelType.GuildCategory,
        reason: `Ticket setup quick — ${message.author.username}`,
        permissionOverwrites: [
          { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: message.guild.members.me,     allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
          ] },
          ...(staffRole ? [{
            id: staffRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
          }] : []),
        ],
      })

      // ── 2. Salon du panneau (public) ─────────────────────
      const panelChannel = await message.guild.channels.create({
        name:   'crée-un-ticket',
        type:   ChannelType.GuildText,
        parent: category.id,
        topic:  'Ouvrez un ticket en cliquant sur le bouton',
        reason: `Ticket setup quick — panneau`,
        permissionOverwrites: [
          { id: message.guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
          { id: message.guild.members.me,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
        ],
      })

      // ── 3. Salon de logs (staff uniquement) ─────────────
      const logsChannel = await message.guild.channels.create({
        name:   'ticket-logs',
        type:   ChannelType.GuildText,
        parent: category.id,
        topic:  'Logs des ouvertures et fermetures de tickets',
        reason: `Ticket setup quick — logs`,
        permissionOverwrites: [
          { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: message.guild.members.me,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(staffRole ? [{
            id: staffRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          }] : []),
        ],
      })

      // ── 4. Config en DB ───────────────────────────────────
      const cfg = {
        enabled:        true,
        panelChannelId: panelChannel.id,
        panelMessageId: null,
        categoryId:     category.id,
        logsChannelId:  logsChannel.id,
        staffRoleId:    staffRole?.id || null,
        pingRoleId:     null,
        maxOpen:        1,
        color:          '#FF0000',
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
        title:          'Créer un ticket',
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
        description:    'Besoin d\'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\nUn membre du staff vous répondra dès que possible.',
        image:          null,
        openMessage:    'Bienvenue {user} ! Notre équipe va vous répondre dès que possible.\nMerci de décrire votre demande en détail.',
        transcript:     true,
        mention:        true,
        types:          [],
      }
      db.set(`tickets_${gid}`, cfg)

      // ── 5. Envoyer le panneau avec Components V2 ────────
      const container = new ContainerBuilder().setAccentColor(0xFF0000)

      container.addTextDisplayComponents(
        td => td.setContent(`## ${cfg.title}\n-# ${message.guild.name}`)
      )
      container.addSeparatorComponents(
        sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      container.addTextDisplayComponents(td => td.setContent(cfg.description))
      container.addSeparatorComponents(
        sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      container.addActionRowComponents(
        row => row.setComponents(
          new ButtonBuilder()
            .setCustomId('ticket_open_default')
            .setLabel('Ouvrir un ticket')
            .setStyle(ButtonStyle.Primary)
        )
      )
      container.addTextDisplayComponents(
        td => td.setContent(`-# ${message.guild.name}`)
      )

      const sent = await panelChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 })
      cfg.panelMessageId = sent.id
      db.set(`tickets_${gid}`, cfg)

      // ── 6. Résumé ──────────────────────────────────────
      const recap = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Système de tickets configuré')
        .setColor(0x00FF88)
        .setDescription('Tout est prêt ! Les membres peuvent désormais ouvrir un ticket.')
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Catégorie',      value: `<#${category.id}>`,                                 inline: true },
          { name: 'Panneau',        value: `<#${panelChannel.id}>`,                             inline: true },
          { name: 'Logs',           value: `<#${logsChannel.id}>`,                              inline: true },
          { name: 'Rôle staff',     value: staffRole ? `<@&${staffRole.id}>` : 'Aucun (à définir)', inline: true },
          { name: 'Transcript HTML',value: 'Activé',                                            inline: true },
          { name: 'Max par membre', value: '1',                                                 inline: true },
          {
            name: 'Personnalisation',
            value:
              `\`${prefix}ticket-setup title <texte>\` · Titre du panneau\n` +
              `\`${prefix}ticket-setup desc <texte>\` · Description\n` +
              `\`${prefix}ticket-setup add <emoji> <label>\` · Ajouter un type\n` +
              `\`${prefix}ticket-setup staff @rôle\` · Changer le rôle staff`,
          },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      wait.edit({ content: null, embeds: [recap] }).catch(() => false)
    } catch (err) {
      console.error('[TICKET-QUICK]', err)
      wait.edit(`Erreur lors de la création : ${err.message}`).catch(() => false)
    }
  },
}
