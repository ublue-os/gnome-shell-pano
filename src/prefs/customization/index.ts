import Adw from '@girs/adw-1';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { CommonStyleGroup } from '@pano/prefs/customization/commonStyleGroup';
import { ItemStyleGroup } from '@pano/prefs/customization/itemStyleGroup';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

@registerGObjectClass
export class CustomizationPage extends Adw.PreferencesPage {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Customization'),
      iconName: 'emblem-photos-symbolic',
    });

    this.add(new CommonStyleGroup(ext));
    this.add(new ItemStyleGroup(ext));
  }
}
