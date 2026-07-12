export function commandFeedbackLabel(code: string): string {
  switch (code) {
    case 'COMMAND_UNAUTHORIZED':
      return 'Command rejected by security check';
    case 'DEVICE_NOT_FOUND':
      return 'Device unavailable';
    case 'DEVICE_OFFLINE':
      return 'Device is offline';
    case 'COMMAND_INVALID':
      return 'Command not supported';
    default:
      return 'Command failed';
  }
}
