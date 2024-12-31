import Clutter from '@girs/clutter-15';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-15';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class EmojiPanoItem extends PanoItem {
  private emojiItemSettings: Gio.Settings;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.body.add_style_class_name('pano-item-body-emoji');

    this.emojiItemSettings = this.settings.get_child('emoji-item');

    const emojiContainer = new St.BoxLayout({
      vertical: false,
      xExpand: true,
      yExpand: true,
      yAlign: Clutter.ActorAlign.FILL,
      xAlign: Clutter.ActorAlign.FILL,
      styleClass: 'emoji-container',
    });

    this.label = new St.Label({
      xAlign: Clutter.ActorAlign.CENTER,
      yAlign: Clutter.ActorAlign.CENTER,
      xExpand: true,
      yExpand: true,
      text: this.dbItem.content,
      styleClass: 'pano-item-body-emoji-content',
    });
    this.label.clutterText.lineWrap = true;
    this.label.clutterText.lineWrapMode = Pango.WrapMode.WORD_CHAR;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    emojiContainer.add_child(this.label);

    this.body.add_child(emojiContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.emojiItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.emojiItemSettings.get_string('header-bg-color');
    const headerColor = this.emojiItemSettings.get_string('header-color');
    const bodyBgColor = this.emojiItemSettings.get_string('body-bg-color');
    const emojiSize = this.emojiItemSettings.get_int('emoji-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor};`);
    this.label.set_style(`font-size: ${emojiSize}px;`);
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }
}
