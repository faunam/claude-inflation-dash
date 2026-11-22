// Small line icons for the everyday-prices chart. They draw in currentColor,
// so each one takes the color of its series.
const svg = (body) =>
  `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  // Fuel pump with a hose and nozzle.
  gas: svg(
    '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h12"/><rect x="6.5" y="5.5" width="5" height="4" rx="0.5"/>' +
      '<path d="M14 9h1.5a2 2 0 0 1 2 2v5.5a1.5 1.5 0 0 0 3 0V8.5L18 6"/>',
  ),
  // Loaf of bread with score marks.
  bread: svg(
    '<path d="M5 20V11.5A4 4 0 0 1 3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5 4 4 0 0 1-2 3.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z"/>' +
      '<path d="M9 10l2 2M12 9l2 2"/>',
  ),
  // A single curved banana with its stem.
  banana: svg(
    '<path d="M4.5 7C4 14.5 9 20.5 16 20.5c2 0 3.6-.6 4.5-1.5-4.5-.5-10-4-12-12Z"/>' +
      '<path d="M4.5 7 4 4h3l1 3"/><path d="M7 9.5c1.5 5 5 8.5 10 10"/>',
  ),
};
