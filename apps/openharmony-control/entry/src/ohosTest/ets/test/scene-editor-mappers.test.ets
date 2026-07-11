import { describe, expect, it } from '@ohos/hypium';
import { mapSceneCardToDraft, buildScenePayloadDraft } from '../../../main/ets/model/scene-editor-mappers';
import { SceneCardState } from '../../../main/ets/model/page-view-state';

export default function sceneEditorMappersTest() {
  describe('scene editor mappers', () => {
    it('restores editable actions from persisted scene commands', () => {
      const scene: SceneCardState = {
        id: 'movie',
        name: 'Movie Night',
        icon: 'movie',
        description: 'Dim the lights',
        enabled: true,
        triggerLabel: 'Run now',
        triggerTypeLabel: 'manual',
        actions: ['Dim living room', 'Lock front door'],
        commands: [
          { deviceId: 'light-living-room', name: 'set-brightness', payload: { brightness: 20 } },
          { deviceId: 'door-front', name: 'lock', payload: { locked: true } },
        ],
        repeatLabel: 'Never',
        canRunNow: true,
        canToggle: true,
        canEdit: true,
        canDelete: true,
      };

      const draft = mapSceneCardToDraft(scene);

      expect(draft.name).assertEqual('Movie Night');
      expect(draft.icon).assertEqual('movie');
      expect(draft.actions.length).assertEqual(2);
      expect(draft.actions[0].command).assertEqual('set-brightness:20');
      expect(draft.actions[1].command).assertEqual('lock:true');
    });

    it('builds payload commands without losing scene icon', () => {
      const payload = buildScenePayloadDraft({
        name: 'Movie Night',
        icon: 'movie',
        actions: [
          {
            id: 'light-action',
            type: 'device',
            deviceId: 'light-living-room',
            command: 'set-brightness:20',
          },
          {
            id: 'door-action',
            type: 'device',
            deviceId: 'door-front',
            command: 'lock:true',
          },
        ],
      }, ['Dim living room', 'Lock front door']);

      expect(payload.icon).assertEqual('movie');
      expect(payload.roomId === undefined).assertTrue();
      expect(payload.commands.length).assertEqual(2);
      expect(payload.commands[0].name).assertEqual('set-brightness');
      expect(payload.commands[0].payload.brightness).assertEqual(20);
      expect(payload.commands[1].payload.locked).assertEqual(true);
    });

    it('normalizes action picker command aliases into persisted scene commands', () => {
      const payload = buildScenePayloadDraft({
        name: 'Whole home reset',
        icon: 'home',
        actions: [
          { id: 'power', type: 'device', deviceId: 'light-1', command: 'power:true' },
          { id: 'brightness', type: 'device', deviceId: 'light-1', command: 'brightness:75' },
          { id: 'temperature', type: 'device', deviceId: 'ac-1', command: 'targetTemperature:24' },
          { id: 'lock', type: 'device', deviceId: 'door-1', command: 'locked:true' },
        ],
      }, ['Power on', 'Brightness 75', 'Temperature 24', 'Lock door']);

      expect(payload.commands.length).assertEqual(4);
      expect(payload.commands[0].name).assertEqual('switch');
      expect(payload.commands[0].payload.on).assertEqual(true);
      expect(payload.commands[1].name).assertEqual('set-brightness');
      expect(payload.commands[1].payload.brightness).assertEqual(75);
      expect(payload.commands[2].name).assertEqual('set-target-temperature');
      expect(payload.commands[2].payload.targetTemperature).assertEqual(24);
      expect(payload.commands[3].name).assertEqual('lock');
      expect(payload.commands[3].payload.locked).assertEqual(true);
    });

    it('builds a room-scoped payload when the editor forces a room id', () => {
      const payload = buildScenePayloadDraft({
        name: 'Bedroom wind down',
        icon: 'bedtime',
        actions: [
          {
            id: 'light-action',
            type: 'device',
            deviceId: 'light-bedroom',
            command: 'switch:false',
          },
        ],
      }, ['Turn bedroom light off'], 'bedroom');

      expect(payload.roomId).assertEqual('bedroom');
      expect(payload.commands.length).assertEqual(1);
      expect(payload.commands[0].payload.on).assertEqual(false);
    });

    it('preserves the persisted room id when editing an existing room scene', () => {
      const scene: SceneCardState = {
        id: 'movie-bedroom',
        name: 'Bedroom movie',
        icon: 'movie',
        roomId: 'bedroom',
        description: 'Relax in bedroom',
        enabled: true,
        triggerLabel: 'Run now',
        triggerTypeLabel: 'manual',
        actions: ['Turn bedroom light off'],
        commands: [
          { deviceId: 'light-bedroom', name: 'switch', payload: { on: false } },
        ],
        repeatLabel: 'Never',
        canRunNow: true,
        canToggle: true,
        canEdit: true,
        canDelete: true,
      };

      const draft = mapSceneCardToDraft(scene);
      const payload = buildScenePayloadDraft(draft, ['Turn bedroom light off'], scene.roomId);

      expect(payload.roomId).assertEqual('bedroom');
      expect(payload.commands.length).assertEqual(1);
      expect(payload.commands[0].payload.on).assertEqual(false);
    });
  });
}
