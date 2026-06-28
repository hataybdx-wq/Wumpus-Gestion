// ============================================================
//  Commande : poll
//  Sondage moderne avec plusieurs options, boutons de vote
//  et barres de progression en temps réel.
//
//  Usage :
//    !poll <question> | <option1> | <option2> | [option3] …
//    !poll Quel jeu ce soir ? | Minecraft | Valorant | League
//
//  Jusqu'à 10 options. Clic sur un bouton = vote. Reclic = annuler.
//  Les résultats s'affichent en barres de progression en direct.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const STYLES = [
  ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success,
  ButtonStyle.Danger,  ButtonStyle.Primary,   ButtonStyle.Secondary,
  ButtonStyle.Success, ButtonStyle.Danger,    ButtonStyle.Primary, ButtonStyle.Secondary,
]

function genId() {
  return 'poll' + Math.random().toString(36).slice(2, 8)
}

function progressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function buildContainer(poll) {
  const container = new ContainerBuilder().setAccentColor(0xFF0000)

  container.addTextDisplayComponents(td => td.setContent(
    `## ${poll.question}\n-# Sondage organisé par <@${poll.authorId}>`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  const totalVotes = Object.keys(poll.votes || {}).length
  const counts     = poll.options.map((_, i) =>
    Object.values(poll.votes || {}).filter(v => v === i).length
  )

  const lines = poll.options.map((opt, i) => {
    const c   = counts[i]
    const pct = totalVotes === 0 ? 0 : Math.round((c / totalVotes) * 100)
    return `**${i + 1}.** ${opt}\n` +
           `\`${progressBar(pct, 18)}\` ${pct}% · ${c} vote${c > 1 ? 's' : ''}`
  }).join('\n\n')

  container.addTextDisplayComponents(td => td.setContent(lines))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  container.addTextDisplayComponents(td => td.setContent(
    `-# ${totalVotes} participant${totalVotes > 1 ? 's' : ''} · Cliquez sur un bouton pour voter`
  ))

  // Les boutons (groupés par 5 max par rangée)
  const rows = []
  for (let i = 0; i < poll.options.length; i += 5) {
    const slice = poll.options.slice(i, i + 5)
    const row = new ActionRowBuilder()
    slice.forEach((opt, j) => {
      const idx = i + j
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_${poll.id}_${idx}`)
          .setLabel(`${idx + 1}`)
          .setStyle(STYLES[idx % STYLES.length])
      )
    })
    rows.push(row)
  }
  rows.forEach(r => container.addActionRowComponents(() => r))

  return container
}

module.exports = {
  name: 'poll',
  description: 'Créer un sondage avec plusieurs options et boutons de vote',
  aliases: ['sondage2', 'vote'],
  buildContainer,  // exporté pour le handler

  run: async (client, message, args, prefix) => {
    const content = args.join(' ')
    if (!content.includes('|')) {
      return message.reply(
        `Usage : \`${prefix}poll <question> | <option1> | <option2> | [option3] …\`\n` +
        `**Exemple :** \`${prefix}poll Quel jeu ce soir ? | Minecraft | Valorant | League\`\n\n` +
        `Jusqu'à 10 options. Cliquez sur un bouton pour voter, reclic pour annuler.`
      )
    }

    const parts = content.split('|').map(p => p.trim()).filter(p => p.length > 0)
    if (parts.length < 3) return message.reply('Il faut au moins une question et 2 options.')
    if (parts.length > 11) return message.reply('Max 10 options.')

    const question = parts[0]
    const options  = parts.slice(1)

    const poll = {
      id:        genId(),
      question,
      options,
      votes:     {},  // { userId: optionIndex }
      authorId:  message.author.id,
      channelId: message.channel.id,
      messageId: null,
      createdAt: Date.now(),
    }

    const gid = message.guild.id
    const container = buildContainer(poll)
    const sent = await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 })
    poll.messageId = sent.id

    const polls = db.get(`polls_${gid}`) || {}
    polls[poll.id] = poll
    db.set(`polls_${gid}`, polls)

    message.delete().catch(() => false)
  },
}
