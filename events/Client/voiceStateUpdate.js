// ============================================================
//  Événement : voiceStateUpdate — Log connexions vocales
// ============================================================

const { sendLog } = require('../../utils/logs')

module.exports = async (client, oldState, newState) => {
  if (!newState.guild) return
  const member = newState.member || oldState.member
  if (!member || member.user.bot) return

  // Rejoint un vocal
  if (!oldState.channelId && newState.channelId) {
    sendLog(
      newState.guild, 'voice',
      'Connexion vocale',
      `<@${member.id}> a rejoint le salon vocal <#${newState.channelId}>`,
      0x00FF88
    )
  }
  // Quitte un vocal
  else if (oldState.channelId && !newState.channelId) {
    sendLog(
      oldState.guild, 'voice',
      'Déconnexion vocale',
      `<@${member.id}> a quitté le salon vocal <#${oldState.channelId}>`,
      0xFF4444
    )
  }
  // Change de salon
  else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    sendLog(
      newState.guild, 'voice',
      'Changement de salon vocal',
      `<@${member.id}> est passé de <#${oldState.channelId}> à <#${newState.channelId}>`,
      0x5865F2
    )
  }
  // Mute/sourdine serveur
  else if (oldState.serverMute !== newState.serverMute) {
    const action = newState.serverMute ? 'mute serveur' : 'unmute serveur'
    sendLog(
      newState.guild, 'voice',
      `Vocal — ${action}`,
      `<@${member.id}> a été ${action} dans <#${newState.channelId}>`,
      0xFFAA00
    )
  }
}
