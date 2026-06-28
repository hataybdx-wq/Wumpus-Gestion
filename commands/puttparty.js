const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')

module.exports = {
  name: 'puttparty',
  description: 'Lance Putt Party (mini golf) dans un salon vocal',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.voice.channel)
      return message.reply(':x: Tu dois être dans un salon vocal !')
    try {
      const invite = await message.member.voice.channel.createInvite({
        maxAge: 86400, maxUses: 0,
        targetApplication: '945737671223947305', targetType: 2,
      })
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Lancer l'activité").setURL('https://discord.gg/' + invite.code).setStyle(ButtonStyle.Link)
      )
      message.reply({ embeds: [new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setDescription('***Putt Party :***').setColor(0x000001).setFooter({ text: 'Made by Wumpus' })], components: [row] })
    } catch { message.reply('❌ Impossible de créer l\'invitation.') }
  },
}
