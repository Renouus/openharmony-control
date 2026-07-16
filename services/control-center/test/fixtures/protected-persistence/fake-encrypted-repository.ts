export {};
declare const row: { state_json: string };
const encryptedRepositories = {
  devices: { encodeState: (_id: string, value: unknown) => String(value) },
};
encryptedRepositories.devices.encodeState("device-1", JSON.parse(row.state_json));
