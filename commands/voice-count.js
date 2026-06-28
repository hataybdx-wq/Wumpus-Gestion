module.exports = {
  name: 'voicecount',
  description: 'Nombre de personnes en vocal',
  aliases: ['vc-count'],
  run: async (client, message) => {
    const voice = message.guild.voiceStates.cache.size
    const channels = message.guild.channels.cache.filter(c => c.isVoiceBased()).size
    message.reply(`🎙️ **${voice}** membre(s) en vocal dans **${channels}** salon(s)`)
  },
}
