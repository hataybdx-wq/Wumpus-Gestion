module.exports = {
  name: 'vc',
  description: 'Nombre de membres connectés en vocal',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const inVoice = message.guild.members.cache.filter(m => m.voice.channel).size
    message.reply(`🎙️ **${inVoice}** membres actuellement en salon vocal (sur **${message.guild.memberCount}** membres).`)
  },
}
