// Student resources data, bundled from the legacy resources-data.json.

import data from "@/data/resources-data.json";

export interface ResourceItem {
  resource: string;
  value: string;
  description: string;
  tags: string[];
  link: string;
}

export const ALL_RESOURCES: ResourceItem[] = data.all_items as ResourceItem[];

/** Latest N resources carrying a given tag (newest first). */
export function latestByTag(tag: string, count: number): ResourceItem[] {
  return ALL_RESOURCES.filter((item) => item.tags.includes(tag))
    .slice(-count)
    .reverse();
}

/** All resources carrying a given category tag. */
export function byCategory(category: string): ResourceItem[] {
  return ALL_RESOURCES.filter((item) => item.tags.includes(category));
}
