/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockType, WorldData } from '../types';

/**
 * Procedurally generates a 3D block database.
 * @param flatWorld If true, generates a completely flat plain of Lime Grass.
 * @param treeDensity Chance of a tree spawning on any given Grass block.
 * @param size The width/length of the active sector (centered around 0,0)
 */
export function generateWorld(flatWorld = false, treeDensity = 0.02, size = 48, seedType: number = 1): WorldData {
  const world: WorldData = {};
  const halfSize = Math.floor(size / 2);
  
  // Height constants
  const baseHeight = 6;
  const terrainAmplitude = 5;

  // Let's first generate the landscape (Grass layers, Stone base, Cobblestone pockets)
  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      // 1. Calculate terrain height at (x, z)
      let height = baseHeight;
      const isActuallyFlat = flatWorld || seedType === 3;
      if (seedType === 5) {
        const cx = Math.floor(x / 16);
        const cz = Math.floor(z / 16);
        const px = cx * 16 + 8;
        const pz = cz * 16 + 8;
        const d = Math.abs(x - px) + Math.abs(z - pz);
        height = Math.max(2, 14 - d);
      } else if (!isActuallyFlat) {
        // Multi-frequency wave formula for highly natural grassy rolling hills
        const wave1 = Math.sin(x * 0.07) * Math.cos(z * 0.07);
        const wave2 = Math.sin(x * 0.15 + 1.2) * Math.cos(z * 0.23);
        height = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
      }
      
      // Prevent going below ground boundaries (keep a minimum height of 2 to place blocks safely)
      height = Math.max(2, height);

      // 2. Fill columns vertically
      for (let y = 0; y <= height; y++) {
        const key = `${x},${y},${z}`;

        if (y === height) {
          // Top layer: Lime Grass
          world[key] = BlockType.GRASS;
        } else if (y >= height - 2) {
          // Sub-surface layers: Mostly Stone, but 10% chance of Cobblestone pockets
          const rand = Math.random();
          if (rand < 0.08) {
            world[key] = BlockType.COBBLESTONE;
          } else if (rand < 0.12) {
            world[key] = BlockType.MOSSY_COBBLE;
          } else {
            world[key] = BlockType.STONE;
          }
        } else {
          // Deep layers: Solid Stone (with occasional deep pockets of Cobble / Mossy Cobble)
          const rand = Math.random();
          if (rand < 0.05) {
            world[key] = BlockType.COBBLESTONE;
          } else if (rand < 0.03) {
            world[key] = BlockType.MOSSY_COBBLE;
          } else {
            world[key] = BlockType.STONE;
          }
        }
      }
    }
  }

  // 3. Populate trees (Scatter them procedurally on top of grass)
  // To avoid placing trees too close together, we do a randomized grid grid-search
  if (seedType === 5) {
    // Generate a tree exactly on top of every 16x16 pyramid cell
    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        const px = cx * 16 + 8;
        const pz = cz * 16 + 8;
        if (px >= -halfSize && px < halfSize && pz >= -halfSize && pz < halfSize) {
          generateTree(world, px, 15, pz, BlockType.WOOD, BlockType.LEAVES);
        }
      }
    }
  } else {
    for (let x = -halfSize + 2; x < halfSize - 2; x++) {
      for (let z = -halfSize + 2; z < halfSize - 2; z++) {
        // If seedType is 2 (neighborhood), we check house exclusion boundaries to avoid building trees in/around houses
        if (seedType === 2) {
          // Find chunk coordinates and center house coordinate to avoid tree collisions
          const cx = Math.floor(x / 16);
          const cz = Math.floor(z / 16);
          const isHouseChunk = (cx !== 0 || cz !== 0) && (Math.abs(cx * 17 + cz * 31) % 4 === 1);
          if (isHouseChunk) {
            const hx = cx * 16 + 8;
            const hz = cz * 16 + 8;
            if (Math.abs(x - hx) <= 4 && Math.abs(z - hz) <= 4) {
              continue;
            }
          }
        }

        // Calculate height at surface
        let height = baseHeight;
        const isActuallyFlat = flatWorld || seedType === 3;
        if (!isActuallyFlat) {
          const wave1 = Math.sin(x * 0.07) * Math.cos(z * 0.07);
          const wave2 = Math.sin(x * 0.15 + 1.2) * Math.cos(z * 0.23);
          height = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
        }
        height = Math.max(2, height);

        // Ensure block below is Grass and we don't have block overlap
        const surfaceKey = `${x},${height},${z}`;
        if (world[surfaceKey] === BlockType.GRASS) {
          // Probability check for tree
          const actualTreeDensity = seedType === 3 ? 0.04 : treeDensity;
          if (Math.random() < actualTreeDensity) {
            // Make sure tree isn't right next to another tree in this scan
            let nearbyTree = false;
            for (let dx = -2; dx <= 2; dx++) {
              for (let dz = -2; dz <= 2; dz++) {
                if (dx === 0 && dz === 0) continue;
                const trunkCheck = `${x + dx},${height + 1},${z + dz}`;
                if (world[trunkCheck] === BlockType.WOOD || world[trunkCheck] === BlockType.BIRCH) {
                  nearbyTree = true;
                  break;
                }
              }
            }

            if (!nearbyTree) {
              const woodType = Math.random() < 0.35 ? BlockType.BIRCH : BlockType.WOOD;
              generateTree(world, x, height + 1, z, woodType);
            }
          }
        }
      }
    }
  }

  // For seedType 2, trigger houses generation within the initial grid bounds manually as well
  if (seedType === 2) {
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        const isHouseChunk = (cx !== 0 || cz !== 0) && (Math.abs(cx * 17 + cz * 31) % 4 === 1);
        if (isHouseChunk) {
          const hx = cx * 16 + 8;
          const hz = cz * 16 + 8;
          let hy = baseHeight;
          if (!flatWorld) {
            const wave1 = Math.sin(hx * 0.07) * Math.cos(hz * 0.07);
            const wave2 = Math.sin(hx * 0.15 + 1.2) * Math.cos(hz * 0.23);
            hy = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
          }
          hy = Math.max(2, hy);
          generateHouse(world, hx, hy, hz);
        }
      }
    }
  } else if (seedType === 1) {
    // 4. Place a small circular set of Cobblestone and Mossy Cobblestone ruins near spawning ground [0, Y, 0]
    // This guarantees immediate access to visual showcase of mossy / cracked stone blocks without searching!
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const rx = Math.round(Math.cos(angle) * 6);
      const rz = Math.round(Math.sin(angle) * 6);
      
      let hy = baseHeight;
      if (!flatWorld) {
        const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
        const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
        hy = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
      }
      hy = Math.max(2, hy);
 
      // Place some mossy / cobblestone rocks on the surface
      const rockKey1 = `${rx},${hy + 1},${rz}`;
      const rockKey2 = `${rx},${hy + 2},${rz}`;
      world[rockKey1] = Math.random() > 0.4 ? BlockType.MOSSY_COBBLE : BlockType.COBBLESTONE;
      if (Math.random() > 0.5) {
        world[rockKey2] = Math.random() > 0.5 ? BlockType.MOSSY_COBBLE : BlockType.COBBLESTONE;
      }
    }
  }

  return world;
}

