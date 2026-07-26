// Must stay in lockstep with the RN app's exercise-name slugify so a video
// uploaded here matches the same exercise however each gym typed its name.
export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
