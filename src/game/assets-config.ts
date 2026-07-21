export const SYMBOLS = [
  'octopus', 'crab', 'clownfish', 'surgeonfish', 'jellyfish',
  'turtle', 'seahorse', 'stingray', 'lobster', 'starfish',
  'whale', 'pufferfish', 'shark', 'eel',
] as const;

export type SymbolKey = typeof SYMBOLS[number];