/**
 * Builds a custom curved coconut tree block (wood trunk, leaves, with coconut hanging blocks).
 */
function generateCoconutTree(
  world: WorldData,
  startX: number,
  startY: number,
  startZ: number
) {
  // Curved trunk to look like a styled island palm tree
  world[`${startX},${startY},${startZ}`] = BlockType.WOOD;
  world[`${startX},${startY+1},${startZ}`] = BlockType.WOOD;
  world[`${startX+1},${startY+2},${startZ}`] = BlockType.WOOD;
  world[`${startX+1},${startY+3},${startZ}`] = BlockType.WOOD;
  world[`${startX+2},${startY+4},${startZ}`] = BlockType.WOOD;

  const topX = startX + 2;
  const topY = startY + 4;
  const topZ = startZ;

  // Palm leaves hanging out from topY + 1 (canopy)
  const leafY = topY + 1;
  world[`${topX},${leafY},${topZ}`] = BlockType.LEAVES;

  // Main direction branches
  world[`${topX},${leafY},${topZ-1}`] = BlockType.LEAVES;
  world[`${topX},${leafY},${topZ-2}`] = BlockType.LEAVES;
  world[`${topX},${leafY-1},${topZ-3}`] = BlockType.LEAVES;

  world[`${topX},${leafY},${topZ+1}`] = BlockType.LEAVES;
  world[`${topX},${leafY},${topZ+2}`] = BlockType.LEAVES;
  world[`${topX},${leafY-1},${topZ+3}`] = BlockType.LEAVES;

  world[`${topX+1},${leafY},${topZ}`] = BlockType.LEAVES;
  world[`${topX+2},${leafY},${topZ}`] = BlockType.LEAVES;
  world[`${topX+3},${leafY-1},${topZ}`] = BlockType.LEAVES;

  world[`${topX-1},${leafY},${topZ}`] = BlockType.LEAVES;
  world[`${topX-2},${leafY},${topZ}`] = BlockType.LEAVES;
  world[`${topX-3},${leafY-1},${topZ}`] = BlockType.LEAVES;

  // Diagonals for canopy fullness
  world[`${topX+1},${leafY},${topZ+1}`] = BlockType.LEAVES;
  world[`${topX-1},${leafY},${topZ-1}`] = BlockType.LEAVES;
  world[`${topX+1},${leafY},${topZ-1}`] = BlockType.LEAVES;
  world[`${topX-1},${leafY},${topZ+1}`] = BlockType.LEAVES;

  // Place coconut blocks hanging directly under the leaf canopy
  world[`${topX-1},${topY},${topZ}`] = BlockType.COCONUT;
  world[`${topX+1},${topY},${topZ}`] = BlockType.COCONUT;
  world[`${topX},${topY},${topZ-1}`] = BlockType.COCONUT;
  world[`${topX},${topY},${topZ+1}`] = BlockType.COCONUT;
}

/**
 * Builds a Minecraft-style tree made of wood logs and lime leaves.
 */
function generateTree(
  world: WorldData,
  startX: number,
  startY: number,
  startZ: number,
  woodType: BlockType = BlockType.WOOD,
  leafType: BlockType = BlockType.LEAVES
) {
  const trunkHeight = 4 + Math.floor(Math.random() * 3); // 4 to 6 logs high
  
  // 1. Build trunk
  for (let cy = 0; cy < trunkHeight; cy++) {
    const key = `${startX},${startY + cy},${startZ}`;
    world[key] = woodType;
  }

  // 2. Build leafy foliage canopy on top
  // Canopy top is at startY + trunkHeight - 1
  const canopyCenterY = startY + trunkHeight - 1;

  for (let dy = -2; dy <= 2; dy++) {
    const cy = canopyCenterY + dy;
    let leafRadius = 2; // Default fat leaf block
    
    if (dy === 2) {
      leafRadius = 1; // Tapered top of the tree
    } else if (dy < 0) {
      leafRadius = 2; // Flat base leaves
    } else if (dy === 1) {
      leafRadius = 1.8; // Rounded upper leaves
    }

    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        // Calculate horizontal Manhattan or Euclidean distance to keep nodes rounder
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= leafRadius + Math.random() * 0.3) {
          const leafX = startX + dx;
          const leafZ = startZ + dz;
          const key = `${leafX},${cy},${leafZ}`;

          // Only replace air, never chop trunk wood
          if (!world[key] || (world[key] as any) === BlockType.AIR) {
            world[key] = leafType;
          }
        }
      }
    }
  }

  // Top leaf cap
  const topKey = `${startX},${canopyCenterY + 3},${startZ}`;
  world[topKey] = leafType;
  const topKeyN = `${startX},${canopyCenterY + 3},${startZ - 1}`;
  world[topKeyN] = leafType;
  const topKeyS = `${startX},${canopyCenterY + 3},${startZ + 1}`;
  world[topKeyS] = leafType;
  const topKeyE = `${startX + 1},${canopyCenterY + 3},${startZ}`;
  world[topKeyE] = leafType;
  const topKeyW = `${startX - 1},${canopyCenterY + 3},${startZ}`;
  world[topKeyW] = leafType;
}

