/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum BlockType {
  AIR = 0,
  GRASS = 1,       // Lime grass (lime TV static)
  WOOD = 2,        // Wood (brown TV static)
  STONE = 3,       // Stone (grayer slate style, less TV static contrast)
  COBBLESTONE = 4, // Cobblestone (gray with cracks)
  MOSSY_COBBLE = 5,// Mossy cobblestone (cobblestone with moss)
  LEAVES = 6,      // Leaves (lime grass feel, highly lime, with transparent holes)
  CRAFT_TABLE = 7, // Craft table (workshop table with 9 squares on top)
  BRICK = 8,       // Reddish baked clay brick grid block
  CHEST = 9,       // Brown wood chest container block (can open)
  CABINET = 10,    // White cabinet block with a front door (can open)
  MEAT = 11,        // Juicy infinite survival roast steak item
  DIAMOND = 12,     // Blue, shiny glass-like transparent block
  DIAMOND_ITEM = 13, // High-value shiny diamond item for crafting
  BIRCH = 14,       // White block with black spots bark wood
  BED = 15,          // Red cozy quilted bed with white pillow
  DIRT_PATH = 16,    // Crazy-looking yellow path, one pixel smaller than others
  RUOTK = 17,        // Secret portal block with a decaying dark pattern
  WATER = 18,         // Pure blue transparent static water block
  GOLD_SHARD = 19,    // Shiny pixelated gold shard item
  GOLD_BLOCK = 20,     // Prestigious solid gold block
  SAND = 21,          // Yellow gold sand block
  COCONUT = 22,       // Brown coconut block
  COCONUT_MILK = 23,  // White coconut milk liquid item
  EMERALD = 24,       // Green, highly shiny, transparent emerald block
  THICK_WOOD = 25     // Very thick textured wood block
}

export interface BlockConfig {
  type: BlockType;
  name: string;
  color: string; // Fallback CSS color
  description: string;
  isTransparent?: boolean;
}

export type WorldData = Record<string, BlockType>;

export interface GameSettings {
  renderDistance: number; // radius in chunks
  fov: number;
  flyMode: boolean;
  gravity: boolean;
  wireframe: boolean;
  soundEnabled: boolean;
  showCoordinates: boolean;
  autoSave: boolean;
  flatWorld: boolean;
  infiniteBlocks: boolean; // Infinite materials toggle
  hardTexturePack: boolean; // Hard core texture pack!
}

