// Each entry holds the Indonesian (`id`) and English (`en`) copy side by side so
// translations can be reviewed and kept in sync at a glance. Dictionaries are
// split by domain; this module merges them into one flat lookup keyed by string.

export type DictEntry = { id: string; en: string };
export type Dict = Record<string, DictEntry>;

import { UI } from "./ui";
import { BOARD_DICT } from "./board";
import { CARDS_DICT } from "./cards";
import { EVENTS_DICT } from "./events";
import { LOG_DICT } from "./log";

export const DICT: Dict = {
  ...UI,
  ...BOARD_DICT,
  ...CARDS_DICT,
  ...EVENTS_DICT,
  ...LOG_DICT,
};
