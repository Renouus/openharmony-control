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
      expect(payload.commands.length).assertEqual(2);
      expect(payload.commands[0].name).assertEqual('set-brightness');
      expect(payload.commands[0].payload.brightness).assertEqual(20);
      expect(payload.commands[1].payload.locked).assertEqual(true);
    });
  });
}
