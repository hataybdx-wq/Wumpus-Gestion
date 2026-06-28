// ============================================================
//  Commande : embed — Créer un embed custom
//
//  Usage :
//    !embed [#salon]     → ouvre l'interface de création
//
//  L'utilisateur configure titre / description / couleur / image via modal.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, PermissionFlagsBits, MessageFlags,
} = require('discord.js')

// Sessions en mémoire : { [userId]: { target, title, description, color, image, thumbnail, footer } }
const sessions = new Map()

function buildPreview(session) {
  const embed = new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setColor(session.color || 0xFF0000)
  if (session.title)       embed.setTitle(session.title)
  if (session.description) embed.setDescription(session.description)
  if (session.image)       embed.setImage(session.image)
  if (session.thumbnail)   embed.setThumbnail(session.thumbnail)
  if (session.footer)      embed.setFooter({ text: session.footer })
  .setFooter({ text: 'Made by Wumpus' })
  if (session.timestamp)   embed.setTimestamp()
  return embed
}

function buildContainer(session, userId) {
  const container = new ContainerBuilder().setAccentColor(0xFF0000)

  container.addTextDisplayComponents(td => td.setContent(
    `## Créateur d'embed\n-# Salon cible : ${session.target ? `<#${session.target}>` : '_non défini_'}`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  // Affichage de l'état actuel
  container.addTextDisplayComponents(td => td.setContent(
    `### Configuration actuelle\n` +
    `**Titre :** ${session.title || '_vide_'}\n` +
    `**Description :** ${session.description ? (session.description.slice(0, 100) + (session.description.length > 100 ? '...' : '')) : '_vide_'}\n` +
    `**Couleur :** \`#${(session.color || 0xFF0000).toString(16).padStart(6, '0').toUpperCase()}\`\n` +
    `**Image :** ${session.image ? '✓ Définie' : '_vide_'}\n` +
    `**Thumbnail :** ${session.thumbnail ? '✓ Définie' : '_vide_'}\n` +
    `**Footer :** ${session.footer || '_vide_'}\n` +
    `**Timestamp :** ${session.timestamp ? 'Activé' : 'Désactivé'}`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  // Boutons d'édition
  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`emb_title_${userId}`).setLabel('Titre').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`emb_desc_${userId}`).setLabel('Description').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`emb_color_${userId}`).setLabel('Couleur').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`emb_images_${userId}`).setLabel('Images').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`emb_footer_${userId}`).setLabel('Footer').setStyle(ButtonStyle.Primary),
  ))

  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`emb_timestamp_${userId}`).setLabel(session.timestamp ? 'Retirer timestamp' : 'Ajouter timestamp').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`emb_send_${userId}`).setLabel('Envoyer').setStyle(ButtonStyle.Success).setDisabled(!session.target || (!session.title && !session.description)),
    new ButtonBuilder().setCustomId(`emb_cancel_${userId}`).setLabel('Annuler').setStyle(ButtonStyle.Danger),
  ))

  return container
}