/**
 * Procedurally generates a single 16x16 chunk at (cx, cz).
 * Adds new blocks to the global world dictionary only if those coordinates are unassigned,
 * preserving pre-existing blocks (like foliage overflows or player modifications).
 */
export function generateChunk(
  world: Record<string, BlockType>,
  cx: number,
  cz: number,
  flatWorld = false,
  treeDensity = 0.02,
  seedType: number = 1,
  isDreaming = false,
  isRottingDimension = false,
  seedString = '777123',
  customParams?: any
) {
  const chunkSize = 16;
  const startX = cx * chunkSize;
  const startZ = cz * chunkSize;
  
  let baseHeight = 6;
  let terrainAmplitude = 5;

  // Check if seed String is "cat" or "842" or "133"
  const cleanSeedStr = (seedString || '').trim().toLowerCase();
  const isCatSeed = cleanSeedStr === 'cat';
  const isFloatingIslandSeed = cleanSeedStr === '842' || seedType === 842;
  const isTealFlatSeed = cleanSeedStr === '133' || seedType === 133;
  const isIslandSeed = cleanSeedStr === '143' || seedType === 143;
  const isDarkBlueBirchSeed = cleanSeedStr === '233' || seedType === 233;
  
  // Choose seed type
  let activeSeedType = seedType;
  if (isCatSeed) {
    activeSeedType = 1; // Norm world base
  } else if (isFloatingIslandSeed) {
    activeSeedType = 842; // Floating islands base
  } else if (isTealFlatSeed) {
    activeSeedType = 133; // Teal flat base
  } else if (isIslandSeed) {
    activeSeedType = 143; // Coconut island base
  } else if (isDarkBlueBirchSeed) {
    activeSeedType = 233; // Dark Blue Birch Floating Islands base
  }

  // Calculate customizable seed mathematical offsets
  let seedOffsetVal = 0;
  if (seedString && seedString !== '777123') {
    for (let i = 0; i < seedString.length; i++) {
       seedOffsetVal = (seedOffsetVal * 31 + seedString.charCodeAt(i)) | 0;
    }
  }
  const seedOffsetX = (Math.sin(seedOffsetVal) * 24681.35) % 30000;
  const seedOffsetZ = (Math.cos(seedOffsetVal + 1) * 13579.24) % 30000;

  // Custom AI seed generators parameters override!
  let spawnBlock = BlockType.GRASS;
  let foundationBlock = BlockType.STONE;
  let leafBlock = BlockType.LEAVES;
  let trunkBlock = BlockType.WOOD;
  let useTreeDensity = treeDensity;
  let customAnimHasPonds = true;

  if (activeSeedType === 5) {
    // Pyramids blueprint has fixed heights
  } else if (activeSeedType === 6) {
    // Seed 6 Secret: Galactic Crystal Peak
    spawnBlock = BlockType.DIAMOND;
    foundationBlock = BlockType.GOLD_BLOCK;
    leafBlock = BlockType.DIAMOND;
    trunkBlock = BlockType.BIRCH;
    baseHeight = 10;
    terrainAmplitude = 12;
    useTreeDensity = 0.04;
  } else if (activeSeedType === 133) {
    // Seed 133: Flat Birch and Teal Skies
    spawnBlock = BlockType.GRASS;
    foundationBlock = BlockType.STONE;
    leafBlock = BlockType.LEAVES;
    trunkBlock = BlockType.BIRCH;
    baseHeight = 6;
    terrainAmplitude = 0;
    useTreeDensity = 0.015;
    customAnimHasPonds = false;
  } else if (activeSeedType === 143) {
    // Seed 143: Coconut Island
    spawnBlock = BlockType.GRASS;
    foundationBlock = BlockType.STONE;
    leafBlock = BlockType.LEAVES;
    trunkBlock = BlockType.WOOD;
    baseHeight = 6;
    terrainAmplitude = 3;
    useTreeDensity = 0.0; // hand-spawn our unique tree only
    customAnimHasPonds = false;
  } else if (activeSeedType === 233) {
    // Seed 233: Birch trees, floating islands, dark blue sky
    spawnBlock = BlockType.GRASS;
    foundationBlock = BlockType.STONE;
    leafBlock = BlockType.LEAVES;
    trunkBlock = BlockType.BIRCH;
    baseHeight = 18; // Make starting surface of floating islands taller (like 18)
    terrainAmplitude = 3.5;
    useTreeDensity = 0.03; // Birch tree density
    customAnimHasPonds = false;
  }

  if (customParams) {
    if (customParams.spawnBlock !== undefined) spawnBlock = customParams.spawnBlock;
    if (customParams.foundationBlock !== undefined) foundationBlock = customParams.foundationBlock;
    if (customParams.leafType !== undefined) leafBlock = customParams.leafType;
    if (customParams.treeType !== undefined) trunkBlock = customParams.treeType;
    if (customParams.amplitude !== undefined) terrainAmplitude = customParams.amplitude;
    if (customParams.baseHeight !== undefined) baseHeight = customParams.baseHeight;
    if (customParams.treeDensity !== undefined) useTreeDensity = customParams.treeDensity;
    if (customParams.hasPonds !== undefined) customAnimHasPonds = customParams.hasPonds;
  }

  // Under the Hard Texture Pack, naturally grown tree leaves also look exactly like Emerald blocks!
  const customIsHardPack = (customParams && customParams.hardTexturePack);
  if (customIsHardPack) {
    leafBlock = BlockType.EMERALD;
  }

  // Detect GLITCHY DEATH LANDS (X or Z coordinate exceeds 900,000)
  const isDeathLands = Math.abs(startX) > 900000 || Math.abs(startZ) > 900000;

  if (isDeathLands) {
    // Generate massive glitched terrain wall (from Y=1 to Y=48) filled with random blocks but with giant hollowed-out holes/caves
    for (let x = startX; x < startX + chunkSize; x++) {
      for (let z = startZ; z < startZ + chunkSize; z++) {
        // Bedrock
        const bedrockKey = `${x},0,${z}`;
        if (world[bedrockKey] === undefined) {
          world[bedrockKey] = BlockType.STONE;
        }

        for (let y = 1; y <= 48; y++) {
          const key = `${x},${y},${z}`;
          if (world[key] !== undefined) continue;

          // Deterministic 3D noise/sine wave combination to carve massive holes
          const n3d = Math.sin(x * 0.12) * Math.sin(y * 0.15) * Math.sin(z * 0.12) +
                      Math.cos(x * 0.05) * Math.cos(y * 0.06) * Math.cos(z * 0.05) +
                      Math.sin(y * 0.25) * 0.3;

          // If the noise value is higher than -0.15, place a block. Otherwise, leave it as empty AIR cave.
          if (n3d > -0.15) {
            // Pick a block type pseudorandomly based on coordinate hash
            const blockHash = Math.abs(Math.sin(x * 7.1 + y * 13.3 + z * 19.9) * 43758.54) % 1;
            
            if (blockHash < 0.25) {
              world[key] = BlockType.GRASS;
            } else if (blockHash < 0.45) {
              world[key] = BlockType.BRICK;
            } else if (blockHash < 0.60) {
              world[key] = BlockType.WOOD;
            } else if (blockHash < 0.72) {
              world[key] = BlockType.BIRCH;
            } else if (blockHash < 0.85) {
              world[key] = BlockType.STONE;
            } else if (blockHash < 0.94) {
              world[key] = BlockType.COBBLESTONE;
            } else if (blockHash < 0.97) {
              world[key] = BlockType.LEAVES;
            } else if (blockHash < 0.98) {
              world[key] = BlockType.CRAFT_TABLE;
            } else if (blockHash < 0.99) {
              world[key] = BlockType.CHEST;
            } else {
              world[key] = BlockType.CABINET;
            }
          }
        }
      }
    }
    return;
  }

  const isVillageBiome = activeSeedType === 4;
  const isHouseChunk = (activeSeedType === 2 && (cx !== 0 || cz !== 0) && (Math.abs(cx * 17 + cz * 31) % 4 === 1)) ||
                      (isVillageBiome && (cx !== 0 || cz !== 0) && (Math.abs(cx) % 2 === 0 && Math.abs(cz) % 2 === 0));

  // 1. Generate columns
  for (let x = startX; x < startX + chunkSize; x++) {
    for (let z = startZ; z < startZ + chunkSize; z++) {
      let height = baseHeight;
      const isActuallyFlat = flatWorld || activeSeedType === 3 || activeSeedType === 133;
      
      const rx = x + seedOffsetX;
      const rz = z + seedOffsetZ;

      if (isDreaming) {
        // Slow rolling sweet sleepy waves of height 10-18 for dream worlds
        const wave1 = Math.sin(rx * 0.05) * Math.cos(rz * 0.05);
        const wave2 = Math.cos(rx * 0.1) * Math.sin(rz * 0.1);
        height = Math.floor(12 + wave1 * 5 + wave2 * 2.5);
      } else if (activeSeedType === 5) {
        const px = cx * 16 + 8;
        const pz = cz * 16 + 8;
        const d = Math.abs(x - px) + Math.abs(z - pz);
        height = Math.max(2, 14 - d);
      } else if (activeSeedType === 842 || activeSeedType === 233) {
        // Base coordinate of floating islands
        const islandTopWave = Math.sin(rx * 0.1) * Math.cos(rz * 0.1) * 3.5;
        height = Math.floor(18 + islandTopWave);
      } else if (activeSeedType === 143) {
        // Seed 143: Coconut Island with Teal Skies and Beach Sand shorelines
        // We use true coordinates (x, z) for centering the island at (0, 0)
        const distFromSpawn = Math.sqrt(x * x + z * z);
        if (distFromSpawn < 18) {
          // Inner rolling smooth island hills
          const wave = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.8;
          height = Math.floor(7 + wave);
        } else if (distFromSpawn < 28) {
          // Beach gradient descending smoothly to water level (5)
          const t = (distFromSpawn - 18) / 10;
          const wave = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.8;
          const startH = 7 + wave;
          const beachH = 4.2; // sea level is 5, sand drops to 4.2
          height = Math.floor(startH * (1 - t) + beachH * t);
        } else {
          // Submerged sea floor
          const wave = Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.4;
          const oceanH = 2.2;
          height = Math.floor(oceanH + wave);
        }
      } else if (!isActuallyFlat) {
        const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
        const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
        height = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
      }
      height = Math.max(2, height);

      // Bedrock layer
      const bedrockKey = `${x},0,${z}`;
      if (world[bedrockKey] === undefined) {
        world[bedrockKey] = isDreaming ? BlockType.DIAMOND : (isRottingDimension ? BlockType.RUOTK : BlockType.STONE);
      }

      // Generate dynamic island density
      const islandX = rx + 3381;
      const islandZ = rz + 1851;
      const islandNoise = Math.sin(islandX * 0.06) * Math.cos(islandZ * 0.06) + Math.cos(islandX * 0.02) * Math.sin(islandZ * 0.02);
      const isOceanVoid = (activeSeedType === 842 || activeSeedType === 233) && islandNoise <= -0.15;

      const maxColY = activeSeedType === 143 ? Math.max(5, height) : height;
      for (let y = 1; y <= maxColY; y++) {
        const key = `${x},${y},${z}`;
        if (world[key] !== undefined) continue;

        // For seed 143, fill any air blocks under water level (Y=5) with ocean water
        if (y > height) {
          if (activeSeedType === 143 && y <= 5) {
            world[key] = BlockType.WATER;
          }
          continue;
        }

        // In active floating islands (Seed 842 or 233), we carve out everything below the island body!
        if (activeSeedType === 842 || activeSeedType === 233) {
          if (isOceanVoid) {
            world[key] = BlockType.AIR;
            continue;
          }
          // The island tapering bottom structure
          const bottomY = Math.floor(12 + (1.0 - (islandNoise + 0.15) * 1.8) * 8);
          if (y < bottomY) {
            world[key] = BlockType.AIR;
            continue;
          }
        }

        // In the rotting dimension, introduce a 12% probability of blocks deteriorating into air voids!
        if (isRottingDimension && y >= 1) {
          const decayHash = Math.abs(Math.sin(x * 12.98 + y * 54.32 + z * 78.23)) % 1;
          if (decayHash < 0.12) {
            world[key] = BlockType.AIR;
            continue;
          }
        }

        if (y === height) {
          if (activeSeedType === 143) {
            const distFromSpawn = Math.sqrt(x * x + z * z);
            if (distFromSpawn < 18) {
              world[key] = BlockType.GRASS;
            } else {
              world[key] = BlockType.SAND; // Sandy shore beach and sea floor template
            }
          } else if (isDreaming) {
            // Dream landscape covered with diamond, bed quilt and grass blocks
            const coordHash = Math.abs(Math.sin(x * 12.98 + z * 78.23) * 4375) % 1;
            if (coordHash < 0.18) {
              world[key] = BlockType.BED;
            } else if (coordHash < 0.45) {
              world[key] = BlockType.DIAMOND;
            } else {
              world[key] = BlockType.GRASS;
            }
          } else if (isRottingDimension) {
            // Decay gray ground in rotting dimension: mixture of cobblestone, ruins, stone
            const rotHash = Math.abs(Math.sin(x * 91.56 + z * 12.43)) % 1;
            if (rotHash < 0.35) {
              world[key] = BlockType.RUOTK;
            } else if (rotHash < 0.70) {
              world[key] = BlockType.COBBLESTONE;
            } else {
              world[key] = BlockType.STONE;
            }
          } else {
            // Check for village roads connecting neighborhoods
            const isPath = isVillageBiome && (Math.abs(x) % 16 === 8 || Math.abs(z) % 16 === 8);
            if (isPath) {
              world[key] = BlockType.DIRT_PATH;
            } else {
              world[key] = spawnBlock;
            }
          }
        } else if (y >= height - 2) {
          if (activeSeedType === 143) {
            const distFromSpawn = Math.sqrt(x * x + z * z);
            if (distFromSpawn < 18) {
              world[key] = BlockType.STONE;
            } else {
              world[key] = BlockType.SAND; // Deep sand layer under shoreline sand/beaches
            }
          } else if (isDreaming) {
            world[key] = Math.random() > 0.55 ? BlockType.BIRCH : BlockType.STONE;
          } else if (isRottingDimension) {
            const rotSub = Math.abs(Math.sin(x * 43.12 + y * 7.1 + z * 88.9)) % 1;
            world[key] = rotSub < 0.30 ? BlockType.RUOTK : BlockType.STONE;
          } else {
            const rand = Math.random();
            if (rand < 0.08) {
              world[key] = BlockType.COBBLESTONE;
            } else if (rand < 0.12) {
              world[key] = BlockType.MOSSY_COBBLE;
            } else {
              world[key] = foundationBlock;
            }
          }
        } else {
          if (isDreaming) {
            world[key] = BlockType.STONE;
          } else if (isRottingDimension) {
            world[key] = BlockType.STONE;
          } else {
            const rand = Math.random();
            if (rand < 0.05) {
              world[key] = BlockType.COBBLESTONE;
            } else if (rand < 0.03) {
              world[key] = BlockType.MOSSY_COBBLE;
            } else {
              world[key] = BlockType.STONE;
            }
          }
        }
      }
    }
  }

  // 1.3 CARVE PONDS (for normal/seed 6/custom biomes)
  const allowPonds = customParams ? customAnimHasPonds : true;
  const isPondChunk = !flatWorld && !isDreaming && !isRottingDimension && !isHouseChunk && activeSeedType !== 5 && activeSeedType !== 842 && allowPonds && (Math.abs(Math.sin(cx * 43.1 + cz * 98.7)) % 1 < 0.22); // 22% of normal chunks have a pond
  if (isPondChunk) {
    const pondCenterX = startX + 5 + Math.floor(Math.abs(Math.sin(cx * 12.3)) * 6);
    const pondCenterZ = startZ + 5 + Math.floor(Math.abs(Math.cos(cz * 45.6)) * 6);
    
    // Find height at center
    let centerHeight = baseHeight;
    const wave1 = Math.sin(pondCenterX * 0.07) * Math.cos(pondCenterZ * 0.07);
    const wave2 = Math.sin(pondCenterX * 0.15 + 1.2) * Math.cos(pondCenterZ * 0.23);
    centerHeight = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
    centerHeight = Math.max(2, centerHeight);
    
    const waterLevel = centerHeight - 1; // surface of pond is slightly set into the ground
    const radius = 3 + Math.floor(Math.abs(Math.sin(pondCenterX * 9.9)) * 3.5); // radius 3 to 6
    const depth = 2; // depth of pond is 2 blocks
    
    for (let x = startX; x < startX + chunkSize; x++) {
      for (let z = startZ; z < startZ + chunkSize; z++) {
        const dx = x - pondCenterX;
        const dz = z - pondCenterZ;
        const distSq = dx * dx + dz * dz;
        
        // Add some noise to make ponds look organic
        const noise = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.5;
        if (distSq < (radius * radius) + noise) {
          // Get surface height at x, z
          let h = baseHeight;
          const w1 = Math.sin(x * 0.07) * Math.cos(z * 0.07);
          const w2 = Math.sin(x * 0.15 + 1.2) * Math.cos(z * 0.23);
          h = Math.floor(baseHeight + w1 * terrainAmplitude + w2 * 1.5);
          h = Math.max(2, h);
          
          const startY = waterLevel - depth;
          for (let y = h; y >= startY; y--) {
            const key = `${x},${y},${z}`;
            if (y <= waterLevel) {
              world[key] = BlockType.WATER;
            } else {
              world[key] = BlockType.AIR;
            }
          }
          
          // Floor under the pond
          const floorKey = `${x},${startY - 1},${z}`;
          if (world[floorKey] === undefined || world[floorKey] === BlockType.AIR) {
            world[floorKey] = BlockType.STONE;
          }
        }
      }
    }
  }

  // 1.5 Floating cotton-candy clouds in dream skies
  if (isDreaming) {
    for (let x = startX; x < startX + chunkSize; x++) {
      for (let z = startZ; z < startZ + chunkSize; z++) {
        const cloudNoise = Math.sin(x * 0.18) * Math.cos(z * 0.18);
        if (cloudNoise > 0.6) {
          const cloudY = 20 + Math.floor((Math.sin(x * 0.4) + 1.0) * 1.2);
          const cloudKey = `${x},${cloudY},${z}`;
          if (world[cloudKey] === undefined || world[cloudKey] === BlockType.AIR) {
            world[cloudKey] = Math.random() > 0.3 ? BlockType.BIRCH : BlockType.DIAMOND;
          }
        }
      }
    }
  }

  // 2. Spawn trees deterministically using a grid-aligned pseudo-random coordinate seed
  if (activeSeedType === 143) {
    // Spawns ONE single, unique coconut tree at the island center (at coords 5, 5 in central chunk cx === 0, cz === 0)
    if (cx === 0 && cz === 0) {
      const x = 5;
      const z = 5;
      const wave = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.8;
      const calculatedHeight = Math.floor(7 + wave);
      
      generateCoconutTree(world, 5, calculatedHeight + 1, 5);
    }
  } else if (activeSeedType === 5) {
    // Spawns a tree exactly on top of the pyramid (at chunk center px, pz)
    const px = cx * 16 + 8;
    const pz = cz * 16 + 8;
    generateTree(world, px, 15, pz, BlockType.WOOD, BlockType.LEAVES);
  } else {
    for (let x = startX + 2; x < startX + chunkSize - 2; x++) {
      for (let z = startZ + 2; z < startZ + chunkSize - 2; z++) {
        // If a house is present in this chunk, skip generating trees on top of or near the house footprint
        if (isHouseChunk) {
          const hx = cx * 16 + 8;
          const hz = cz * 16 + 8;
          if (Math.abs(x - hx) <= 4 && Math.abs(z - hz) <= 4) {
            continue;
          }
        }

        let height = baseHeight;
        const isActuallyFlat = flatWorld || activeSeedType === 3 || activeSeedType === 133;
        
        const rx = x + seedOffsetX;
        const rz = z + seedOffsetZ;

        if (isDreaming) {
          const wave1 = Math.sin(rx * 0.05) * Math.cos(rz * 0.05);
          const wave2 = Math.cos(rx * 0.1) * Math.sin(rz * 0.1);
          height = Math.floor(12 + wave1 * 5 + wave2 * 2.5);
        } else if (activeSeedType === 842 || activeSeedType === 233) {
          const islandTopWave = Math.sin(rx * 0.1) * Math.cos(rz * 0.1) * 3.5;
          height = Math.floor(18 + islandTopWave);
        } else if (!isActuallyFlat) {
          const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
          const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
          height = Math.floor(baseHeight + terrainAmplitude * wave1 + wave2 * 1.5);
        }
        height = Math.max(2, height);

        const surfaceKey = `${x},${height},${z}`;
        
        // In floating islands, avoid placing trees where voids exist
        const islandX = rx + 3381;
        const islandZ = rz + 1851;
        const islandNoise = Math.sin(islandX * 0.06) * Math.cos(islandZ * 0.06) + Math.cos(islandX * 0.02) * Math.sin(islandZ * 0.02);
        const isVoidEmpty = (activeSeedType === 842 || activeSeedType === 233) && islandNoise <= -0.15;
        if (isVoidEmpty) continue;

        const isDreamSurface = isDreaming && (world[surfaceKey] === BlockType.GRASS || world[surfaceKey] === BlockType.DIAMOND);
        const isNormalSurface = !isDreaming && (world[surfaceKey] === spawnBlock || world[surfaceKey] === BlockType.GRASS || world[surfaceKey] === BlockType.DIRT_PATH);
        const isRottingSurface = isRottingDimension && world[surfaceKey] !== BlockType.AIR && world[surfaceKey] !== undefined;
        
        if (isDreamSurface || isNormalSurface || isRottingSurface) {
          // Deterministic pseudo-random threshold for coordinates x and z
          const hash = Math.abs(Math.sin(rx * 12.9898 + rz * 78.233) * 43758.5453) % 1;
          const actualTreeDensity = activeSeedType === 3 ? 0.04 : useTreeDensity;
          if (hash < actualTreeDensity) {
            // Verify no other woody trunks nearby to preserve spacing
            let nearbyTree = false;
            for (let dx = -2; dx <= 2; dx++) {
              for (let dz = -2; dz <= 2; dz++) {
                if (dx === 0 && dz === 0) continue;
                const trunkCheck = `${x + dx},${height + 1},${z + dz}`;
                if (world[trunkCheck] === BlockType.WOOD || world[trunkCheck] === BlockType.BIRCH || world[trunkCheck] === BlockType.RUOTK) {
                  nearbyTree = true;
                  break;
                }
              }
              if (nearbyTree) break;
            }

            if (!nearbyTree) {
              // Deterministically select birch vs standard oak based on coordinate hash
              const treeHash = Math.abs(Math.sin(rx * 43.123 + rz * 91.567) * 23456.78) % 1;
              const woodType = isRottingDimension 
                ? BlockType.RUOTK 
                : (isDreaming ? BlockType.BIRCH : (treeHash < 0.35 ? BlockType.BIRCH : trunkBlock));
              const leafType = isRottingDimension 
                ? BlockType.AIR 
                : (isDreaming ? BlockType.DIAMOND : leafBlock);
              
              if (leafType !== BlockType.AIR) {
                generateTree(world, x, height + 1, z, woodType, leafType);
              } else {
                // Spawn a tall trunk with no leaves for standard atmospheric decay!
                const treeHeight = 3 + Math.floor(treeHash * 3);
                for (let yy = height + 1; yy <= height + treeHeight; yy++) {
                  world[`${x},${yy},${z}`] = woodType;
                }
              }
            }
          }
        }
      }
    }
  }

  // 3. Spawns procedural house for Seed 2 or Seed 4 (Villages)
  if (isHouseChunk) {
    const hx = cx * 16 + 8;
    const hz = cz * 16 + 8;
    let hy = baseHeight;
    if (!flatWorld) {
      const rx = hx + seedOffsetX;
      const rz = hz + seedOffsetZ;
      const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
      const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
      hy = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
    }
    hy = Math.max(2, hy);
    generateHouse(world, hx, hy, hz);

    // Apply corrupted glitches to houses generated inside the Rotting Dimension
    if (isRottingDimension) {
      for (let rx = hx - 4; rx <= hx + 4; rx++) {
        for (let rz = hz - 4; rz <= hz + 4; rz++) {
          for (let ry = hy; ry <= hy + 7; ry++) {
            const rKey = `${rx},${ry},${rz}`;
            if (world[rKey]) {
              const hash = Math.abs(Math.sin(rx * 17.51 + ry * 31.84 + rz * 13.99)) % 1;
              if (hash < 0.24) {
                world[rKey] = BlockType.AIR; // 24% crumbled decay holes
              } else if (hash < 0.42) {
                world[rKey] = BlockType.RUOTK; // Corrupted rotting masonry
              } else if (hash < 0.46) {
                world[rKey] = BlockType.DIAMOND; // Rare visual glitch block
              }
            }
          }
        }
      }
    }
  }

  // Easter egg: SPAWN GIANT BLOCKY CAT STATUE at coordinates (0, 0)
  if (isCatSeed && cx === 0 && cz === 0) {
    let kittyHeight = baseHeight;
    const rx = seedOffsetX;
    const rz = seedOffsetZ;
    const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
    const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
    kittyHeight = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
    kittyHeight = Math.max(2, kittyHeight);
    generateCatStatue(world, 0, kittyHeight, 3);
  }

  // Sky Cloud Tree Generation for the Hard Texture Pack (features thick wood trunks and shiny emerald leaves)
  const isHardPack = (customParams && customParams.hardTexturePack);
  if (isHardPack) {
    const seedNoise = Math.sin(cx * 12.9 + cz * 78.3) * 43758.5453;
    const hasCloud = (Math.abs(seedNoise) % 1) < 0.26; // 26% probability of cloud-tree spawning in this chunk

    if (hasCloud) {
      // Pick dynamic within-chunk centers
      const cloudX = startX + 4 + Math.floor((Math.abs(Math.sin(cx * 53)) % 1) * 8);
      const cloudZ = startZ + 4 + Math.floor((Math.abs(Math.cos(cz * 29)) % 1) * 8);
      const cloudBaseY = 24 + Math.floor((Math.abs(Math.sin(cloudX * 17)) % 1) * 3);

      // 1. Trunk center core (Thick Wood block)
      for (let ty = 0; ty < 3; ty++) {
        const key = `${cloudX},${cloudBaseY + ty},${cloudZ}`;
        world[key] = BlockType.THICK_WOOD;
      }

      // 2. Canopy leaves (emerald blocks with 70% transparency)
      for (let dy = 1; dy <= 3; dy++) {
        const radius = dy === 2 ? 3 : (dy === 3 ? 1 : 2);
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            // Trim corners to make it circular and fluffy
            if (Math.abs(dx) === radius && Math.abs(dz) === radius && radius > 1) continue;

            const leafKey = `${cloudX + dx},${cloudBaseY + 1 + dy},${cloudZ + dz}`;
            if (world[leafKey] === undefined || world[leafKey] === BlockType.AIR) {
              world[leafKey] = BlockType.EMERALD;
            }
          }
        }
      }
    }
  }
}

