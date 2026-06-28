module.exports = {
  name: 'member',
  description: 'Nombre de membres (avec et sans bots)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    message.reply(`👥 Nous sommes **${message.guild.memberCount}** sur ce serveur !\n\n**Merci à vous !**`)
  },
}