module.exports = {
  name: 'embed',
  description: 'Créer un embed custom et l\'envoyer dans un salon',
  aliases: ['embed-create', 'createembed'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return

    const target = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel

    const session = {
      target: target.id,
      color:  0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      timestamp: false,
    }
    sessions.set(message.author.id, session)

    const preview = buildPreview(session)
    const container = buildContainer(session, message.author.id)

    const msg = await message.reply({
      content: '**Aperçu :**',
      embeds: [preview],
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch((err) => {
      // Si ça échoue avec V2+embeds, on utilise juste le container
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
    })
    if (!msg) return

    // Envoyer l'aperçu séparément
    const previewMsg = await message.channel.send({ content: '**Aperçu de l\'embed :**', embeds: [preview] })

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 600000,
    })

    col.on('collect', async i => {
      const sess = sessions.get(message.author.id)
      if (!sess) return i.reply({ content: 'Session expirée.', flags: 64 })

      const id = i.customId

      // Modals pour saisir
      if (id.startsWith('emb_title_')) {
        const modal = new ModalBuilder().setCustomId(`embm_title_${message.author.id}`).setTitle('Titre de l\'embed')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('val').setLabel('Titre').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(false).setValue(sess.title || '')
          ))
        return i.showModal(modal)
      }

      if (id.startsWith('emb_desc_')) {
        const modal = new ModalBuilder().setCustomId(`embm_desc_${message.author.id}`).setTitle('Description de l\'embed')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('val').setLabel('Description (markdown supporté)').setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(false).setValue(sess.description || '')
          ))
        return i.showModal(modal)
      }

      if (id.startsWith('emb_color_')) {
        const modal = new ModalBuilder().setCustomId(`embm_color_${message.author.id}`).setTitle('Couleur de l\'embed')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('val').setLabel('Couleur hexadécimale').setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(false).setPlaceholder('#FF0000').setValue(`#${(sess.color || 0xFF0000).toString(16).padStart(6, '0').toUpperCase()}`)
          ))
        return i.showModal(modal)
      }

      if (id.startsWith('emb_images_')) {
        const modal = new ModalBuilder().setCustomId(`embm_images_${message.author.id}`).setTitle('Images')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('image').setLabel('URL de l\'image principale').setStyle(TextInputStyle.Short).setRequired(false).setValue(sess.image || '')
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('thumbnail').setLabel('URL de la miniature (thumbnail)').setStyle(TextInputStyle.Short).setRequired(false).setValue(sess.thumbnail || '')
            ),
          )
        return i.showModal(modal)
      }

      if (id.startsWith('emb_footer_')) {
        const modal = new ModalBuilder().setCustomId(`embm_footer_${message.author.id}`).setTitle('Footer')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('val').setLabel('Texte du footer').setStyle(TextInputStyle.Short).setMaxLength(2048).setRequired(false).setValue(sess.footer || '')
          ))
        return i.showModal(modal)
      }

      if (id.startsWith('emb_timestamp_')) {
        sess.timestamp = !sess.timestamp
        await i.update({ components: [buildContainer(sess, message.author.id)], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
        previewMsg.edit({ embeds: [buildPreview(sess)] }).catch(() => false)
        return
      }

      if (id.startsWith('emb_send_')) {
        const ch = message.guild.channels.cache.get(sess.target)
        if (!ch) return i.reply({ content: 'Salon introuvable.', flags: 64 })

        await ch.send({ embeds: [buildPreview(sess)] }).catch(() => false)
        sessions.delete(message.author.id)
        col.stop()
        previewMsg.delete().catch(() => false)

        return i.update({
          components: [new ContainerBuilder().setAccentColor(0x00FF88)
            .addTextDisplayComponents(td => td.setContent(
              `## Embed envoyé\n-# Envoyé dans <#${ch.id}>`
            ))],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }

      if (id.startsWith('emb_cancel_')) {
        sessions.delete(message.author.id)
        col.stop()
        previewMsg.delete().catch(() => false)

        return i.update({
          components: [new ContainerBuilder().setAccentColor(0xED4245)
            .addTextDisplayComponents(td => td.setContent(`## Annulé`))],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }
    })

    col.on('end', () => {
      sessions.delete(message.author.id)
      previewMsg.delete().catch(() => false)
    })
  },

  // Handler du modal (appelé depuis interactionCreate)
  handleModal: async (interaction) => {
    if (!interaction.customId.startsWith('embm_')) return false

    const userId = interaction.user.id
    const sess = sessions.get(userId)
    if (!sess) {
      await interaction.reply({ content: 'Session expirée.', flags: 64 })
      return true
    }

    const kind = interaction.customId.split('_')[1]

    if (kind === 'title')    sess.title       = interaction.fields.getTextInputValue('val') || null
    if (kind === 'desc')     sess.description = interaction.fields.getTextInputValue('val') || null
    if (kind === 'footer')   sess.footer      = interaction.fields.getTextInputValue('val') || null
    if (kind === 'color') {
      const v = interaction.fields.getTextInputValue('val')?.trim().replace(/^#/, '')
      const parsed = parseInt(v, 16)
      if (!isNaN(parsed)) sess.color = parsed
    }
    if (kind === 'images') {
      sess.image     = interaction.fields.getTextInputValue('image')     || null
      sess.thumbnail = interaction.fields.getTextInputValue('thumbnail') || null
    }

    await interaction.reply({ content: 'Mis à jour.', flags: 64 })
    return true
  },

  sessions,
  buildPreview,
  buildContainer,
}
