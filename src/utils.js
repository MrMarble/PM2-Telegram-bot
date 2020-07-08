/**
 * Template function that adds a right padding of 12 to the first string
 *
 * @export
 * @param {string[]} strings
 * @param {any} key
 * @returns {string}
 */
export function pad(strings, key) {
  const maxLength = 12;
  strings = [...strings];
  let start = strings.splice(0, 1)[0].trim();
  return ` ${start.padEnd(maxLength)}${key}${strings.pop() || ""}`;
}

/**
 * Returns elapsed time
 *
 * @export
 * @param {(number|sring)} timestamp
 * @returns {string}
 */
export function timeSince(timestamp) {
  let diff = (new Date().getTime() - parseInt(timestamp)) / 1000;
  let seconds = diff;
  let minutes = 0;
  let hours = 0;
  let days = 0;
  let str = `${Math.abs(Math.round(seconds))}s`;
  if (seconds > 60) {
    seconds = Math.abs(Math.round(diff % 60));
    minutes = Math.abs(Math.round((diff /= 60)));
    str = `${minutes}m ${seconds}s`;
  }
  if (minutes > 60) {
    minutes = Math.abs(Math.round(diff % 60));
    hours = Math.abs(Math.round(diff / 60));
    str = `${hours}h ${minutes}m`;
  }
  if (hours > 24) {
    days = Math.abs(Math.round(hours / 24));
    hours = Math.abs(Math.round(hours % 24));
    str = `${days}d ${hours}h`;
  }
  return str;
}
