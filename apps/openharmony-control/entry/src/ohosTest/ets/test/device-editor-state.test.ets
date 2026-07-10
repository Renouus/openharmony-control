import { describe, expect, it } from '@ohos/hypium';
import {
  DEVICE_ICON_OPTIONS,
  createDraft,
  defaultDeviceIcon,
  isDeviceEditorDirty,
  resolvedDeviceIcon,
  validateDeviceEditorDraft,
} from '../../../main/ets/model/device-editor-state';

export default function deviceEditorStateTest() {
  describe('device editor state', () => {
    it('normalizes a valid draft', () => {
      const draft = createDraft('light-1', '  Desk Light  ', '  Near window  ', 'lightbulb', 'study');
      const result = validateDeviceEditorDraft(draft, ['study']);

      expect(result.valid).assertTrue();
      expect(result.normalized.customName).assertEqual('Desk Light');
      expect(result.normalized.note).assertEqual('Near window');
    });

    it('ignores edge whitespace in dirty comparison', () => {
      const initial = createDraft('light-1', 'Desk Light', '', 'lightbulb', 'study');
      const current = createDraft('light-1', ' Desk Light ', ' ', 'lightbulb', 'study');

      expect(isDeviceEditorDirty(initial, current)).assertFalse();
    });

    it('rejects invalid names notes icons and rooms', () => {
      expect(validateDeviceEditorDraft(createDraft('light-1', ' ', '', 'lightbulb', 'study'), ['study']).valid).assertFalse();
      expect(validateDeviceEditorDraft(createDraft('light-1', 'n'.repeat(31), '', 'lightbulb', 'study'), ['study']).valid).assertFalse();
      expect(validateDeviceEditorDraft(createDraft('light-1', 'Lamp', 'n'.repeat(121), 'lightbulb', 'study'), ['study']).valid).assertFalse();
      expect(validateDeviceEditorDraft(createDraft('light-1', 'Lamp', '', 'rocket', 'study'), ['study']).valid).assertFalse();
      expect(validateDeviceEditorDraft(createDraft('light-1', 'Lamp', '', 'lightbulb', ''), ['study']).valid).assertFalse();
      expect(validateDeviceEditorDraft(createDraft('light-1', 'Lamp', '', 'lightbulb', 'attic'), ['study']).valid).assertFalse();
    });

    it('provides exactly the supported icons and type fallback', () => {
      expect(DEVICE_ICON_OPTIONS.length).assertEqual(8);
      expect(DEVICE_ICON_OPTIONS.join(',')).assertEqual('lightbulb,lock,thermostat,sensors,videocam,outlet,air,devices_other');
      expect(defaultDeviceIcon('light')).assertEqual('lightbulb');
      expect(defaultDeviceIcon('unknown')).assertEqual('devices_other');
      expect(resolvedDeviceIcon('rocket', 'door-lock')).assertEqual('lock');
    });
  });
}
