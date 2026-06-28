import { describe, expect, it } from '@ohos/hypium';
import { buildAutomationPayloadDraft, hydrateAutomationDraft } from '../../../main/ets/model/automation-editor-mappers';
import { AutomationSnapshot } from '../../../main/ets/services/device-api';

export default function automationEditorMappersTest() {
  describe('automation editor mappers', () => {
    it('hydrates persisted automation data into editable draft state', () => {
      const automation: AutomationSnapshot = {
        id: 'night-routine',
        icon: 'auto_awesome',
        name: 'Night Routine',
        triggerType: 'time',
        triggerJson: '[{"id":"t1","type":"time","time":"22:00","label":"22:00"}]',
        actionJson: '[{"id":"a1","type":"device","deviceId":"door-front","command":"lock:true","label":"Lock front door"}]',
        enabled: true,
      };

      const draft = hydrateAutomationDraft(automation);

      expect(draft.name).assertEqual('Night Routine');
      expect(draft.icon).assertEqual('auto_awesome');
      expect(draft.conditions.length).assertEqual(1);
      expect(draft.conditions[0].type).assertEqual('time');
      expect(draft.conditions[0].time).assertEqual('22:00');
      expect(draft.actions.length).assertEqual(1);
      expect(draft.actions[0].type).assertEqual('device');
      expect(draft.actions[0].deviceId).assertEqual('door-front');
      expect(draft.actions[0].command).assertEqual('lock:true');
    });

    it('drops malformed trigger and action records instead of generating broken draft data', () => {
      const automation: AutomationSnapshot = {
        id: 'bad-routine',
        icon: 'auto_awesome',
        name: 'Bad Routine',
        triggerType: 'device',
        triggerJson: '[{"foo":"bar"},{"type":"device","deviceId":"sensor-1","property":"motion","operator":"==","threshold":"true"}]',
        actionJson: '[{},{"type":"scene","sceneId":"movie"}]',
        enabled: true,
      };

      const draft = hydrateAutomationDraft(automation);

      expect(draft.conditions.length).assertEqual(1);
      expect(draft.conditions[0].deviceId).assertEqual('sensor-1');
      expect(draft.actions.length).assertEqual(1);
      expect(draft.actions[0].type).assertEqual('scene');
      expect(draft.actions[0].sceneId).assertEqual('movie');
    });

    it('round-trips hydrated draft data without dropping trigger or action semantics', () => {
      const automation: AutomationSnapshot = {
        id: 'night-routine',
        icon: 'auto_awesome',
        name: 'Night Routine',
        triggerType: 'time',
        triggerJson: '[{"id":"t1","type":"time","time":"22:00","label":"22:00"}]',
        actionJson: '[{"id":"a1","type":"device","deviceId":"door-front","command":"lock:true","label":"Lock front door"}]',
        enabled: true,
      };

      const draft = hydrateAutomationDraft(automation);
      draft.name = 'Night Routine Updated';
      const payload = buildAutomationPayloadDraft(
        draft,
        (condition) => condition.type === 'time' ? `Time ${condition.time}` : 'Device condition',
        (action) => action.type === 'device' ? `Command ${action.command}` : 'Scene action',
      );

      expect(payload.name).assertEqual('Night Routine Updated');
      expect(payload.triggerType).assertEqual('time');
      expect(payload.triggerJson).assertContain('"time":"22:00"');
      expect(payload.actionJson).assertContain('"deviceId":"door-front"');
      expect(payload.actionJson).assertContain('"command":"lock:true"');
    });
  });
}