export const BLOCKS: Record<BlockType, BlockConfig> = {
  [BlockType.AIR]: {
    type: BlockType.AIR,
    name: 'Air',
    color: 'transparent',
    description: 'Empty space'
  },
  [BlockType.GRASS]: {
    type: BlockType.GRASS,
    name: 'Lime Grass',
    color: '#32CD32',
    description: 'Lime-colored TV static grass block'
  },
  [BlockType.WOOD]: {
    type: BlockType.WOOD,
    name: 'Wood',
    color: '#8B4513',
    description: 'Brown TV static wood trunk block'
  },
  [BlockType.STONE]: {
    type: BlockType.STONE,
    name: 'Stone',
    color: '#707070',
    description: 'Muted slate grey stone block'
  },
  [BlockType.COBBLESTONE]: {
    type: BlockType.COBBLESTONE,
    name: 'Cobblestone',
    color: '#707070',
    description: 'Gray block with distinct cracks'
  },
  [BlockType.MOSSY_COBBLE]: {
    type: BlockType.MOSSY_COBBLE,
    name: 'Mossy Cobblestone',
    color: '#556B2F',
    description: 'Cobblestone with lime-green moss growing on it'
  },
  [BlockType.LEAVES]: {
    type: BlockType.LEAVES,
    name: 'Leaves',
    color: '#00FF00',
    description: 'Highly lime leaves with transparent holes',
    isTransparent: true
  },
  [BlockType.CRAFT_TABLE]: {
    type: BlockType.CRAFT_TABLE,
    name: 'Crafting Table',
    color: '#A0522D',
    description: 'Workshop table with 9 squares on top'
  },
  [BlockType.BRICK]: {
    type: BlockType.BRICK,
    name: 'Brick',
    color: '#B22222',
    description: 'Red brick block with linear gray mortar gaps'
  },
  [BlockType.CHEST]: {
    type: BlockType.CHEST,
    name: 'Chest',
    color: '#8B5A2B',
    description: 'Rustic wooden storage chest'
  },
  [BlockType.CABINET]: {
    type: BlockType.CABINET,
    name: 'Cabinet',
    color: '#F5F5F5',
    description: 'White cabinet storage cupboard with front door handle'
  },
  [BlockType.MEAT]: {
    type: BlockType.MEAT,
    name: 'Steak Meat',
    color: '#CD5C5C',
    description: 'Juicy survival steak. Automatically infinite!'
  },
  [BlockType.DIAMOND]: {
    type: BlockType.DIAMOND,
    name: 'Diamond Block',
    color: '#38bdf8',
    description: 'A blue, shiny, transparent diamond structure block! Very weird, crazy, and beautiful.',
    isTransparent: true
  },
  [BlockType.DIAMOND_ITEM]: {
    type: BlockType.DIAMOND_ITEM,
    name: 'Diamond Item',
    color: '#0ea5e9',
    description: 'A beautiful, shiny, weird-looking diamond gemstone. Perfect for forging diamond blocks!'
  },
  [BlockType.BIRCH]: {
    type: BlockType.BIRCH,
    name: 'Birch Wood',
    color: '#f3f4f6',
    description: 'A beautiful white birch wood block scattered with horizontal black spots.'
  },
  [BlockType.BED]: {
    type: BlockType.BED,
    name: 'Cozy Bed',
    color: '#ef4444',
    description: 'A cozy red bed with a soft white pillow. Click to fall asleep and dream details...'
  },
  [BlockType.DIRT_PATH]: {
    type: BlockType.DIRT_PATH,
    name: 'dirt path',
    color: '#eab308',
    description: 'A crazy-looking yellow path, which is one pixel smaller than the other blocks.'
  },
  [BlockType.RUOTK]: {
    type: BlockType.RUOTK,
    name: 'ruotk',
    color: '#3f3f46',
    description: 'A decaying, dark-veined stone block. If you place 10-12 of these in a frame, they form a portal to a rotting hidden dimension...'
  },
  [BlockType.WATER]: {
    type: BlockType.WATER,
    name: 'Water Block',
    color: '#3b82f6',
    description: 'A blue, transparent TV static water block. It spills everywhere when placed! Pure chaos.',
    isTransparent: true
  },
  [BlockType.GOLD_SHARD]: {
    type: BlockType.GOLD_SHARD,
    name: 'Gold Shard',
    color: '#fbbf24',
    description: 'A pixelated 8x8 shard of raw gold. Infinite in inventory! Combine 9 of these to craft a Gold Block.'
  },
  [BlockType.GOLD_BLOCK]: {
    type: BlockType.GOLD_BLOCK,
    name: 'Block of Gold',
    color: '#f59e0b',
    description: 'A heavy, solid block of pure gold. Shiny and prestigious!'
  },
  [BlockType.SAND]: {
    type: BlockType.SAND,
    name: 'Sandy Beach',
    color: '#fef08a',
    description: 'A glowing, beautiful mono-yellow TV static beach sand block.'
  },
  [BlockType.COCONUT]: {
    type: BlockType.COCONUT,
    name: 'Coconut Block',
    color: '#5c2d11',
    description: 'A dark, textured brown coconut block. Break it to retrieve fresh coconut milk!'
  },
  [BlockType.COCONUT_MILK]: {
    type: BlockType.COCONUT_MILK,
    name: 'Coconut Milk',
    color: '#f1f5f9',
    description: 'Sweet coconut milk. It looks like a beautiful white liquid drawn in a coconut-shell bowl!',
    isTransparent: true
  },
  [BlockType.EMERALD]: {
    type: BlockType.EMERALD,
    name: 'Emerald Block',
    color: '#10b981',
    description: 'A green, highly shiny, and transparent emerald block. It has 70% transparency!',
    isTransparent: true
  },
  [BlockType.THICK_WOOD]: {
    type: BlockType.THICK_WOOD,
    name: 'Thick Wood',
    color: '#78350f',
    description: 'A very, very thick dark wood block. Beautifully rustic.'
  }
};
