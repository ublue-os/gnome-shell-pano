import type Gda5 from '@girs/gda-5.0';
import type Gda6 from '@girs/gda-6.0';
import GLib from '@girs/glib-2.0';
import { PACKAGE_VERSION } from '@girs/gnome-shell/dist/misc/config';
import { Notification, Source as MessageTraySource } from '@girs/gnome-shell/dist/ui/messageTray';
import St from '@girs/st-15';

import { logger } from './shell';

const debug = logger('compatibility');

// better typed functions for GDA

// we get /  have to store strings for dates and numbers for boolean
type MapGDATypes<T> = T extends boolean ? number : T extends Date ? string : T;

//@ts-expect-error: this extends the types, to be more specific, but the generic types don't like that extensions
export interface DataModelIter<T> extends Gda5.DataModelIter {
  get_value_for_field<K extends keyof T>(key: K): MapGDATypes<T[K]>;
}

//@ts-expect-error: this extends the types, to be more specific, but the generic types don't like that extensions
export interface SqlBuilder<T> extends Gda5.SqlBuilder {
  add_field_value_as_gvalue<K extends keyof T>(key: K, value: MapGDATypes<T[K]>): void;
}

// compatibility functions for Gda 5.0 and 6.0

function isGda6Builder(builder: Gda5.SqlBuilder | Gda6.SqlBuilder | SqlBuilder<any>): builder is Gda6.SqlBuilder {
  return builder.add_expr_value.length === 1;
}

/**
 * This is hack for libgda6 <> libgda5 compatibility.
 *
 * @param value any
 * @returns expr id
 */
export function add_expr_value(builder: Gda5.SqlBuilder | Gda6.SqlBuilder | SqlBuilder<any>, value: any): number {
  if (isGda6Builder(builder)) {
    return builder.add_expr_value(value);
  }

  return builder.add_expr_value(null, value);
}

/**
 * a faster unescape function for gda
 *
 * Does not the exact reverse of gda_default_escape_string(): that transforms any "''" into "'", we don't do that,
 * since this is incorrect in our usage, just unescape any "\\" into "\" and any "\'" into "'".
 * @param input string to unescape
 * @returns unescaped string or the input, if an error was be found or nothing needs to be unescaped
 */
export function unescape_string(input: string): string {
  // check if we need to escape something, so we don't mutate strings unnecessary, this speeds things up
  if (!input.includes('\\')) {
    return input;
  }

  try {
    return input.replaceAll(/\\(.)/g, (_all, captured) => {
      if (captured === '\\' || captured === "'") {
        return captured;
      }

      throw new Error(`Unexpected escape character '${captured}'`);
    });
  } catch (error) {
    debug(`Error in unescape: ${error}`);
    // return the original string
    return input;
  }
}

// compatibility functions to check if a specific gnome-shell is used
export function isGnomeVersion(version: number): boolean {
  const [major, _minor, _patch, ..._rest]: Array<number | undefined> = PACKAGE_VERSION.split('.').map((num) => {
    const result = parseInt(num);
    if (isNaN(result)) {
      return undefined;
    }
    return result;
  });

  if (major === undefined) {
    return PACKAGE_VERSION.includes(version.toString());
  }

  return major === version;
}

// compatibility functions for gnome-shell 47

export function isGnome47(): boolean {
  return isGnomeVersion(47);
}

// compatibility functions for gnome-shell 45 / 46

function isGnome45Notifications(): boolean {
  return MessageTraySource.prototype.addNotification === undefined;
}

export function newNotification(
  source: MessageTraySource,
  text: string,
  banner: string,
  transient_: boolean,
  params: Notification.ConstructorProps,
): Notification {
  if (isGnome45Notifications()) {
    // @ts-expect-error gnome 45 type
    const notification = new Notification(source, text, banner, {
      datetime: GLib.DateTime.new_now_local(),
      ...params,
    });

    (notification as any as { setTransient: (value: boolean) => void }).setTransient(transient_);
    return notification;
  }

  return new Notification({
    source: source as MessageTraySource,
    title: text,
    body: banner,
    datetime: GLib.DateTime.new_now_local(),
    isTransient: transient_,
    ...params,
  });
}

export function newMessageTraySource(title: string, iconName: string): MessageTraySource {
  if (isGnome45Notifications()) {
    // @ts-expect-error gnome 45 type
    return new MessageTraySource(title, iconName);
  }

  return new MessageTraySource({ title, iconName });
}

export function addNotification(source: MessageTraySource, notification: Notification): void {
  if ((source as any as { showNotification: undefined | any }).showNotification !== undefined) {
    // @ts-expect-error gnome 45 type, can also be in some earlier versions of gnome 46, so using an explicit check for undefined, so that it works everywhere
    source.showNotification(notification);
  } else {
    (source as MessageTraySource).addNotification(notification as Notification);
  }
}

export function scrollViewAddChild(scrollView: St.ScrollView, actor: St.Scrollable): void {
  if ((scrollView as any as { add_actor: undefined | any }).add_actor !== undefined) {
    // @ts-expect-error gnome 45 type, or even some gnome 46 distros do support that, so using this check, instead of isGnome45()!
    scrollView.add_actor(actor);
  } else {
    scrollView.set_child(actor);
  }
}

export type AdjustmentType = 'v' | 'h';

export function getScrollViewAdjustment(scrollView: St.ScrollView, type: AdjustmentType): St.Adjustment {
  if (scrollView.vadjustment !== undefined) {
    if (type === 'v') {
      return scrollView.vadjustment;
    }
    return scrollView.hadjustment;
  } else {
    if (type === 'v') {
      return scrollView.vscroll.adjustment;
    }
    return scrollView.hscroll.adjustment;
  }
}
