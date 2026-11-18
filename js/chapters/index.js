// The box and its chapters, in reading order.
import stack from './stack.js';
import sense from './sense.js';
import locate from './locate.js';
import fail from './fail.js';
import resistive from './resistive.js';
import other from './other.js';

export const BOX = { slug: 'touchscreenclear', title: "TouchscreenClear" };
export const CHAPTERS = [stack, sense, locate, fail, resistive, other];