/**
 * Procedurally generates a giant adorable voxel kitty cat statue made of bricks & gold blocks
 * placed near spawning ground of coordinate (0, ground, 0).
 */
export function generateCatStatue(world: Record<string, BlockType>, hx: number, hy: number, hz: number) {
  // Clear space around coords (hx, hz) for the cat
  for (let x = hx - 6; x <= hx + 6; x++) {
    for (let z = hz - 6; z <= hz + 12; z++) {
      for (let y = hy + 1; y <= hy + 20; y++) {
        world[`${x},${y},${z}`] = BlockType.AIR;
      }
    }
  }

  const mainBlock = BlockType.BRICK; // Reddish orange tabby color
  const secondaryBlock = BlockType.GOLD_BLOCK; // Golden tabby stripes
  const chestBlock = BlockType.BIRCH; // Soft white birch fur chest!

  // 1. Draw Torso slab columns: width X: -2 to 2, length Z: 0 to 8, height Y: hy+3 to hy+7
  for (let x = hx - 2; x <= hx + 2; x++) {
    for (let z = hz; z <= hz + 8; z++) {
      for (let y = hy + 3; y <= hy + 7; y++) {
        const key = `${x},${y},${z}`;
        if (z === hz && Math.abs(x - hx) <= 1 && y >= hy + 4) {
          world[key] = chestBlock;
        } else {
          world[key] = (x + z + y) % 3 === 0 ? secondaryBlock : mainBlock;
        }
      }
    }
  }

  // 2. Draw Legs columns: from Y = hy+1 to hy+2
  const legPositions = [
    { px: hx - 2, pz: hz },
    { px: hx + 1, pz: hz },
    { px: hx - 2, pz: hz + 7 },
    { px: hx + 1, pz: hz + 7 }
  ];

  legPositions.forEach(({ px, pz }) => {
    for (let x = px; x <= px + 1; x++) {
      for (let z = pz; z <= pz + 1; z++) {
        world[`${x},${hy + 1},${z}`] = BlockType.COBBLESTONE; // dark paws
        world[`${x},${hy + 2},${z}`] = mainBlock;
      }
    }
  });

  // 3. Head box block: X: hx-2 to hx+2, Z: hz-3 to hz, Y: hy+8 to hy+12
  for (let x = hx - 2; x <= hx + 2; x++) {
    for (let z = hz - 3; z <= hz; z++) {
      for (let y = hy + 8; y <= hy + 12; y++) {
        const key = `${x},${y},${z}`;
        world[key] = (x + z) % 2 === 0 ? mainBlock : secondaryBlock;
      }
    }
  }

  // 4. Cat ears structures
  // Left Ear
  world[`${hx - 2},${hy + 13},${hz - 2}`] = BlockType.COBBLESTONE;
  world[`${hx - 2},${hy + 14},${hz - 2}`] = mainBlock;
  world[`${hx - 1},${hy + 13},${hz - 2}`] = mainBlock;
  // Right Ear
  world[`${hx + 2},${hy + 13},${hz - 2}`] = BlockType.COBBLESTONE;
  world[`${hx + 2},${hy + 14},${hz - 2}`] = mainBlock;
  world[`${hx + 1},${hy + 13},${hz - 2}`] = mainBlock;

  // 5. Blue glowing diamond eyes
  world[`${hx - 1},${hy + 11},${hz - 4}`] = BlockType.DIAMOND;
  world[`${hx + 1},${hy + 11},${hz - 4}`] = BlockType.DIAMOND;

  // 6. Cute pink blocky nose
  world[`${hx},${hy + 10},${hz - 4}`] = BlockType.BED; 

  // 7. Cheeks/whisker base
  world[`${hx - 1},${hy + 9},${hz - 4}`] = BlockType.BIRCH;
  world[`${hx + 1},${hy + 9},${hz - 4}`] = BlockType.BIRCH;
  world[`${hx},${hy + 9},${hz - 4}`] = BlockType.BIRCH;

  // 8. Long curved tail curling up
  world[`${hx},${hy + 6},${hz + 9}`] = mainBlock;
  world[`${hx},${hy + 7},${hz + 10}`] = secondaryBlock;
  world[`${hx},${hy + 8},${hz + 10}`] = mainBlock;
  world[`${hx},${hy + 9},${hz + 11}`] = secondaryBlock;
  world[`${hx},${hy + 10},${hz + 11}`] = BlockType.GOLD_BLOCK; // Golden tail tip!
}

