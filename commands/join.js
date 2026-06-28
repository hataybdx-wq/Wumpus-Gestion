// ============================================================
//  Commande : join — Rejoindre un salon vocal
//  Correction : VoiceConnectionStatus non importé dans l'original
// ============================================================

const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice')

module.exports = {
  name: 'join',
  description: 'Lien d\'invitation du bot',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.voice.channel)
      return message.reply('❌ Vous devez être dans un salon vocal !')

    const channel = message.member.voice.channel

    const connection = joinVoiceChannel({
      channelId:      channel.id,
      guildId:        message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    })

    connection.once(VoiceConnectionStatus.Ready, () => {
      message.reply('✅ Connecté au salon vocal !')
    })

    connection.on('error', () => {
      message.reply('❌ Erreur de connexion vocale.').catch(() => false)
    })
  },
}
