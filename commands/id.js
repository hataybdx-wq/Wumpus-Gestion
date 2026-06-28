module.exports = {
  name: 'id',
  description: 'Affiche l\'ID d\'un membre ou du serveur',
  aliases: ['userid'],
  run: async (client, message, args) => {
    if (args[0] === 'server' || args[0] === 'guild') {
      return message.reply(`ID du serveur : \`${message.guild.id}\``)
    }
    const target = message.mentions.users.first() || message.author
    message.reply(`ID de ${target.username} : \`${target.id}\``)
  },
}