/**
 * Generates a beautiful procedurally designed neighborhood cottage house at (hx, height, hz)
 * Built with Brick walls, Cobblestone support pillars on corners, and a mixed cobblestone and mossy cobblestone roof.
 * Includes wood floor, cabinet, crafting table, chest, windows, open doorway, and a brick chimney structure.
 */
function generateHouse(world: Record<string, BlockType>, hx: number, height: number, hz: number) {
  // Clear the interior space from height+1 to height+4 to prevent clipping of trees/leaves
  for (let x = hx - 2; x <= hx + 2; x++) {
    for (let z = hz - 2; z <= hz + 2; z++) {
      for (let y = height + 1; y <= height + 4; y++) {
        const key = `${x},${y},${z}`;
        world[key] = BlockType.AIR;
      }
    }
  }

  // Draw house slab foundation and floor made of wood planks
  for (let x = hx - 3; x <= hx + 3; x++) {
    for (let z = hz - 3; z <= hz + 3; z++) {
      // solid stone support columns underneath so houses on hills never float
      for (let y = 1; y < height; y++) {
        const key = `${x},${y},${z}`;
        world[key] = BlockType.STONE;
      }
      const floorKey = `${x},${height},${z}`;
      world[floorKey] = BlockType.WOOD;
    }
  }

  // Draw walls from height+1 to height+4
  for (let y = height + 1; y <= height + 4; y++) {
    for (let x = hx - 3; x <= hx + 3; x++) {
      for (let z = hz - 3; z <= hz + 3; z++) {
        const isCorner = (x === hx - 3 || x === hx + 3) && (z === hz - 3 || z === hz + 3);
        const isWall = x === hx - 3 || x === hx + 3 || z === hz - 3 || z === hz + 3;

        if (isWall) {
          const key = `${x},${y},${z}`;
          if (isCorner) {
            // Cobblestone and mossy cobblestone pillars for corner strength
            world[key] = Math.random() > 0.4 ? BlockType.MOSSY_COBBLE : BlockType.COBBLESTONE;
          } else {
            // Front door gap (z = hz-3, x = hx, bottom two frames)
            if (z === hz - 3 && x === hx && (y === height + 1 || y === height + 2)) {
              world[key] = BlockType.AIR;
            }	
            // Window on left wall
            else if (x === hx - 3 && z === hz && (y === height + 2 || y === height + 3)) {
              world[key] = BlockType.AIR;
            }
            // Window on right wall
            else if (x === hx + 3 && z === hz && (y === height + 2 || y === height + 3)) {
              world[key] = BlockType.AIR;
            }
            // Window on back wall
            else if (z === hz + 3 && x === hx && (y === height + 2 || y === height + 3)) {
              world[key] = BlockType.AIR;
            }
            else {
              // Solid cozy brick blocks
              world[key] = BlockType.BRICK;
            }
          }
        }
      }
    }
  }

  // Draw roof at height+5
  for (let x = hx - 3; x <= hx + 3; x++) {
    for (let z = hz - 3; z <= hz + 3; z++) {
      const roofKey = `${x},${height + 5},${z}`;
      world[roofKey] = Math.random() > 0.45 ? BlockType.COBBLESTONE : BlockType.MOSSY_COBBLE;
    }
  }

  // Add cabinets, chests, workshops
  const cabinetKey = `${hx - 2},${height + 1},${hz + 2}`;
  world[cabinetKey] = BlockType.CABINET;

  const chestKey = `${hx + 1},${height + 1},${hz + 2}`;
  world[chestKey] = BlockType.CHEST;

  const craftTableKey = `${hx - 2},${height + 1},${hz - 2}`;
  world[craftTableKey] = BlockType.CRAFT_TABLE;

  // Brick chimney stack
  const chimneyBaseY = height + 6;
  world[`${hx + 2},${chimneyBaseY},${hz + 2}`] = BlockType.BRICK;
  world[`${hx + 2},${chimneyBaseY + 1},${hz + 2}`] = BlockType.BRICK;
}

