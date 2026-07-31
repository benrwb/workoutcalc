
/**
 * Machine stack lookup tables (lbs -> rounded kg)
 */
const MACHINE_STACKS = {
  step15: [5, 11, 18, 25, 32, 39, 45, 52, 59, 66, 73, 79, 86, 93, 100],
  step10: [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59, 64, 68]
};

// 2. Map exercises/machines to their respective stack type
export const MACHINE_LOOKUP = { // Record<string, string>
  // 15lb machines
  'converging chest press machine': 'step15',
  'leg press machine':              'step15',
  'seated leg curl machine':        'step15',
  'leg extension machine':          'step15',
  'calf press machine':             'step15',

  // 10lb machines
  'diverging seated row machine':   'step10',
  'diverging lat pulldown machine': 'step10',
  'lateral raise machine':          'step10',
  'arm curl machine':               'step10',
  'triceps extension machine':      'step10',
  'ab crunch machine':              'step10',
};

/**
 * Calculates the next or previous weight on a pin-loaded gym machine.
 * 
 * @param {number} currentKg - The current weight in kilograms.
 * @param {Object} [options] - Configuration options.
 * @param {'up'|'down'} [options.direction='up'] - Direction to move.
 * @param {'step15'|'step10'|number[]} [options.machine='step15'] - Machine profile key or custom stack array.
 * @returns {number} Target weight in kilograms.
 */
export function getNextWeight(currentKg, { direction = 'up', machine = 'step15' } = {}) {
  // Resolve stack: accepts either a predefined string key or a custom array
  const baseWeightsKg = Array.isArray(machine) 
    ? machine 
    : (MACHINE_STACKS[machine] || MACHINE_STACKS.step15);

  // Step 1: Strip small adder plates by snapping down to the nearest base weight
  const validBaseWeights = baseWeightsKg.filter(weight => weight <= currentKg);
  
  if (validBaseWeights.length === 0) {
    return baseWeightsKg[0];
  }

  const currentBase = Math.max(...validBaseWeights);
  const currentIndex = baseWeightsKg.indexOf(currentBase);

  // Step 2: Determine next weight up or down
  if (direction === 'down') {
    const prevIndex = Math.max(0, currentIndex - 1);
    return baseWeightsKg[prevIndex];
  } else {
    const nextIndex = Math.min(baseWeightsKg.length - 1, currentIndex + 1);
    return baseWeightsKg[nextIndex];
  }
}