/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from '../types';

export function generateTextureCanvas(type: BlockType, size = 32, hardTexturePack = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  switch (type) {
    case BlockType.GRASS: {
      // Lime grass: "looks like lime TV static"
      // Bright neon lime-greens with noisy bright yellow-green variations
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        // Base Lime green: R: 50-130, G: 200-255, B: 0-40
        const r = Math.floor(50 + noise * 80);
        const g = Math.floor(200 + noise * 55);
        const b = Math.floor(noise * 30);
        
        data[i] = r;     // R
        data[i + 1] = g; // G
        data[i + 2] = b; // B
        data[i + 3] = 255; // A
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case BlockType.WOOD: {
      // Wood: "brown TV static"
      // Coarse grainy brown pixels
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        // Medium to dark brown variations: R: 90-140, G: 50-90, B: 20-55
        const r = Math.floor(90 + noise * 50);
        const g = Math.floor(50 + noise * 40);
        const b = Math.floor(20 + noise * 35);

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case BlockType.STONE: {
      // Stone: "makes the stone look more gray than TV static"
      // Soft slate gray colors with moderate dark and light tone fluctuations
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        const value = Math.floor(115 + noise * 45); // Warm solid medium grey range

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case BlockType.CRAFT_TABLE: {
      // Craft Table: "looks like a workshop table, but with nine squares on it"
      // Background wooden grain boards
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, 0, size, size);

      // Create natural wooden pixel texture base
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 20;
          ctx.fillStyle = `rgb(${120 + noise}, ${75 + noise}, ${40 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw prominent dark brown wooden rim
      ctx.strokeStyle = '#4a2511';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, size, size);
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Partition the area into a precise 3x3 grid (forming exactly 9 squares)
      const margin = 2;
      const innerSize = size - margin * 2;
      const step = innerSize / 3;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const px = Math.floor(margin + c * step);
          const py = Math.floor(margin + r * step);
          const cw = Math.floor(step);

          // Draw the square border
          ctx.strokeStyle = '#2b1408';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cw, cw);

          // Add a soft grey/dark overlay to give the 9 workshop slots depth
          ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(74, 37, 17, 0.45)' : 'rgba(92, 49, 21, 0.45)';
          ctx.fillRect(px + 1, py + 1, cw - 2, cw - 2);

          // Add elegant chisel highlight marks
          ctx.strokeStyle = 'rgba(255, 235, 180, 0.25)';
          ctx.beginPath();
          ctx.moveTo(px + 1, py + cw - 2);
          ctx.lineTo(px + 1, py + 1);
          ctx.lineTo(px + cw - 2, py + 1);
          ctx.stroke();
        }
      }
      break;
    }

    case BlockType.BRICK: {
      // Red base with brick-color noise
      ctx.fillStyle = '#b22222';
      ctx.fillRect(0, 0, size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 20;
          ctx.fillStyle = `rgb(${165 + noise}, ${45 + noise}, ${35 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw light grey mortar joints
      ctx.fillStyle = '#d3d3d3';
      
      // Horizontal joint layers
      ctx.fillRect(0, 8, 32, 1);
      ctx.fillRect(0, 16, 32, 1);
      ctx.fillRect(0, 24, 32, 1);
      
      // Vertical brick breaks
      // Layer 1 (0-8)
      ctx.fillRect(8, 0, 1, 8);
      ctx.fillRect(24, 0, 1, 8);
      // Layer 2 (8-16)
      ctx.fillRect(16, 8, 1, 8);
      // Layer 3 (16-24)
      ctx.fillRect(8, 16, 1, 8);
      ctx.fillRect(24, 16, 1, 8);
      // Layer 4 (24-32)
      ctx.fillRect(16, 24, 1, 8);
      break;
    }

    case BlockType.CHEST: {
      // Chest looks like a custom brown block with a dark lid split, metal latch
      ctx.fillStyle = '#6f421f';
      ctx.fillRect(0, 0, size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 15;
          ctx.fillStyle = `rgb(${100 + noise}, ${60 + noise}, ${30 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Dark surrounding edge framing
      ctx.strokeStyle = '#3e1e07';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Lid split line at 14px high
      ctx.fillStyle = '#210e02';
      ctx.fillRect(0, 14, 32, 2);

      // Metal padlock / lock latch in the center (gold with black accent)
      ctx.fillStyle = '#210e02'; // Latch plate
      ctx.fillRect(13, 11, 6, 8);
      ctx.fillStyle = '#ffd700'; // Gold latch keyhole/body
      ctx.fillRect(14, 13, 4, 5);
      ctx.fillStyle = '#000000'; // Keyhole dot
      ctx.fillRect(15, 15, 2, 2);
      break;
    }

    case BlockType.CABINET: {
      // White/light grey cabinet wood panels
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 10;
          ctx.fillStyle = `rgb(${240 + noise}, ${240 + noise}, ${240 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw dark borders of the cabinet outline
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Draw the door alignment frame with a line down or around
      ctx.strokeStyle = '#bbb';
      ctx.strokeRect(4, 4, size - 8, size - 8);

      // Door line division or simple vertical groove
      ctx.fillStyle = '#b2b2b2';
      ctx.fillRect(15, 4, 2, size - 8);

      // Cabinet silver handle
      ctx.fillStyle = '#555555'; // Dark drop shadow for handles
      ctx.fillRect(7, 13, 3, 7);
      ctx.fillStyle = '#cccccc'; // Shiny metallic handle
      ctx.fillRect(6, 12, 3, 7);

      ctx.fillStyle = '#555555';
      ctx.fillRect(23, 13, 3, 7);
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(22, 12, 3, 7);
      break;
    }

    case BlockType.MEAT: {
      // Pink/red steak marbled block
      ctx.fillStyle = '#b22222';
      ctx.fillRect(0, 0, size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 15;
          ctx.fillStyle = `rgb(${160 + noise}, ${42 + noise}, ${42 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw marble white fat veins across the block
      ctx.fillStyle = '#ffeded';
      ctx.fillRect(4, 4, 3, 2);
      ctx.fillRect(6, 6, 4, 1);
      ctx.fillRect(12, 12, 5, 2);
      ctx.fillRect(16, 14, 3, 1);
      ctx.fillRect(20, 20, 4, 2);
      ctx.fillRect(23, 22, 5, 1);
      ctx.fillRect(2, 24, 6, 2);
      break;
    }

    case BlockType.COBBLESTONE: {
      // Cobblestone: "gray block with cracks in it"
      // Main blocky grey texture with dark cracks and light edges
      ctx.fillStyle = '#8e8e8e';
      ctx.fillRect(0, 0, size, size);

      // Add a little pixel noise first to make it look mineral
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 30;
          ctx.fillStyle = `rgb(${140 + noise}, ${140 + noise}, ${140 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw gray stone joints/cracks (dark gray / black grid lines + diagonal fractures)
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 1;
      
      // Horizontal and vertical stone divisions
      ctx.beginPath();
      // Stone 1
      ctx.moveTo(0, 8); ctx.lineTo(16, 8); ctx.lineTo(16, 0);
      // Stone 2
      ctx.moveTo(16, 16); ctx.lineTo(32, 16); ctx.lineTo(32, 8);
      // Stone 3
      ctx.moveTo(0, 24); ctx.lineTo(24, 24); ctx.lineTo(24, 16); ctx.lineTo(0, 16);
      // Stone 4
      ctx.moveTo(24, 32); ctx.lineTo(24, 24); ctx.lineTo(32, 24);
      // Extra random diagonal cracks
      ctx.moveTo(4, 4); ctx.lineTo(8, 8);
      ctx.moveTo(18, 20); ctx.lineTo(22, 18);
      ctx.moveTo(12, 28); ctx.lineTo(8, 32);
      ctx.stroke();

      // Draw light highlights on stone edges (creates 3D relief for cobblestone)
      ctx.strokeStyle = '#dcdcdc';
      ctx.beginPath();
      ctx.moveTo(0, 9); ctx.lineTo(15, 9);
      ctx.moveTo(17, 1); ctx.lineTo(31, 1);
      ctx.moveTo(0, 25); ctx.lineTo(23, 25);
      ctx.moveTo(25, 25); ctx.lineTo(31, 25);
      ctx.stroke();
      break;
    }

    case BlockType.MOSSY_COBBLE: {
      // Mossy cobblestone: "looks like the same cobblestone block, but with moss on it"
      // Start with normal cobblestone
      const cobbleCanvas = generateTextureCanvas(BlockType.COBBLESTONE, size);
      ctx.drawImage(cobbleCanvas, 0, 0);

      // Draw bright lime moss spots on top of cobblestone
      // Moss pixels are lime green static
      const mossColor = 'rgba(124, 252, 0, 0.75)'; // Transparent lime green (lawn green)
      const mossHighlight = 'rgba(50, 205, 50, 0.85)'; // Deeper lime (lime green)

      // Let's create specific organic moss clusters procedurally
      for (let c = 0; iBlockRadius(c); c++) {
        const cx = Math.floor(Math.random() * size);
        const cy = Math.floor(Math.random() * size);
        const rad = Math.floor(2 + Math.random() * 5); // cluster radius

        for (let y = cy - rad; y <= cy + rad; y++) {
          for (let x = cx - rad; x <= cx + rad; x++) {
            if (x >= 0 && x < size && y >= 0 && y < size) {
              const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
              if (dist < rad * (0.6 + Math.random() * 0.6)) {
                ctx.fillStyle = Math.random() > 0.3 ? mossColor : mossHighlight;
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        }
      }
      break;
    }

    case BlockType.LEAVES: {
      // Leaves: "look like the lime grass, but they're very lime, but with transparent holes in them"
      // Transparent foliage
      ctx.clearRect(0, 0, size, size);
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          // Leaf hole distribution (transparent holes): ~35% chance of air
          if (Math.random() < 0.35) {
            continue; // transparent hole
          }

          const noise = Math.random();
          // VERY vivid lime green colors: R: 0-30, G: 220-255, B: 0-10
          const r = Math.floor(noise * 30);
          const g = Math.floor(220 + noise * 35);
          const b = Math.floor(noise * 10);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      break;
    }

    case BlockType.DIAMOND: {
      // Diamond: "A blue, shiny, transparent diamond structure block! Very weird, crazy, and beautiful"
      ctx.clearRect(0, 0, size, size);

      // Base shiny sky blue with varying opacities
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = Math.random();
          const r = Math.floor(0 + noise * 60);
          const g = Math.floor(180 + noise * 75);
          const b = Math.floor(220 + noise * 35);
          
          if ((x * 123 + y * 456) % 7 === 0) {
            continue;
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.45 + noise * 0.5})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Stars/glowing pixels at corners and center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(5, 2, 1, 4);
      ctx.fillRect(3, 5, 4, 1);

      ctx.fillRect(size - 6, size - 6, 2, 2);
      ctx.fillRect(size - 5, size - 8, 1, 4);
      ctx.fillRect(size - 7, size - 5, 4, 1);

      // Symmetric futuristic grid lattice frame
      ctx.strokeStyle = '#00ffff';
      ctx.strokeRect(1, 1, size - 2, size - 2);
      ctx.strokeStyle = '#0055ff';
      ctx.strokeRect(3, 3, size - 6, size - 6);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(size, size);
      ctx.moveTo(size, 0); ctx.lineTo(0, size);
      ctx.stroke();

      break;
    }

    case BlockType.DIAMOND_ITEM: {
      // Diamond Item: a beautiful, shiny, weird-looking diamond gemstone drawing
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      // Draw custom procedural jewel icon
      ctx.fillStyle = '#0284c7'; // dark blue
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);     // Top point
      ctx.lineTo(cx + 8, cy - 4);  // Upper right girdle
      ctx.lineTo(cx + 5, cy + 8);  // Lower right
      ctx.lineTo(cx, cy + 12);     // Bottom peak point
      ctx.lineTo(cx - 5, cy + 8);  // Lower left
      ctx.lineTo(cx - 8, cy - 4);  // Upper left girdle
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8'; // sky blue
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 6, cy - 3);
      ctx.lineTo(cx + 4, cy + 6);
      ctx.lineTo(cx, cy + 10);
      ctx.lineTo(cx - 4, cy + 6);
      ctx.lineTo(cx - 6, cy - 3);
      ctx.closePath();
      ctx.fill();

      // Top Table facet
      ctx.fillStyle = '#e0f2fe'; // lightest blue
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 4);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.lineTo(cx + 3, cy - 8);
      ctx.lineTo(cx - 3, cy - 8);
      ctx.closePath();
      ctx.fill();

      // Sparkle twinkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 2, cy - 7, 2, 2);
      ctx.fillRect(cx + 1, cy - 6, 4, 1);
      ctx.fillRect(cx + 3, cy - 8, 1, 4);

      // Dark edge outline
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + 8, cy - 4);
      ctx.lineTo(cx + 5, cy + 8);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx - 5, cy + 8);
      ctx.lineTo(cx - 8, cy - 4);
      ctx.closePath();
      ctx.stroke();

      break;
    }

    case BlockType.BIRCH: {
      // Birch: "It looks like a white block, but with black spots on it."
      // Let's use clean off-white wood background
      ctx.fillStyle = '#f5f5f7';
      ctx.fillRect(0, 0, size, size);

      // Add a subtle vertical grain structure (light gray)
      for (let x = 0; x < size; x++) {
        const grainNoise = Math.random();
        if (grainNoise < 0.25) {
          ctx.fillStyle = 'rgba(215, 215, 215, 0.4)';
          ctx.fillRect(x, 0, 1, size);
        }
      }

      // Procedural horizontal dark/black spots (lenticels) of birch tree bark
      const rows = [3, 7, 12, 16, 21, 25, 29];
      rows.forEach((row, rIndex) => {
        // Pseudo-random offset using row number to keep it clean and deterministic
        const seedValue = Math.sin(row * 43758.5453) * 1000;
        const xOffset = Math.floor(Math.abs(seedValue) % (size - 10));
        const len = Math.floor(4 + (Math.abs(seedValue) * 7) % 8); // Spot width in pixels
        const thick = Math.random() < 0.3 ? 2 : 1; // 1 or 2 pixels thick

        // Primary horizontal charcoal crust spot
        ctx.fillStyle = '#222222';
        ctx.fillRect(xOffset, row, len, thick);

        // Dark grey side blending pixels
        ctx.fillStyle = '#777777';
        if (xOffset > 0) ctx.fillRect(xOffset - 1, row, 1, thick);
        if (xOffset + len < size) ctx.fillRect(xOffset + len, row, 1, thick);

        // Soft light gray accent below it to look 3D barked
        ctx.fillStyle = '#dfdfdf';
        ctx.fillRect(xOffset, row + thick, len, 1);
      });

      break;
    }

    case BlockType.BED: {
      // Wood frame base (dark wood colors)
      ctx.fillStyle = '#4a2511';
      ctx.fillRect(0, 0, size, size);

      // Bed texture base
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 10;
          ctx.fillStyle = `rgb(${80 + noise}, ${45 + noise}, ${25 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw cozy quilted red blanket (covers bottom 3/4 of the block, from y = 8 to 32)
      ctx.fillStyle = '#dc2626'; // Red blanket
      ctx.fillRect(2, 8, size - 4, size - 10);

      // Pillow at top (from y = 2 to 7, x from 4 to 28)
      ctx.fillStyle = '#f8fafc'; // Clean white
      ctx.fillRect(4, 2, size - 8, 5);

      // Pillow shading/details
      ctx.fillStyle = '#cbd5e1'; // Grey shadow for pillow
      ctx.fillRect(4, 6, size - 8, 1);
      ctx.fillRect(4, 2, 1, 4);
      ctx.fillRect(size - 5, 2, 1, 4);

      // Blanket shading quilt stitches (grid lines)
      ctx.strokeStyle = '#991b1b'; // Darker red for stitches
      ctx.lineWidth = 1;
      // Horizontal quilt threads
      for (let y = 12; y < size - 2; y += 5) {
        ctx.beginPath();
        ctx.moveTo(2, y);
        ctx.lineTo(size - 3, y);
        ctx.stroke();
      }
      // Vertical quilt threads
      for (let x = 6; x < size - 4; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x, size - 3);
        ctx.stroke();
      }

      // Wood rails on sides
      ctx.fillStyle = '#3b1d0e';
      ctx.fillRect(0, 0, 2, size);
      ctx.fillRect(size - 2, 0, 2, size);
      ctx.fillRect(0, size - 2, size, 2);
      ctx.fillRect(0, 0, size, 2);

      break;
    }

    case BlockType.DIRT_PATH: {
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        const r = Math.floor(215 + noise * 40);
        const g = Math.floor(180 + noise * 45);
        const b = Math.floor(15 + noise * 45);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, size, 2);
      ctx.fillRect(0, size - 2, size, 2);
      ctx.fillRect(0, 0, 2, size);
      ctx.fillRect(size - 2, 0, 2, size);

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(16, 8, 4, 2);
      ctx.fillRect(10, 18, 2, 4);
      ctx.fillRect(22, 22, 3, 3);
      break;
    }

    case BlockType.RUOTK: {
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        const val = Math.floor(55 + noise * 30);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val + (Math.random() < 0.12 ? 15 : 0);
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(8, 12);
      ctx.lineTo(12, 10);
      ctx.lineTo(16, 24);
      ctx.stroke();

      ctx.strokeStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(32, 28);
      ctx.lineTo(24, 20);
      ctx.lineTo(20, 24);
      ctx.lineTo(12, 8);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, 14, 4, 4);
      break;
    }

    case BlockType.WATER: {
      // Pure blue TV static but transparent
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        data[i] = Math.floor(10 + noise * 30);      // R: very low
        data[i + 1] = Math.floor(90 + noise * 100);  // G: cyan tint
        data[i + 2] = Math.floor(215 + noise * 40);  // B: high blue
        data[i + 3] = 255;                           // A
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case BlockType.GOLD_SHARD: {
      // Clear canvas context for transparent background
      ctx.clearRect(0, 0, size, size);

      // 8x8 pixel art grid for Gold Shard
      const pSize = size / 8;
      // 0 = transparent, 1 = outline (#78350f), 2 = shiny body gold (#f59e0b), 3 = medium bright gold (#fbbf24), 4 = highlight glint (#ffffff)
      const grid = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 1, 3, 4, 1],
        [0, 0, 0, 1, 2, 3, 2, 1],
        [0, 0, 1, 2, 3, 2, 1, 0],
        [0, 1, 2, 3, 2, 1, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const val = grid[r][c];
          if (val === 1) {
            ctx.fillStyle = '#78350f'; // Dark amber-gold outline
            ctx.fillRect(c * pSize, r * pSize, pSize, pSize);
          } else if (val === 2) {
            ctx.fillStyle = '#f59e0b'; // Solid deep gold
            ctx.fillRect(c * pSize, r * pSize, pSize, pSize);
          } else if (val === 3) {
            ctx.fillStyle = '#fbbf24'; // Medium gold
            ctx.fillRect(c * pSize, r * pSize, pSize, pSize);
          } else if (val === 4) {
            ctx.fillStyle = '#ffffff'; // White glint
            ctx.fillRect(c * pSize, r * pSize, pSize, pSize);
          }
        }
      }
      break;
    }

    case BlockType.GOLD_BLOCK: {
      // A beautiful, shiny, pixelated solid Gold Block texture
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 0, size, size);

      // 32x32 noisy pixel detail
      for (let y = 0; y < size; y += 2) {
        for (let x = 0; x < size; x += 2) {
          const n = Math.random();
          if (n < 0.15) {
            ctx.fillStyle = '#d97706'; // darker shadow accent
            ctx.fillRect(x, y, 2, 2);
          } else if (n > 0.85) {
            ctx.fillStyle = '#fef08a'; // lighter highlight accent
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }

      // Thick elegant borders
      ctx.strokeStyle = '#b45309'; // border stroke
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Inner highlight bezel
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.strokeRect(3, 3, size - 6, size - 6);
      break;
    }

    case BlockType.SAND: {
      // Sand: "a yellow, not yellow, but like a mono yellow block, but a mono yellow TV static block"
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        // Mono-yellow / beige static: soft variations
        const val = 195 + noise * 30;
        data[i] = val + 28;      // R: 223 - 253 (warm gold-yellow)
        data[i + 1] = val + 12;  // G: 207 - 237
        data[i + 2] = val - 55;  // B: 140 - 170 (mono yellow static blend)
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // Add a couple of darker grains inside the sand for textured feel
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(4, 8, 1, 1);
      ctx.fillRect(18, 5, 1, 1);
      ctx.fillRect(12, 22, 1, 1);
      ctx.fillRect(26, 17, 1, 1);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 12, 1, 1);
      ctx.fillRect(22, 28, 1, 1);
      break;
    }

    case BlockType.COCONUT: {
      // Coconut: "looks like a brown block"
      // Round darker brown woody block with three small dark eyes/dots
      ctx.fillStyle = '#653c1a';
      ctx.fillRect(0, 0, size, size);
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const noise = (Math.random() - 0.5) * 15;
          ctx.fillStyle = `rgb(${95 + noise}, ${58 + noise}, ${28 + noise})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw a circular coconut shell contour inside
      ctx.fillStyle = '#4c2d13';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw three dark coconut eyes
      ctx.fillStyle = '#1c0e05';
      ctx.fillRect(size / 2 - 3, size / 2 - 3, 2, 2);
      ctx.fillRect(size / 2 + 1, size / 2 - 3, 2, 2);
      ctx.fillRect(size / 2 - 1, size / 2 + 2, 2, 2);
      break;
    }

    case BlockType.COCONUT_MILK: {
      // Coconut Milk item: half-coconut shell containing pure white liquid
      ctx.clearRect(0, 0, size, size);

      // Draw top layer of white milk
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, 12, size - 8, size - 16);

      for (let y = 12; y < size - 4; y++) {
        for (let x = 4; x < size - 4; x++) {
          if (Math.random() < 0.15) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Draw round brown coconut shell bowl on bottom and sides
      ctx.fillStyle = '#5c2d11';
      ctx.fillRect(4, size - 4, size - 8, 2);
      ctx.fillRect(2, 10, 2, size - 14);
      ctx.fillRect(size - 4, 10, 2, size - 14);

      // Rounded bottom corners
      ctx.fillStyle = '#45200a';
      ctx.fillRect(2, size - 6, 2, 2);
      ctx.fillRect(size - 4, size - 6, 2, 2);
      break;
    }

    case BlockType.EMERALD: {
      // Draw shiny transparent 70% green/emerald block
      ctx.fillStyle = '#065f46'; // Deep emerald border/base
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#10b981'; // Bright primary green
      ctx.fillRect(2, 2, size - 4, size - 4);

      // Shiny highlight facets
      ctx.fillStyle = '#34d399';
      ctx.fillRect(2, 2, size - 4, 2);
      ctx.fillRect(2, 2, 2, size - 4);

      // Diamond-cut refractions
      ctx.fillStyle = '#a7f3d0'; // bright peak gleam
      ctx.fillRect(size - 8, 4, 4, 4);
      ctx.fillRect(4, size - 8, 4, 4);
      ctx.fillRect(10, 10, size - 20, size - 20);

      // Add elegant internal sparkles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 6, 2, 2);
      ctx.fillRect(size - 10, size - 10, 2, 2);
      ctx.fillRect(6, size - 12, 1, 2);
      ctx.fillRect(size - 12, 8, 2, 1);
      break;
    }

    case BlockType.THICK_WOOD: {
      // Thick Wood: very, very thick dark heavy tree pattern
      ctx.fillStyle = '#451a03'; // Heavy dark shadow
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#78350f'; // Dark rugged wood bark body
      ctx.fillRect(3, 3, size - 6, size - 6);

      // Draw heavy thick bark line patterns
      ctx.fillStyle = '#270e01';
      // Vertical thick cracks
      ctx.fillRect(3, 0, 4, size);
      ctx.fillRect(size - 8, 0, 4, size);
      // Horizontal segment dividers
      ctx.fillRect(0, 8, size, 4);
      ctx.fillRect(0, size - 12, size, 4);

      // Draw lighter highlights inside segments to make it look exceptionally bulky
      ctx.fillStyle = '#92400e';
      ctx.fillRect(8, 3, size - 16, 4);
      ctx.fillRect(8, 13, size - 16, 6);
      ctx.fillRect(8, size - 7, size - 16, 4);
      break;
    }

    default: {
      // Flat solid magenta fallback
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, size, size);
    }
  }

  // If hardTexturePack is true, let's postprocess the textures to make them look ultra high contrast and heavy metal
  if (hardTexturePack) {
    // 1. Draw heavy dark outlines like a hand-crafted dark comic/voxel rim
    ctx.strokeStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);

    // 2. Shiny internal highlight outline to represent high-tech metallic shading
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, size - 6, size - 6);

    // 3. Vignette radial gradient to darken corners
    const grad = ctx.createRadialGradient(size/2, size/2, 4, size/2, size/2, size * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Helper inside switch block
  function iBlockRadius(i: number) {
    return i < 12; // 12 distinct moss clumps
  }

  return canvas;
}

// Generate Three.js CanvasTexture with pixel-art settings
export function getThreeTexture(type: BlockType, hardTexturePack = false): THREE.CanvasTexture {
  const canvas = generateTextureCanvas(type, 32, hardTexturePack);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Map of textures for caching/reusing
export function getSharedMaterials(wireframe = false, hardTexturePack = false): Record<BlockType, THREE.Material> {
  const materials: Partial<Record<BlockType, THREE.Material>> = {};

  // Air is invisible
  materials[BlockType.AIR] = new THREE.MeshBasicMaterial({ visible: false });

  // Trigger generation for each block type
  const blockTypes = [
    BlockType.GRASS,
    BlockType.WOOD,
    BlockType.STONE,
    BlockType.COBBLESTONE,
    BlockType.MOSSY_COBBLE,
    BlockType.LEAVES,
    BlockType.CRAFT_TABLE,
    BlockType.BRICK,
    BlockType.CHEST,
    BlockType.CABINET,
    BlockType.MEAT,
    BlockType.DIAMOND,
    BlockType.DIAMOND_ITEM,
    BlockType.BIRCH,
    BlockType.BED,
    BlockType.DIRT_PATH,
    BlockType.RUOTK,
    BlockType.WATER,
    BlockType.GOLD_SHARD,
    BlockType.GOLD_BLOCK,
    BlockType.SAND,
    BlockType.COCONUT,
    BlockType.COCONUT_MILK,
    BlockType.EMERALD,
    BlockType.THICK_WOOD
  ];

  blockTypes.forEach((type) => {
    // If hardTexturePack is active: leaves look like the Emerald block!
    const effectiveType = (hardTexturePack && type === BlockType.LEAVES) ? BlockType.EMERALD : type;

    const isTrans = effectiveType === BlockType.LEAVES || 
                    effectiveType === BlockType.DIAMOND || 
                    effectiveType === BlockType.DIAMOND_ITEM || 
                    effectiveType === BlockType.WATER || 
                    effectiveType === BlockType.GOLD_SHARD || 
                    effectiveType === BlockType.COCONUT_MILK ||
                    effectiveType === BlockType.EMERALD;

    const tex = getThreeTexture(effectiveType, hardTexturePack);

    materials[type] = new THREE.MeshLambertMaterial({
      map: tex,
      transparent: isTrans,
      alphaTest: (effectiveType === BlockType.LEAVES || effectiveType === BlockType.COCONUT_MILK) ? 0.4 : 0, // Helps with transparent render sorting in WebGL
      opacity: effectiveType === BlockType.WATER 
        ? 0.65 
        : (effectiveType === BlockType.DIAMOND 
          ? 0.70 
          : (effectiveType === BlockType.EMERALD 
            ? 0.30 // VERY shiny and transparent green: 70% transparent, 30% opaque
            : 1.0)), 
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      wireframe: wireframe
    });
  });

  return materials as Record<BlockType, THREE.Material>;
}
