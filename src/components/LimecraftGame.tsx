/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Globe, Sliders, ChevronLeft, Check, Plus, RefreshCw, User, Users, ShieldAlert, Sparkles, Building2, Trash2, Triangle } from 'lucide-react';
import { BlockType, WorldData, GameSettings, BLOCKS } from '../types';
import { getSharedMaterials } from './TextureGenerator';
import { generateWorld, generateChunk } from './WorldGenerator';
import { GameUI } from './GameUI';

const LOCAL_STORAGE_KEY = 'limecraft_world_save_v1';

// Voxel mesh generation function for Pigs, Chickens, Cats, most adorable Dogs, Cows and Fish
function createMobGroup(type: 'pig' | 'chicken' | 'cat' | 'dog' | 'cow' | 'fish', hardTexturePack = false): THREE.Group {
  const group = new THREE.Group();
  group.name = type;

  if (type === 'pig') {
    // PIG: pink skin, one face
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xffadc6 }); // Baby pink skin
    const darkPinkMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 }); // Snout pink
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso (horizontal rectangular box)
    const torsoGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const torso = new THREE.Mesh(torsoGeo, pinkMat);
    torso.position.y = 0.5;
    group.add(torso);

    // Head (one face, facing +Z direction)
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeo, pinkMat);
    head.name = 'head';
    head.position.set(0, 0.75, 0.6);
    group.add(head);

    // Snout protruding on the front face of head
    const snoutGeo = new THREE.BoxGeometry(0.3, 0.18, 0.15);
    const snout = new THREE.Mesh(snoutGeo, darkPinkMat);
    snout.position.set(0, 0.65, 0.9);
    group.add(snout);

    // Two little black nostril dots on snout
    const nostrilGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const n1 = new THREE.Mesh(nostrilGeo, blackMat);
    n1.position.set(-0.06, 0.65, 0.98);
    const n2 = new THREE.Mesh(nostrilGeo, blackMat);
    n2.position.set(0.06, 0.65, 0.98);
    group.add(n1, n2);

    // Pig eyes (black and white) on front face
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.12, 0.02);
    const leftEye = new THREE.Mesh(eyeGeo, blackMat);
    leftEye.position.set(-0.16, 0.82, 0.88);
    const rightEye = new THREE.Mesh(eyeGeo, blackMat);
    rightEye.position.set(0.16, 0.82, 0.88);
    group.add(leftEye, rightEye);

    // FOUR Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
    
    const legFL = new THREE.Mesh(legGeo, pinkMat);
    legFL.name = 'leg_fl';
    legFL.position.set(-0.25, 0.2, 0.4);
    
    const legFR = new THREE.Mesh(legGeo, pinkMat);
    legFR.name = 'leg_fr';
    legFR.position.set(0.25, 0.2, 0.4);
    
    const legBL = new THREE.Mesh(legGeo, pinkMat);
    legBL.name = 'leg_bl';
    legBL.position.set(-0.25, 0.2, -0.4);
    
    const legBR = new THREE.Mesh(legGeo, pinkMat);
    legBR.name = 'leg_br';
    legBR.position.set(0.25, 0.2, -0.4);
    
    group.add(legFL, legFR, legBL, legBR);

  } else if (type === 'dog') {
    // DOG: four legs, golden retriever pale yellow-orange texture, one face
    const dogMat = new THREE.MeshLambertMaterial({ color: 0xefbf8a }); // Light cream/golden
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Black nose
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const collarMat = new THREE.MeshLambertMaterial({ color: 0xef4444 }); // Elegant red collar!

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.55, 1.1);
    const torso = new THREE.Mesh(torsoGeo, dogMat);
    torso.position.y = 0.55;
    group.add(torso);

    // Collar
    const collarGeo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.72, 0.45);
    group.add(collar);

    // Head (one face, facing +Z)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, dogMat);
    head.name = 'head';
    head.position.set(0, 0.95, 0.45);
    group.add(head);

    // Snout
    const muzzleGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const muzzle = new THREE.Mesh(muzzleGeo, dogMat);
    muzzle.position.set(0, 0.88, 0.76);
    group.add(muzzle);

    // Nose tip
    const noseGeo = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.96, 0.88);
    group.add(nose);

    // Two floppy golden ears on the head sides
    const earGeo = new THREE.BoxGeometry(0.12, 0.35, 0.15);
    const leftEar = new THREE.Mesh(earGeo, dogMat);
    leftEar.position.set(-0.28, 0.85, 0.45);
    const rightEar = new THREE.Mesh(earGeo, dogMat);
    rightEar.position.set(0.28, 0.85, 0.45);
    group.add(leftEar, rightEar);

    // Cute dog eyes (black)
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    const e1 = new THREE.Mesh(eyeGeo, blackMat);
    e1.position.set(-0.14, 1.0, 0.7);
    const e2 = new THREE.Mesh(eyeGeo, blackMat);
    e2.position.set(0.14, 1.0, 0.7);
    group.add(e1, e2);

    // FOUR legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.45, 0.16);
    
    const legFL = new THREE.Mesh(legGeo, dogMat);
    legFL.name = 'leg_fl';
    legFL.position.set(-0.2, 0.225, 0.35);
    
    const legFR = new THREE.Mesh(legGeo, dogMat);
    legFR.name = 'leg_fr';
    legFR.position.set(0.2, 0.225, 0.35);
    
    const legBL = new THREE.Mesh(legGeo, dogMat);
    legBL.name = 'leg_bl';
    legBL.position.set(-0.2, 0.225, -0.35);
    
    const legBR = new THREE.Mesh(legGeo, dogMat);
    legBR.name = 'leg_br';
    legBR.position.set(0.2, 0.225, -0.35);
    
    group.add(legFL, legFR, legBL, legBR);

    // Tail sticking out
    const tailGeo = new THREE.BoxGeometry(0.1, 0.35, 0.1);
    const tail = new THREE.Mesh(tailGeo, dogMat);
    tail.position.set(0, 0.7, -0.6);
    tail.rotation.x = -Math.PI / 4;
    group.add(tail);

  } else if (type === 'chicken') {
    // CHICKEN: white feathers, crazy eyes, red flap under yellow beak
    const whiteMat = hardTexturePack 
      ? new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.15 }) // shiny iron feathers
      : new THREE.MeshLambertMaterial({ color: 0xffffff });
    const orangeMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.9, roughness: 0.1 }) // dark iron legs/beak
      : new THREE.MeshLambertMaterial({ color: 0xff9900 });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.55, 0.7);
    const torso = new THREE.Mesh(torsoGeo, whiteMat);
    torso.position.y = 0.55;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const head = new THREE.Mesh(headGeo, whiteMat);
    head.name = 'head';
    head.position.set(0, 0.9, 0.2);
    group.add(head);

    // Yellow beak
    const beakGeo = new THREE.BoxGeometry(0.18, 0.12, 0.18);
    const beak = new THREE.Mesh(beakGeo, orangeMat);
    beak.position.set(0, 0.88, 0.44);
    group.add(beak);

    // Red flap under beak (wattle)
    const wattleGeo = new THREE.BoxGeometry(0.1, 0.18, 0.12);
    const wattle = new THREE.Mesh(wattleGeo, redMat);
    wattle.position.set(0, 0.74, 0.38);
    group.add(wattle);

    // Crazy-looking spaced-out googly eyes!
    // Left eye (white plate + black center)
    const eyeWhiteGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const leftEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeW.position.set(-0.19, 0.95, 0.28);
    
    const eyePupilGeo = new THREE.BoxGeometry(0.04, 0.06, 0.03);
    const leftEyeK = new THREE.Mesh(eyePupilGeo, blackMat);
    leftEyeK.position.set(-0.21, 0.95, 0.32); // Slightly outward cockeyed pupil!

    // Right eye (screwed up/cockeyed for that crazy pixelated look!)
    const rightEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeW.position.set(0.19, 0.95, 0.28);
    
    const rightEyeK = new THREE.Mesh(eyePupilGeo, blackMat);
    rightEyeK.position.set(0.20, 0.97, 0.32); 

    group.add(leftEyeW, leftEyeK, rightEyeW, rightEyeK);

    // Two orange legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
    
    const legL = new THREE.Mesh(legGeo, orangeMat);
    legL.name = 'leg_l';
    legL.position.set(-0.15, 0.2, -0.05);
    
    const legR = new THREE.Mesh(legGeo, orangeMat);
    legR.name = 'leg_r';
    legR.position.set(0.15, 0.2, -0.05);
    
    // Tiny orange feet claws
    const clawGeo = new THREE.BoxGeometry(0.15, 0.04, 0.18);
    const clawL = new THREE.Mesh(clawGeo, orangeMat);
    clawL.position.set(-0.15, 0.02, 0.02);
    const clawR = new THREE.Mesh(clawGeo, orangeMat);
    clawR.position.set(0.15, 0.02, 0.02);

    group.add(legL, legR, clawL, clawR);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.06, 0.32, 0.45);
    const wingL = new THREE.Mesh(wingGeo, whiteMat);
    wingL.position.set(-0.3, 0.55, 0.0);
    const wingR = new THREE.Mesh(wingGeo, whiteMat);
    wingR.position.set(0.3, 0.55, 0.0);
    group.add(wingL, wingR);

  } else if (type === 'cat') {
    // CAT: sleeker body, black/dark-slate voxel theme, triangle ears pixelated
    const catMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0x070712, metalness: 0.2, roughness: 0.1 }) // sleek shiny black obsidian glass
      : new THREE.MeshLambertMaterial({ color: 0x374151 }); // Dark charcoal grey kitty
    const noseMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0xc084fc, metalness: 0.2, roughness: 0.2 }) // purple nose
      : new THREE.MeshLambertMaterial({ color: 0xf472b6 }); // Pink nose
    const eyeMat = hardTexturePack
      ? new THREE.MeshBasicMaterial({ color: 0xd946ef }) // Glowing magenta obsidian eyes
      : new THREE.MeshLambertMaterial({ color: 0xfacc15 }); // Bright yellow green eyes!
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.4, 0.35, 0.95);
    const torso = new THREE.Mesh(torsoGeo, catMat);
    torso.position.y = 0.45;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const head = new THREE.Mesh(headGeo, catMat);
    head.name = 'head';
    head.position.set(0, 0.65, 0.42);
    group.add(head);

    // Pixelated triangle ears (Ears made of stacked box steps)
    const earY = 0.82;
    const earBaseLeftGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const earBaseLeft = new THREE.Mesh(earBaseLeftGeo, catMat);
    earBaseLeft.position.set(-0.14, earY, 0.4);
    
    const earTipLeftGeo = new THREE.BoxGeometry(0.06, 0.08, 0.08);
    const earTipLeft = new THREE.Mesh(earTipLeftGeo, catMat);
    earTipLeft.position.set(-0.16, earY + 0.08, 0.4);

    // Right ear
    const earBaseRight = new THREE.Mesh(earBaseLeftGeo, catMat);
    earBaseRight.position.set(0.14, earY, 0.4);
    
    const earTipRight = new THREE.Mesh(earTipLeftGeo, catMat);
    earTipRight.position.set(0.16, earY + 0.08, 0.4);

    group.add(earBaseLeft, earTipLeft, earBaseRight, earTipRight);

    // Yellow cat eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const e1 = new THREE.Mesh(eyeGeo, eyeMat);
    e1.position.set(-0.10, 0.70, 0.60);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat);
    e2.position.set(0.10, 0.70, 0.60);
    
    // Slit pupils!
    const slitGeo = new THREE.BoxGeometry(0.015, 0.06, 0.021);
    const s1 = new THREE.Mesh(slitGeo, blackMat);
    s1.position.set(-0.10, 0.70, 0.612);
    const s2 = new THREE.Mesh(slitGeo, blackMat);
    s2.position.set(0.10, 0.70, 0.612);
    
    group.add(e1, e2, s1, s2);

    // Snout and pink nose
    const snoutGeo = new THREE.BoxGeometry(0.16, 0.1, 0.1);
    const snout = new THREE.Mesh(snoutGeo, catMat);
    snout.position.set(0, 0.58, 0.60);
    
    const noseGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.61, 0.66);
    
    group.add(snout, nose);

    // Slim legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    
    const legFL = new THREE.Mesh(legGeo, catMat);
    legFL.name = 'leg_fl';
    legFL.position.set(-0.14, 0.175, 0.3);
    
    const legFR = new THREE.Mesh(legGeo, catMat);
    legFR.name = 'leg_fr';
    legFR.position.set(0.14, 0.175, 0.3);
    
    const legBL = new THREE.Mesh(legGeo, catMat);
    legBL.name = 'leg_bl';
    legBL.position.set(-0.14, 0.175, -0.3);
    
    const legBR = new THREE.Mesh(legGeo, catMat);
    legBR.name = 'leg_br';
    legBR.position.set(0.14, 0.175, -0.3);
    
    group.add(legFL, legFR, legBL, legBR);

    // Slender cat tail curved up on the back!
    const tailTail = new THREE.Group();
    tailTail.position.set(0, 0.55, -0.45);
    
    const tSeg1Geo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
    const tSeg1 = new THREE.Mesh(tSeg1Geo, catMat);
    tSeg1.position.set(0, 0.15, -0.1);
    tSeg1.rotation.x = Math.PI / 4;
    
    const tSeg2Geo = new THREE.BoxGeometry(0.08, 0.25, 0.08);
    const tSeg2 = new THREE.Mesh(tSeg2Geo, catMat);
    tSeg2.position.set(0, 0.35, -0.2);
    tSeg2.rotation.x = Math.PI / 2;
    
    tailTail.add(tSeg1, tSeg2);
    group.add(tailTail);
  } else if (type === 'cow') {
    // COW: blocky white and dark grey patterned body, brown horns, pink snout, four legs
    const whiteMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.82, roughness: 0.18 }) // silver iron plates
      : new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const patchMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.9, roughness: 0.2 }) // gunmetal rivets spots
      : new THREE.MeshLambertMaterial({ color: 0x27272a }); // dark pattern patches
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xfda4af }); // pink snout
    const hornMat = hardTexturePack
      ? new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.2 }) // brass horns
      : new THREE.MeshLambertMaterial({ color: 0xd4d4d8 }); // light grey horns
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso with some distinct patterned boxes overlaid to make spots!
    const torsoGeo = new THREE.BoxGeometry(0.9, 0.85, 1.3);
    const torso = new THREE.Mesh(torsoGeo, whiteMat);
    torso.position.y = 0.65;
    group.add(torso);

    // Dark spots on body
    const spot1Geo = new THREE.BoxGeometry(0.92, 0.4, 0.4);
    const spot1 = new THREE.Mesh(spot1Geo, patchMat);
    spot1.position.set(0.01, 0.7, 0.3);
    const spot2Geo = new THREE.BoxGeometry(0.4, 0.4, 0.92);
    const spot2 = new THREE.Mesh(spot2Geo, patchMat);
    spot2.position.set(-0.27, 0.65, -0.1);
    group.add(spot1, spot2);

    // Head
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.5);
    const head = new THREE.Mesh(headGeo, whiteMat);
    head.name = 'head';
    head.position.set(0, 1.15, 0.55);
    group.add(head);

    // Pink Snout / Muzzle
    const muzzleGeo = new THREE.BoxGeometry(0.35, 0.25, 0.18);
    const muzzle = new THREE.Mesh(muzzleGeo, pinkMat);
    muzzle.position.set(0, 1.0, 0.82);
    group.add(muzzle);

    // Black eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    const e1 = new THREE.Mesh(eyeGeo, eyeMat);
    e1.position.set(-0.16, 1.18, 0.8);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat);
    e2.position.set(0.16, 1.18, 0.8);
    group.add(e1, e2);

    // Horns
    const hornGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
    const h1 = new THREE.Mesh(hornGeo, hornMat);
    h1.position.set(-0.22, 1.48, 0.45);
    const h2 = new THREE.Mesh(hornGeo, hornMat);
    h2.position.set(0.22, 1.48, 0.45);
    group.add(h1, h2);

    // FOUR legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.22);
    
    const legFL = new THREE.Mesh(legGeo, whiteMat);
    legFL.name = 'leg_fl';
    legFL.position.set(-0.28, 0.275, 0.4);
    
    const legFR = new THREE.Mesh(legGeo, whiteMat);
    legFR.name = 'leg_fr';
    legFR.position.set(0.28, 0.275, 0.4);
    
    const legBL = new THREE.Mesh(legGeo, whiteMat);
    legBL.name = 'leg_bl';
    legBL.position.set(-0.28, 0.275, -0.4);
    
    const legBR = new THREE.Mesh(legGeo, whiteMat);
    legBR.name = 'leg_br';
    legBR.position.set(0.28, 0.275, -0.4);
    
    group.add(legFL, legFR, legBL, legBR);
  } else if (type === 'fish') {
    // FISH: sleek orange body, white and yellow stripes, wiggle-able tail fin!
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xff6b35 }); // fish orange
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xfffcf0 }); // yellow/white stripe
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso (sleek and compact)
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.28, 0.55);
    const body = new THREE.Mesh(bodyGeo, orangeMat);
    body.position.y = 0.25;
    group.add(body);

    // Side fins
    const finGeo = new THREE.BoxGeometry(0.12, 0.04, 0.16);
    const leftFin = new THREE.Mesh(finGeo, orangeMat);
    leftFin.name = 'left_fin';
    leftFin.position.set(-0.14, 0.22, 0.1);
    leftFin.rotation.z = -Math.PI / 6;

    const rightFin = new THREE.Mesh(finGeo, orangeMat);
    rightFin.name = 'right_fin';
    rightFin.position.set(0.14, 0.22, 0.1);
    rightFin.rotation.z = Math.PI / 6;
    group.add(leftFin, rightFin);

    // Stripe detail
    const stripeGeo = new THREE.BoxGeometry(0.18, 0.3, 0.1);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.25, 0);
    group.add(stripe);

    // Eyes on the sides!
    const eyeGeo = new THREE.BoxGeometry(0.04, 0.06, 0.06);
    const leftEye = new THREE.Mesh(eyeGeo, blackMat);
    leftEye.position.set(-0.09, 0.28, 0.16);
    
    const rightEye = new THREE.Mesh(eyeGeo, blackMat);
    rightEye.position.set(0.09, 0.28, 0.16);
    group.add(leftEye, rightEye);

    // Tail fin (wiggly pivot group name 'leg_l' so it is swept recursively, or we animate it separately by tag!)
    const tailPivot = new THREE.Group();
    tailPivot.name = 'tail_pivot'; // We can wiggle it in gameLoop!
    tailPivot.position.set(0, 0.25, -0.28);

    const finTailGeo = new THREE.BoxGeometry(0.02, 0.2, 0.18);
    const finTail = new THREE.Mesh(finTailGeo, orangeMat);
    finTail.position.set(0, 0, -0.09);
    tailPivot.add(finTail);
    group.add(tailPivot);
  }

  // Cast shadow
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export const LimecraftGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [selectedBlock, setSelectedBlock] = useState<BlockType>(BlockType.GRASS);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 15, z: 0 });
  const [playerLook, setPlayerLook] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const [gameScreen, setGameScreen] = useState<'menu' | 'select_singleplayer' | 'create_world' | 'playing'>('menu');
  const [seedType, setSeedType] = useState<number>(1);
  const [worldNameInput, setWorldNameInput] = useState('My Beautiful Earth');
  const [blockCounts, setBlockCounts] = useState<Record<BlockType, number>>({
    [BlockType.AIR]: 0,
    [BlockType.GRASS]: 0,
    [BlockType.WOOD]: 0,
    [BlockType.STONE]: 0,
    [BlockType.COBBLESTONE]: 0,
    [BlockType.MOSSY_COBBLE]: 0,
    [BlockType.LEAVES]: 0,
  });

  const [isCommandBoxOpen, setIsCommandBoxOpen] = useState(false);
  const [chatLogs, setChatLogs] = useState<string[]>([
    '🤖 System: Welcome to Limecraft Sandbox Voxel Engine.',
    '⌨️ Guide: Press "T" or "/" to open the Command typing input console.',
    '⚡ Hint: Enter "tp 1003993" to teleport directly to the Glitchy Death Lands!'
  ]);

  const [isDreaming, setIsDreaming] = useState(false);
  const [isSleepingTransition, setIsSleepingTransition] = useState(false);

  // Gamepad Connection status states
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState('');

  // Rotting Dimension states
  const [isRottingDimension, setIsRottingDimension] = useState(false);
  const [isRottingTransition, setIsRottingTransition] = useState(false);
  const [activeWorldId, setActiveWorldId] = useState<string>('default_v1');
  const [seedStringInput, setSeedStringInput] = useState('777123');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [currentCustomParams, setCurrentCustomParams] = useState<any>(null);

  interface CustomWorld {
    id: string;
    name: string;
    seedString: string;
    seedType: number; // 1, 2, 3, 4, 5, 6, 842
    flatWorld: boolean;
    customParams?: any;
    customDescription?: string;
  }

  const [savedWorlds, setSavedWorlds] = useState<CustomWorld[]>(() => {
    try {
      const saved = localStorage.getItem('limecraft_saved_worlds_list_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const realWorldBackupRef = useRef<{
    world: WorldData;
    worldByChunk: Record<string, Record<string, BlockType>>;
    generatedChunks: Record<string, boolean>;
    playerPosition: THREE.Vector3;
  } | null>(null);

  const rottingWorldBackupRef = useRef<{
    world: WorldData;
    worldByChunk: Record<string, Record<string, BlockType>>;
    generatedChunks: Record<string, boolean>;
    playerPosition: THREE.Vector3;
  } | null>(null);

  const mobsRef = useRef<{
    id: string;
    type: 'pig' | 'chicken' | 'cat' | 'dog' | 'cow' | 'fish';
    mesh: THREE.Group;
  }[]>([]);

  const [settings, setSettings] = useState<GameSettings>({
    renderDistance: 3,
    fov: 75,
    flyMode: false,
    gravity: true,
    wireframe: false,
    soundEnabled: true,
    showCoordinates: true,
    autoSave: true,
    flatWorld: false,
    infiniteBlocks: true,
    hardTexturePack: false,
  });

  const spookyEntitiesRef = useRef<THREE.Group[]>([]);

  // Refs for tracking mutable game loop structures
  const stateRef = useRef({
    world: {} as WorldData,
    worldByChunk: {} as Record<string, Record<string, BlockType>>,
    waterFlows: {} as Record<string, number>,
    settings: { ...settings },
    selectedBlock: selectedBlock,
    playerPosition: new THREE.Vector3(0, 15, 0),
    playerVelocity: new THREE.Vector3(0, 0, 0),
    playerLookYaw: 0,
    playerLookPitch: 0,
    isGrounded: false,
    keys: {} as Record<string, boolean>,
    physicsTime: performance.now(),
    materials: {} as Record<BlockType, THREE.Material>,
    instancedMeshes: {} as Record<BlockType, THREE.InstancedMesh>,
    instancedBlockCoords: {} as Record<BlockType, string[]>,
    generatedChunks: {} as Record<string, boolean>,
    lastChunkX: -999,
    lastChunkZ: -999,
    gameScreen: 'menu' as 'menu' | 'select_singleplayer' | 'create_world' | 'playing',
    seedType: 1 as number,
    seedString: '777123' as string,
    customParams: null as any,
    isCommandBoxOpen: false as boolean,
    isDreaming: false as boolean,
    isRottingDimension: false as boolean,
    activeWorldId: 'default_v1' as string,
    gamepadConnected: false as boolean,
    gamepadLastButtons: {} as Record<number, boolean>,
    gamepadMineCooldown: 0 as number,
    gamepadPlaceCooldown: 0 as number,
  });

  // Initialize refs when states update
  useEffect(() => {
    stateRef.current.settings = settings;
  }, [settings]);

  useEffect(() => {
    stateRef.current.selectedBlock = selectedBlock;
  }, [selectedBlock]);

  useEffect(() => {
    stateRef.current.gameScreen = gameScreen;
  }, [gameScreen]);

  useEffect(() => {
    stateRef.current.seedType = seedType;
  }, [seedType]);

  useEffect(() => {
    stateRef.current.isCommandBoxOpen = isCommandBoxOpen;
  }, [isCommandBoxOpen]);

  useEffect(() => {
    stateRef.current.isDreaming = isDreaming;
  }, [isDreaming]);

  useEffect(() => {
    stateRef.current.isRottingDimension = isRottingDimension;
  }, [isRottingDimension]);

  useEffect(() => {
    stateRef.current.activeWorldId = activeWorldId;
  }, [activeWorldId]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (isDreaming) {
      scene.background = new THREE.Color('#2e1065'); // Deep sleep dark-grape violet
      scene.fog = new THREE.FogExp2('#0f051d', 0.03); // Deep night violet fog
      if (ambientLightRef.current) ambientLightRef.current.color.set('#f472b6'); // Pastel pink ambient glow!
      if (dirLightRef.current) {
        dirLightRef.current.color.set('#c084fc'); // Sleepy light-purple directional light
        dirLightRef.current.position.set(0, 30, 20); // softer moon height
      }
    } else if (isRottingDimension) {
      scene.background = new THREE.Color('#310a0a'); // Deep dark blood crimson sky
      scene.fog = new THREE.FogExp2('#110202', 0.04); // Creepy red fog
      if (ambientLightRef.current) ambientLightRef.current.color.set('#3a3a41'); // Dim grey decaying ambient light
      if (dirLightRef.current) {
        dirLightRef.current.color.set('#b91c1c'); // Eerie blood-red sun rays
        dirLightRef.current.position.set(5, 40, 5); // zenith sun
      }
    } else if (settings.hardTexturePack) {
      // Hard Texture Pack diamond-like celestial skybox
      scene.background = new THREE.Color('#cfeefb'); // sparkling pale diamond light cyan
      scene.fog = new THREE.FogExp2('#164e63', 0.022); // crystalline sapphire cyan-teal horizon fog
      if (ambientLightRef.current) ambientLightRef.current.color.set('#93c5fd'); // silver cyan sky reflection
      if (dirLightRef.current) {
        dirLightRef.current.color.set('#ecfeff'); // hyper-bright white-blue diamond rays
        dirLightRef.current.position.set(25, 45, 15);
      }
    } else {
      const isTealSky = seedType === 133 || seedType === 143 || stateRef.current.seedString === '133' || stateRef.current.seedString === '143';
      const isDarkBlueSky = seedType === 233 || stateRef.current.seedString === '233';
      const skyHex = isDarkBlueSky ? '#111d42' : (isTealSky ? '#14b8a6' : '#7ec0ee'); // Dark blue vs Teal vs standard sky blue
      scene.background = new THREE.Color(skyHex);
      scene.fog = new THREE.FogExp2(isDarkBlueSky ? '#0c111d' : skyHex, 0.025); // custom fog for dark blue sky
      if (ambientLightRef.current) ambientLightRef.current.color.set(isDarkBlueSky ? '#a5b4fc' : '#ffffff');
      if (dirLightRef.current) {
        dirLightRef.current.color.set(isDarkBlueSky ? '#c7d2fe' : '#fffced');
        dirLightRef.current.position.set(20, 40, 10);
      }
    }
  }, [isDreaming, isRottingDimension, seedType, activeWorldId, settings.hardTexturePack]);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const blockWireframeRef = useRef<THREE.LineSegments | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Shared Box Geometry for voxel blocks
  const blockGeometryRef = useRef<THREE.BoxGeometry | null>(null);
  const dirtPathGeometryRef = useRef<THREE.BoxGeometry | null>(null);

  const setBlockState = useCallback((key: string, val: BlockType) => {
    const state = stateRef.current;
    const [bx, , bz] = key.split(',').map(Number);
    const cx = Math.floor(bx / 16);
    const cz = Math.floor(bz / 16);
    const chunkKey = `${cx},${cz}`;

    if (val === BlockType.AIR) {
      delete state.world[key];
      if (state.worldByChunk && state.worldByChunk[chunkKey]) {
        delete state.worldByChunk[chunkKey][key];
      }
    } else {
      state.world[key] = val;
      if (!state.worldByChunk) state.worldByChunk = {};
      if (!state.worldByChunk[chunkKey]) state.worldByChunk[chunkKey] = {};
      state.worldByChunk[chunkKey][key] = val;
    }
  }, []);

  const getStorageKeyForWorld = (worldId: string) => {
    return `limecraft_world_blocks_${worldId}`;
  };

  // Load world from localstorage or generate fresh
  const initWorldData = useCallback((useFlat = false, activeSeed = 1, forceFresh = false) => {
    const state = stateRef.current;
    
    if (state.activeWorldId === 'default_v1') {
      state.seedString = '777123';
      state.customParams = null;
    } else {
      const activeCustomWorld = savedWorlds.find(w => w.id === state.activeWorldId);
      state.seedString = activeCustomWorld ? activeCustomWorld.seedString : '777123';
      state.customParams = activeCustomWorld?.customParams || null;
    }

    try {
      const storageKey = state.activeWorldId === 'default_v1' ? LOCAL_STORAGE_KEY : getStorageKeyForWorld(state.activeWorldId);
      const saved = localStorage.getItem(storageKey);
      if (saved && !useFlat && !forceFresh) {
        const parsed = JSON.parse(saved) as WorldData;
        state.world = parsed;
        
        // Scan loaded coordinates and populate generatedChunks and worldByChunk
        state.generatedChunks = {};
        state.worldByChunk = {};
        Object.entries(parsed).forEach(([key, val]) => {
          const [bx, , bz] = key.split(',').map(Number);
          const cx = Math.floor(bx / 16);
          const cz = Math.floor(bz / 16);
          const chunkKey = `${cx},${cz}`;
          state.generatedChunks[chunkKey] = true;
          if (!state.worldByChunk[chunkKey]) {
            state.worldByChunk[chunkKey] = {};
          }
          state.worldByChunk[chunkKey][key] = val;
        });
        return;
      }
    } catch (e) {
      console.error('Failed to load saved world', e);
    }
    // Fallback: Generate starting chunks from cx=-2 to 2 and cz=-2 to 2 continuously to prevent any gaps/holes
    state.world = {};
    state.generatedChunks = {};
    state.worldByChunk = {};
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        state.generatedChunks[`${cx},${cz}`] = true;
        const tempWorld: WorldData = {};
        generateChunk(
          tempWorld,
          cx,
          cz,
          useFlat,
          0.02,
          activeSeed,
          state.isDreaming,
          state.isRottingDimension,
          state.seedString,
          state.customParams
        );
        Object.assign(state.world, tempWorld);
        state.worldByChunk[`${cx},${cz}`] = tempWorld;
      }
    }

    // Spawn initial circular cobblestone/mossy cobblestone ruins around spawning ground [0, Y, 0] ONLY for Seed 1
    if (activeSeed !== 2) {
      const baseHeight = 6;
      const terrainAmplitude = 5;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const rx = Math.round(Math.cos(angle) * 6);
        const rz = Math.round(Math.sin(angle) * 6);
        
        let hy = baseHeight;
        if (!useFlat) {
          const wave1 = Math.sin(rx * 0.07) * Math.cos(rz * 0.07);
          const wave2 = Math.sin(rx * 0.15 + 1.2) * Math.cos(rz * 0.23);
          hy = Math.floor(baseHeight + wave1 * terrainAmplitude + wave2 * 1.5);
        }
        hy = Math.max(2, hy);

        const rockKey1 = `${rx},${hy + 1},${rz}`;
        const rockKey2 = `${rx},${hy + 2},${rz}`;
        setBlockState(rockKey1, Math.random() > 0.4 ? BlockType.MOSSY_COBBLE : BlockType.COBBLESTONE);
        if (Math.random() > 0.5) {
          setBlockState(rockKey2, Math.random() > 0.5 ? BlockType.MOSSY_COBBLE : BlockType.COBBLESTONE);
        }
      }
    }
  }, [setBlockState]);

  // Recalculates surface occlusion and updates scene meshes efficiently using InstancedMesh
  const rebuildWorldMeshes = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const state = stateRef.current;
    const geometry = blockGeometryRef.current;
    if (!geometry) return;

    // Dispose and remove all existing instanced meshes
    if (!state.instancedMeshes) {
      state.instancedMeshes = {} as Record<BlockType, THREE.InstancedMesh>;
    }
    if (!state.instancedBlockCoords) {
      state.instancedBlockCoords = {} as Record<BlockType, string[]>;
    }

    Object.keys(state.instancedMeshes).forEach((key) => {
      const type = parseInt(key) as BlockType;
      const mesh = state.instancedMeshes[type];
      if (mesh) {
        scene.remove(mesh);
        mesh.dispose();
      }
    });
    state.instancedMeshes = {} as Record<BlockType, THREE.InstancedMesh>;
    state.instancedBlockCoords = {} as Record<BlockType, string[]>;

    // Counts tracking
    const counts: Record<BlockType, number> = {
      [BlockType.AIR]: 0,
      [BlockType.GRASS]: 0,
      [BlockType.WOOD]: 0,
      [BlockType.STONE]: 0,
      [BlockType.COBBLESTONE]: 0,
      [BlockType.MOSSY_COBBLE]: 0,
      [BlockType.LEAVES]: 0,
      [BlockType.CRAFT_TABLE]: 0,
      [BlockType.BRICK]: 0,
      [BlockType.CHEST]: 0,
      [BlockType.CABINET]: 0,
      [BlockType.MEAT]: 0,
      [BlockType.DIAMOND]: 0,
      [BlockType.DIAMOND_ITEM]: 0,
      [BlockType.BIRCH]: 0,
      [BlockType.BED]: 0,
      [BlockType.DIRT_PATH]: 0,
      [BlockType.RUOTK]: 0,
      [BlockType.WATER]: 0,
      [BlockType.GOLD_SHARD]: 0,
      [BlockType.GOLD_BLOCK]: 0,
      [BlockType.SAND]: 0,
      [BlockType.COCONUT]: 0,
      [BlockType.COCONUT_MILK]: 0,
      [BlockType.EMERALD]: 0,
      [BlockType.THICK_WOOD]: 0,
    };

    // Calculate rendering boundary relative to the player
    const px = Math.round(state.playerPosition.x);
    const pz = Math.round(state.playerPosition.z);
    
    // View distance block radius (renderDistance * size of 16 blocks per chunk)
    const radius = Math.max(32, (state.settings.renderDistance || 3) * 16);

    const visibleBlocksByType: Record<BlockType, string[]> = {
      [BlockType.AIR]: [],
      [BlockType.GRASS]: [],
      [BlockType.WOOD]: [],
      [BlockType.STONE]: [],
      [BlockType.COBBLESTONE]: [],
      [BlockType.MOSSY_COBBLE]: [],
      [BlockType.LEAVES]: [],
      [BlockType.CRAFT_TABLE]: [],
      [BlockType.BRICK]: [],
      [BlockType.CHEST]: [],
      [BlockType.CABINET]: [],
      [BlockType.MEAT]: [],
      [BlockType.DIAMOND]: [],
      [BlockType.DIAMOND_ITEM]: [],
      [BlockType.BIRCH]: [],
      [BlockType.BED]: [],
      [BlockType.DIRT_PATH]: [],
      [BlockType.RUOTK]: [],
      [BlockType.WATER]: [],
      [BlockType.GOLD_SHARD]: [],
      [BlockType.GOLD_BLOCK]: [],
      [BlockType.SAND]: [],
      [BlockType.COCONUT]: [],
      [BlockType.COCONUT_MILK]: [],
      [BlockType.EMERALD]: [],
      [BlockType.THICK_WOOD]: [],
    };

    // Instead of Object.entries(state.world), we build block counts by iterating through state.worldByChunk
    if (state.worldByChunk) {
      Object.keys(state.worldByChunk).forEach((cKey) => {
        const chunkBlocks = state.worldByChunk[cKey];
        if (!chunkBlocks) return;
        Object.keys(chunkBlocks).forEach((key) => {
          const type = chunkBlocks[key];
          if (type !== BlockType.AIR) {
            counts[type] = (counts[type] || 0) + 1;
          }
        });
      });
    }

    // Now, ONLY query blocks from the chunks that are within the render distance!
    const cx = Math.floor(px / 16);
    const cz = Math.floor(pz / 16);
    const chunkRadius = state.settings.renderDistance || 3;

    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
        const ccx = cx + dx;
        const ccz = cz + dz;
        const chunkKey = `${ccx},${ccz}`;
        const chunkBlocks = state.worldByChunk ? state.worldByChunk[chunkKey] : null;
        if (!chunkBlocks) continue;

        const keys = Object.keys(chunkBlocks);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const type = chunkBlocks[key];
          if (type === BlockType.AIR) continue;

          const [xStr, yStr, zStr] = key.split(',');
          const bx = parseInt(xStr);
          const by = parseInt(yStr);
          const bz = parseInt(zStr);

          // Distant block culling
          if (Math.abs(bx - px) > radius || Math.abs(bz - pz) > radius) {
            continue;
          }

          // Check adjacent 6 blocks to see if this block is fully hidden
          const neighbors = [
            `${bx + 1},${by},${bz}`,
            `${bx - 1},${by},${bz}`,
            `${bx},${by + 1},${bz}`,
            `${bx},${by - 1},${bz}`,
            `${bx},${by},${bz + 1}`,
            `${bx},${by},${bz - 1}`,
          ];

          const isOccluded = neighbors.every((nKey) => {
            const nType = state.world[nKey];
            // Leaves are translucent, so they never occlude adjacent blocks
            return nType && nType !== BlockType.AIR && nType !== BlockType.LEAVES;
          });

          if (!isOccluded) {
            if (visibleBlocksByType[type]) {
              visibleBlocksByType[type].push(key);
            }
          }
        }
      }
    }

    const dummy = new THREE.Object3D();
    Object.keys(visibleBlocksByType).forEach((key) => {
      const type = parseInt(key) as BlockType;
      const coords = visibleBlocksByType[type];
      if (coords && coords.length > 0) {
        const mat = state.materials[type];
        if (mat) {
          // One-pixel smaller Dirt Path uses its custom dirtPathGeometryRef geometry
          const curGeometry = type === BlockType.DIRT_PATH 
            ? (dirtPathGeometryRef.current || geometry) 
            : geometry;

          const instMesh = new THREE.InstancedMesh(curGeometry, mat, coords.length);
          instMesh.userData = { blockType: type };
          instMesh.castShadow = true;
          instMesh.receiveShadow = true;

          coords.forEach((cKey, idx) => {
            const [bx, by, bz] = cKey.split(',').map(Number);
            // Height-shift alignment: shift down by half of the 1/16th height (0.0625 / 2 = 0.03125)
            // to rest perfectly flatly with standard block bottoms
            if (type === BlockType.DIRT_PATH) {
              dummy.position.set(bx, by - 0.03125, bz);
            } else {
              dummy.position.set(bx, by, bz);
            }
            dummy.updateMatrix();
            instMesh.setMatrixAt(idx, dummy.matrix);
          });

          instMesh.instanceMatrix.needsUpdate = true;
          scene.add(instMesh);

          state.instancedMeshes[type] = instMesh;
          state.instancedBlockCoords[type] = coords;
        }
      }
    });

    setBlockCounts(counts);
  }, []);

  // Re-creates materials map whenever wireframe setting changes
  const rebuildMaterials = useCallback(() => {
    const state = stateRef.current;
    state.materials = getSharedMaterials(state.settings.wireframe, state.settings.hardTexturePack);
    rebuildWorldMeshes();
  }, [rebuildWorldMeshes]);

  // Saves state into localstorage
  const saveWorld = useCallback(() => {
    try {
      const state = stateRef.current;
      const storageKey = state.activeWorldId === 'default_v1' ? LOCAL_STORAGE_KEY : getStorageKeyForWorld(state.activeWorldId);
      localStorage.setItem(storageKey, JSON.stringify(state.world));
      window.dispatchEvent(new CustomEvent('show-game-notification', { detail: "💾 Limecraft sandbox seed world saved successfully!" }));
    } catch (e) {
      console.error('Failed to save', e);
    }
  }, []);

  // Resets world to default procedural sector
  const resetWorld = useCallback(() => {
    if (window.confirm('Are you sure you want to completely regenerate this Limecraft sector? All customized constructions will be cleared.')) {
      initWorldData(settings.flatWorld);
      
      // Safety spawn
      const state = stateRef.current;
      state.playerPosition.set(0, 15, 0);
      state.playerVelocity.set(0, 0, 0);
      state.playerLookYaw = 0;
      state.playerLookPitch = 0;
      state.lastChunkX = -999;
      state.lastChunkZ = -999;
      setPlayerLook({ yaw: 0, pitch: 0 });

      rebuildWorldMeshes();
    }
  }, [initWorldData, rebuildWorldMeshes, settings.flatWorld]);

  // Synchronize and generate infinite procedural terrain chunks
  const checkAndSyncChunks = useCallback(() => {
    const state = stateRef.current;
    const cx = Math.floor(state.playerPosition.x / 16);
    const cz = Math.floor(state.playerPosition.z / 16);

    const radius = state.settings.renderDistance || 3;
    let generatedAny = false;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const ccx = cx + dx;
        const ccz = cz + dz;
        const chunkKey = `${ccx},${ccz}`;
        
        if (!state.generatedChunks[chunkKey]) {
          state.generatedChunks[chunkKey] = true;
          const tempWorld: WorldData = {};
          generateChunk(
            tempWorld,
            ccx,
            ccz,
            state.settings.flatWorld,
            0.02,
            state.seedType,
            state.isDreaming,
            state.isRottingDimension,
            state.seedString,
            state.customParams
          );
          Object.assign(state.world, tempWorld);
          if (!state.worldByChunk) state.worldByChunk = {};
          state.worldByChunk[chunkKey] = tempWorld;
          generatedAny = true;
        }
      }
    }

    if (cx !== state.lastChunkX || cz !== state.lastChunkZ || generatedAny) {
      state.lastChunkX = cx;
      state.lastChunkZ = cz;
      rebuildWorldMeshes();
    }
  }, [rebuildWorldMeshes]);

  // Teleport in or out of the decaying rotting dimension
  const triggerRottingPortalTeleport = useCallback(() => {
    const state = stateRef.current;
    setIsRottingTransition(true);

    setTimeout(() => {
      if (!stateRef.current.isRottingDimension) {
        // TELEPORT TO ROTTING DIMENSION!
        // Backup real world state
        rottingWorldBackupRef.current = {
          world: { ...state.world },
          worldByChunk: JSON.parse(JSON.stringify(state.worldByChunk || {})),
          generatedChunks: { ...state.generatedChunks },
          playerPosition: state.playerPosition.clone(),
        };

        // Wipe current world memory so we generate rotting landscape chunks
        state.world = {};
        state.worldByChunk = {};
        state.generatedChunks = {};

        // Switch to rotting dimension!
        setIsRottingDimension(true);
        stateRef.current.isRottingDimension = true;

        // Force generate starting rotting chunks
        for (let cx = -2; cx <= 2; cx++) {
          for (let cz = -2; cz <= 2; cz++) {
            state.generatedChunks[`${cx},${cz}`] = true;
            const tempWorld: WorldData = {};
            generateChunk(
              tempWorld,
              cx,
              cz,
              settings.flatWorld,
              0.02,
              stateRef.current.seedType,
              stateRef.current.isDreaming,
              true,
              stateRef.current.seedString,
              stateRef.current.customParams
            );
            Object.assign(state.world, tempWorld);
            state.worldByChunk[`${cx},${cz}`] = tempWorld;
          }
        }

        // Spawn player atop the rotting chunk heights
        state.playerPosition.set(0, 16, 0);
        state.playerVelocity.set(0, 0, 0);
        state.playerLookYaw = 0;
        state.playerLookPitch = 0;
        state.lastChunkX = -999;
        state.lastChunkZ = -999;
        setPlayerCoords({ x: 0, y: 16, z: 0 });

        checkAndSyncChunks();
        rebuildWorldMeshes();

        setChatLogs(prev => [...prev, '🌀 Portal active: Entered the Glitchy Rotting Dimension with blood red sky. Blocks are decaying under your feet.']);
      } else {
        // TELEPORT BACK TO REAL WORLD!
        if (rottingWorldBackupRef.current) {
          const backup = rottingWorldBackupRef.current;
          state.world = backup.world;
          state.worldByChunk = backup.worldByChunk;
          state.generatedChunks = backup.generatedChunks;
          state.playerPosition.copy(backup.playerPosition);
          state.playerVelocity.set(0, 0, 0);
          state.lastChunkX = -999;
          state.lastChunkZ = -999;
          
          setPlayerCoords({
            x: Math.round(backup.playerPosition.x),
            y: Math.round(backup.playerPosition.y),
            z: Math.round(backup.playerPosition.z),
          });
        } else {
          // Absolute fallback
          state.world = {};
          state.worldByChunk = {};
          state.generatedChunks = {};
          initWorldData(settings.flatWorld, state.seedType, true);
          state.playerPosition.set(0, 15, 0);
        }

        setIsRottingDimension(false);
        stateRef.current.isRottingDimension = false;

        checkAndSyncChunks();
        rebuildWorldMeshes();

        setChatLogs(prev => [...prev, '🌍 Portal active: Returned to standard dimension workspace.']);
      }

      setIsRottingTransition(false);
    }, 1500);
  }, [initWorldData, checkAndSyncChunks, rebuildWorldMeshes, settings.flatWorld]);

  // Scan hollow square frame around of placed ruotk blocks
  const checkAndTriggerRottingPortal = useCallback((bx: number, by: number, bz: number) => {
    const state = stateRef.current;
    
    // Check offsets up to 4 blocks on XY, ZY, and XZ axes to locate a 5x5 ruotk frame
    for (let offset = -4; offset <= 0; offset++) {
      // XY vertical frame
      for (let cx = bx + offset; cx <= bx + offset; cx++) {
        for (let cy = by + offset; cy <= by + offset; cy++) {
          let isFrame = true;
          for (let dx = 0; dx < 5; dx++) {
            for (let dy = 0; dy < 5; dy++) {
              if (dx === 0 || dx === 4 || dy === 0 || dy === 4) {
                const key = `${cx + dx},${cy + dy},${bz}`;
                if (state.world[key] !== BlockType.RUOTK) {
                  isFrame = false;
                  break;
                }
              }
            }
            if (!isFrame) break;
          }
          if (isFrame) {
            triggerRottingPortalTeleport();
            return;
          }
        }
      }

      // ZY vertical frame
      for (let cz = bz + offset; cz <= bz + offset; cz++) {
        for (let cy = by + offset; cy <= by + offset; cy++) {
          let isFrame = true;
          for (let dz = 0; dz < 5; dz++) {
            for (let dy = 0; dy < 5; dy++) {
              if (dz === 0 || dz === 4 || dy === 0 || dy === 4) {
                const key = `${bx},${cy + dy},${cz + dz}`;
                if (state.world[key] !== BlockType.RUOTK) {
                  isFrame = false;
                  break;
                }
              }
            }
            if (!isFrame) break;
          }
          if (isFrame) {
            triggerRottingPortalTeleport();
            return;
          }
        }
      }

      // XZ horizontal frame
      for (let cx = bx + offset; cx <= bx + offset; cx++) {
        for (let cz = bz + offset; cz <= bz + offset; cz++) {
          let isFrame = true;
          for (let dx = 0; dx < 5; dx++) {
            for (let dz = 0; dz < 5; dz++) {
              if (dx === 0 || dx === 4 || dz === 0 || dz === 4) {
                const key = `${cx + dx},${by},${cz + dz}`;
                if (state.world[key] !== BlockType.RUOTK) {
                  isFrame = false;
                  break;
                }
              }
            }
            if (!isFrame) break;
          }
          if (isFrame) {
            triggerRottingPortalTeleport();
            return;
          }
        }
      }
    }
  }, [triggerRottingPortalTeleport]);

  // Handle sleep in bed transitions and dreamworld terrain/mobs generation
  const handleSleepAndDream = useCallback(() => {
    setIsSleepingTransition(true);
    
    setChatLogs(prev => [
      ...prev,
      isDreaming 
        ? '☀️ System: Waking up from your dream... Re-entering reality!' 
        : '💤 System: Falling asleep in a cozy bed... zZz... zZz...'
    ]);

    setTimeout(() => {
      const state = stateRef.current;
      
      if (!isDreaming) {
        // ENTERING DREAM
        // Backup real world structures safely
        realWorldBackupRef.current = {
          world: { ...state.world },
          worldByChunk: JSON.parse(JSON.stringify(state.worldByChunk || {})),
          generatedChunks: { ...state.generatedChunks },
          playerPosition: state.playerPosition.clone()
        };

        setIsDreaming(true);

        // Reset world structures so that chunk synchronization procedurally loads only dream world blocks!
        state.world = {};
        state.worldByChunk = {};
        state.generatedChunks = {};
        state.lastChunkX = -999;
        state.lastChunkZ = -999;

        // Space out coordinate at (0, 18, 0)
        state.playerPosition.set(0, 18, 0);
        state.playerVelocity.set(0, 0, 0);

        setChatLogs(prev => [
          ...prev,
          '🌈 Dream: "Wait... where am I? This is a sleepy, checkerboard dreamland!"',
          '🐾 Hint: Look around! Pigs, chickens, cats, and dogs are wandering here!'
        ]);
        
        // Spawn standard dream animals
        setTimeout(() => {
          const scene = sceneRef.current;
          if (scene) {
            const spawnTypes: ('pig' | 'chicken' | 'cat' | 'dog')[] = [
              'pig', 'pig', 
              'chicken', 'chicken', 
              'cat', 'cat', 
              'dog', 'dog'
            ];

            // Safely clear old mob groups
            mobsRef.current.forEach(m => scene.remove(m.mesh));
            mobsRef.current = [];

            spawnTypes.forEach((t, i) => {
              const mesh = createMobGroup(t, stateRef.current.settings.hardTexturePack);
              const rx = (Math.random() - 0.5) * 16;
              const rz = (Math.random() - 0.5) * 16;
              mesh.position.set(rx, 15, rz);
              scene.add(mesh);
              
              mobsRef.current.push({
                id: `${t}_${i}_${Date.now()}`,
                type: t,
                mesh: mesh
              });
            });
          }
        }, 100);

      } else {
        // LEAVING DREAM
        setIsDreaming(false);

        if (realWorldBackupRef.current) {
          const backup = realWorldBackupRef.current;
          state.world = { ...backup.world };
          state.worldByChunk = backup.worldByChunk;
          state.generatedChunks = backup.generatedChunks;
          state.playerPosition.copy(backup.playerPosition);
          state.playerVelocity.set(0, 0, 0);
          realWorldBackupRef.current = null;
        } else {
          state.world = {};
          state.worldByChunk = {};
          state.generatedChunks = {};
          state.playerPosition.set(0, 15, 0);
        }

        state.lastChunkX = -999;
        state.lastChunkZ = -999;

        // Clean up active dream mobs on wakeup
        const scene = sceneRef.current;
        if (scene) {
          mobsRef.current.forEach(m => scene.remove(m.mesh));
          mobsRef.current = [];
        }

        setChatLogs(prev => [
          ...prev,
          '🏠 System: Woke up in your warm blankets. It was all a dream...'
        ]);
      }

      // Procedurally regenerate and remap meshes
      setTimeout(() => {
        checkAndSyncChunks();
        rebuildWorldMeshes();
        setIsSleepingTransition(false);
      }, 500);

    }, 2000);

  }, [isDreaming, checkAndSyncChunks, rebuildWorldMeshes]);

  // Spooky red-eyed pitch-black humanoid entity for glitch lands
  const createSpookyEntity = useCallback(() => {
    const group = new THREE.Group();

    // Material: pitch black void-like surface
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x010101 });
    // Glowing red eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.95, 0.3);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 0.95;
    group.add(torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.6;
    group.add(head);

    // 3. Eyes (red dots) on the front of head (z = +0.225)
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 1.63, 0.23);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.11, 1.63, 0.23);
    group.add(rightEye);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.85, 0.18);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.35, 0.9, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.35, 0.9, 0);
    group.add(rightArm);

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.95, 0.18);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.13, 0.47, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.13, 0.47, 0);
    group.add(rightLeg);

    return group;
  }, []);

  // Sandbox Command Console Execution Parser
  const handleExecuteCommand = useCallback((rawCommand: string) => {
    const cmd = rawCommand.trim().toLowerCase();
    
    // Add command execution to logs
    setChatLogs(prev => [...prev, `> ${rawCommand}`]);

    if (!cmd) return;

    // Check sleep / dream commands
    if (cmd === 'sleep' || cmd === '/sleep' || cmd === 'dream' || cmd === '/dream') {
      handleSleepAndDream();
      return;
    }

    // Check spawn animal commands
    const spawnRegex = /^\/?spawn\s+(pig|chicken|cat|dog|cow|fish)$/;
    const spawnMatch = cmd.match(spawnRegex);
    if (spawnMatch) {
      const animal = spawnMatch[1] as 'pig' | 'chicken' | 'cat' | 'dog' | 'cow' | 'fish';
      const scene = sceneRef.current;
      if (scene) {
        const mesh = createMobGroup(animal, stateRef.current.settings.hardTexturePack);
        const state = stateRef.current;
        // Position animal 2.5 units in front of player direction
        const yaw = state.playerLookYaw;
        const forward = new THREE.Vector3(
          -Math.sin(yaw),
          0,
          -Math.cos(yaw)
        ).normalize();
        
        const spawnPos = state.playerPosition.clone().addScaledVector(forward, 2.5);
        spawnPos.y = Math.max(0, state.playerPosition.y - 1.55);
        
        mesh.position.copy(spawnPos);
        mesh.rotation.y = yaw + Math.PI; // Face the player!
        
        scene.add(mesh);
        mobsRef.current.push({
          id: `${animal}_${Date.now()}`,
          type: animal,
          mesh: mesh
        });
        
        const emoji = animal === 'dog' ? '🐶' : animal === 'cat' ? '🐱' : animal === 'pig' ? '🐷' : animal === 'chicken' ? '🐔' : animal === 'cow' ? '🐮' : '🐟';
        setChatLogs(prev => [...prev, `✨ ${emoji} summoned a cozy, adorable pixelated ${animal}!`]);
        return;
      }
    }

    // Check basic tp command
    const tpRegex = /^\/?tp\s+(.+)$/;
    const tpMatch = cmd.match(tpRegex);
    if (tpMatch) {
      const args = tpMatch[1].trim().split(/\s+/);
      const state = stateRef.current;
      
      if (args[0] === '1003993') {
        // Warping directly to Glitch Lands coordinates!
        state.playerPosition.set(1003993, 35, 1003993);
        state.playerVelocity.set(0, 0, 0);
        setPlayerCoords({ x: 1003993, y: 35, z: 1003993 });
        
        // Disable velocity state
        state.isGrounded = false;
        
        // Pre-run chunk generation at target coordinates
        checkAndSyncChunks();
        
        setChatLogs(prev => [
          ...prev, 
          '⚠️ Teleporting to coordinate 1003993...', 
          '🔴 WARNING: YOU HAVE ENTERED THE GLITCHY DEATH LANDS.', 
          '👤 A dark, pitch-black figure is staring at you from the caverns...'
        ]);
        return;
      }
      
      // Standard tp coordinates: tp <x> <y> <z>
      if (args.length === 3) {
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        const z = parseFloat(args[2]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          state.playerPosition.set(x, y, z);
          state.playerVelocity.set(0, 0, 0);
          setPlayerCoords({ x, y, z });
          state.isGrounded = false;
          checkAndSyncChunks();
          setChatLogs(prev => [...prev, `🛸 Teleported to X: ${x}, Y: ${y}, Z: ${z}`]);
          return;
        }
      } else if (args.length === 2) {
        const x = parseFloat(args[0]);
        const z = parseFloat(args[1]);
        if (!isNaN(x) && !isNaN(z)) {
          const targetY = 32;
          state.playerPosition.set(x, targetY, z);
          state.playerVelocity.set(0, 0, 0);
          setPlayerCoords({ x, y: targetY, z });
          state.isGrounded = false;
          checkAndSyncChunks();
          setChatLogs(prev => [...prev, `🛸 Teleported to X: ${x}, Z: ${z}`]);
          return;
        }
      }
      
      setChatLogs(prev => [...prev, '❌ Usage: tp 1003993  OR  tp <x> <y> <z>']);
      return;
    }

    if (cmd === 'help' || cmd === '/help') {
      setChatLogs(prev => [
        ...prev,
        '🛠️ Console Commands List:',
        '  - sleep  (or /dream) : Go to sleep or wake up from dream',
        '  - portal  : Teleport in/out of the Glitchy Rotting Dimension',
        '  - spawn pig/chicken/cat/dog : Summon pixel-art companion mobs',
        '  - tp 1003993 : Teleport directly to the Glitchy Death Lands',
        '  - tp <x> <y> <z> : Teleport to arbitrary coordinates',
        '  - fly : Toggle flying gravity bypass',
        '  - gravity : Toggle simulation physics gravity',
        '  - coordinate : Toggle Coordinate overlay visibility',
        '  - clear : Clear chat console logs history'
      ]);
      return;
    }

    if (cmd === 'fly' || cmd === '/fly') {
      setSettings(prev => {
        const nextFly = !prev.flyMode;
        setChatLogs(l => [...l, `🚀 Flying flight mode: ${nextFly ? 'ENABLED' : 'DISABLED'}`]);
        return { ...prev, flyMode: nextFly };
      });
      return;
    }

    if (cmd === 'gravity' || cmd === '/gravity') {
      setSettings(prev => {
        const nextGrav = !prev.gravity;
        setChatLogs(l => [...l, `🌎 World simulation gravity: ${nextGrav ? 'ENABLED' : 'DISABLED'}`]);
        return { ...prev, gravity: nextGrav };
      });
      return;
    }

    if (cmd === 'coordinate' || cmd === '/coordinate') {
      setSettings(prev => {
        const nextCoords = !prev.showCoordinates;
        setChatLogs(l => [...l, `📍 Coordinates overlay: ${nextCoords ? 'SHOWN' : 'HIDDEN'}`]);
        return { ...prev, showCoordinates: nextCoords };
      });
      return;
    }

    if (cmd === 'portal' || cmd === '/portal') {
      triggerRottingPortalTeleport();
      return;
    }

    if (cmd === 'clear' || cmd === '/clear') {
      setChatLogs([]);
      return;
    }

    setChatLogs(prev => [...prev, `❌ Unknown command: "${rawCommand}". Type "/help" for list of commands.`]);
  }, [checkAndSyncChunks, triggerRottingPortalTeleport]);

  // Create custom saved world
  const handleCreateAndStartCustomWorld = useCallback(() => {
    const newWorldId = 'world_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newWorld: CustomWorld = {
      id: newWorldId,
      name: worldNameInput.trim() || 'My Custom Sandbox',
      seedString: seedStringInput.trim() || '777123',
      seedType: seedType,
      flatWorld: settings.flatWorld,
      customParams: currentCustomParams || undefined,
      customDescription: aiDescription || undefined,
    };

    // Assign direct state values to bypass React render cycle lag safely
    stateRef.current.seedString = seedStringInput.trim() || '777123';
    stateRef.current.customParams = currentCustomParams || null;

    const updated = [...savedWorlds, newWorld];
    setSavedWorlds(updated);
    localStorage.setItem('limecraft_saved_worlds_list_v1', JSON.stringify(updated));

    // Derive active seed from seed string hash
    const cleanSeed = (seedStringInput || '').trim().toLowerCase();
    let numericalSeed = seedType;
    if (cleanSeed === 'cat') {
      numericalSeed = 1;
    } else if (cleanSeed === '842') {
      numericalSeed = 842;
    } else if (cleanSeed === '6') {
      numericalSeed = 6;
    } else if (cleanSeed === '133') {
      numericalSeed = 133;
    } else if (cleanSeed === '143') {
      numericalSeed = 143;
    } else if (cleanSeed === '233') {
      numericalSeed = 233;
    } else if (seedType === 5) {
      numericalSeed = 5;
    } else if (seedType === 4) {
      numericalSeed = 4;
    } else if (seedType === 1 || seedType === 2 || seedType === 3) {
      numericalSeed = seedType;
    } else {
      let hash = 0;
      for (let i = 0; i < newWorld.seedString.length; i++) {
        hash = newWorld.seedString.charCodeAt(i) + ((hash << 5) - hash);
      }
      numericalSeed = (Math.abs(hash) % 3) + 1; // 1, 2, or 3
    }

    // Reset AI current forms
    setAiPromptInput('');
    setAiDescription(null);
    setCurrentCustomParams(null);

    handleStartGame(numericalSeed, true, newWorldId);
  }, [worldNameInput, seedStringInput, seedType, settings.flatWorld, savedWorlds, currentCustomParams, aiDescription]);

  // Query server endpoints to call Gemini for procedural AI terrain parameters!
  const handleAIGenerateSeed = useCallback(async () => {
    if (!aiPromptInput.trim()) return;
    setAiLoading(true);
    setAiDescription(null);
    try {
      const response = await fetch('/api/generate_seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPromptInput.trim() }),
      });
      if (!response.ok) {
        throw new Error('Could not translate prompt');
      }
      const data = await response.json();
      if (data && data.seedString) {
        setWorldNameInput(data.worldName);
        setSeedStringInput(data.seedString);
        setSeedType(data.seedType);
        setAiDescription(data.customDescription);
        
        // Store parsed custom configurations dynamically
        setCurrentCustomParams({
          spawnBlock: data.spawnBlock,
          foundationBlock: data.foundationBlock,
          amplitude: data.amplitude,
          baseHeight: data.baseHeight,
          treeDensity: data.treeDensity,
          treeType: data.treeType,
          leafType: data.leafType,
          hasPonds: data.hasPonds,
        });
      }
    } catch (error) {
      console.error(error);
      alert('⚠️ Failed to connect to AI Seed Generator backend. Make sure the development server has loaded process.env.GEMINI_API_KEY.');
    } finally {
      setAiLoading(false);
    }
  }, [aiPromptInput]);

  // Remove custom saved world
  const handleDeleteCustomWorld = useCallback((worldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('⚠️ Are you sure you want to permanently delete this sandbox world partition and all built blocks inside?')) {
      const updated = savedWorlds.filter(w => w.id !== worldId);
      setSavedWorlds(updated);
      localStorage.setItem('limecraft_saved_worlds_list_v1', JSON.stringify(updated));
      localStorage.removeItem(`limecraft_world_blocks_${worldId}`);
    }
  }, [savedWorlds]);

  // Start/load the game with specified seedType and force regeneration if requested
  const handleStartGame = useCallback((activeSeed: number, forceFresh: boolean, worldId: string = 'default_v1') => {
    setActiveWorldId(worldId);
    stateRef.current.activeWorldId = worldId;
    setSeedType(activeSeed);
    stateRef.current.seedType = activeSeed;
    
    // Pass flat world configuration from state settings
    initWorldData(settings.flatWorld, activeSeed, forceFresh);
    
    // Reset player position with healthy gravity spawn
    const state = stateRef.current;
    state.playerPosition.set(0, 18, 0);
    state.playerVelocity.set(0, 0, 0);
    state.playerLookYaw = 0;
    state.playerLookPitch = 0;
    state.lastChunkX = -999;
    state.lastChunkZ = -999;
    state.generatedChunks = {}; // Clear chunks record so the generator populates this seed infinitely!
    setPlayerCoords({ x: 0, y: 18, z: 0 });
    setPlayerLook({ yaw: 0, pitch: 0 });

    // Generate immediate columns and render
    checkAndSyncChunks();
    rebuildWorldMeshes();
    
    // Set screen to playing!
    setGameScreen('playing');
  }, [initWorldData, checkAndSyncChunks, rebuildWorldMeshes, settings.flatWorld]);

  // Handle external placements/mines from UI buttons
  const executeMineAgainstFocus = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    const state = stateRef.current;
    const meshes = Object.values(state.instancedMeshes) as THREE.InstancedMesh[];

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.distance <= 6.5) {
        const instMesh = hit.object as THREE.InstancedMesh;
        const instanceId = hit.instanceId;
        if (instanceId === undefined) return;

        const blockType = instMesh.userData.blockType as BlockType;
        const coordsList = state.instancedBlockCoords[blockType];
        if (!coordsList || !coordsList[instanceId]) return;

        const key = coordsList[instanceId];

        // If clicking on a crafting table, go into crafting inventory instead of breaking (unless holding shift)
        if (state.world[key] === BlockType.CRAFT_TABLE && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-crafting-table'));
          return;
        }

        // If clicking on a bed, go to sleep!
        if (state.world[key] === BlockType.BED && !state.keys['shift']) {
          handleSleepAndDream();
          return;
        }

        // If clicking on a chest, open Chest Container modal (unless holding shift)
        if (state.world[key] === BlockType.CHEST && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-container', { detail: { type: 'chest', key } }));
          return;
        }

        // If clicking on a cabinet, open Cabinet Container modal (unless holding shift)
        if (state.world[key] === BlockType.CABINET && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-container', { detail: { type: 'cabinet', key } }));
          return;
        }

        if (state.world[key]) {
          const minedBlock = state.world[key];
          setBlockState(key, BlockType.AIR);
          rebuildWorldMeshes();

          if (minedBlock === BlockType.COCONUT) {
            window.dispatchEvent(
              new CustomEvent('show-game-notification', {
                detail: '🥥 Plop! You broke a coconut and it left a dropped item: Coconut Milk!'
              })
            );
            setSelectedBlock(BlockType.COCONUT_MILK);
            state.selectedBlock = BlockType.COCONUT_MILK;
          }
        }
      }
    }
  }, [rebuildWorldMeshes, setBlockState, setSelectedBlock]);

  const executePlaceAgainstFocus = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    const state = stateRef.current;

    // Check if player is trying to place Gold Shard as a block
    if (state.selectedBlock === BlockType.GOLD_SHARD) {
      window.dispatchEvent(new CustomEvent('show-game-notification', { 
        detail: '⚠️ Gold Shard is an ingredient. Forge it into a Gold Block at the Crafting Workbench!' 
      }));
      return;
    }

    const meshes = Object.values(state.instancedMeshes) as THREE.InstancedMesh[];

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.distance <= 6.5) {
        const instMesh = hit.object as THREE.InstancedMesh;
        const instanceId = hit.instanceId;
        if (instanceId === undefined) return;

        const blockType = instMesh.userData.blockType as BlockType;
        const coordsList = state.instancedBlockCoords[blockType];
        if (!coordsList || !coordsList[instanceId]) return;

        const targetKey = coordsList[instanceId];
        const [tx, ty, tz] = targetKey.split(',').map(Number);
        
        const norm = hit.face?.normal;
        if (!norm) return;

        // If interacting/clicking on a crafting table, open its inventory page instead of placing a block against it (unless shift is pressed)
        if (state.world[targetKey] === BlockType.CRAFT_TABLE && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-crafting-table'));
          return;
        }

        // If clicking on a bed, go to sleep!
        if (state.world[targetKey] === BlockType.BED && !state.keys['shift']) {
          handleSleepAndDream();
          return;
        }

        // Chest right-click interaction
        if (state.world[targetKey] === BlockType.CHEST && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-container', { detail: { type: 'chest', key: targetKey } }));
          return;
        }

        // Cabinet right-click interaction
        if (state.world[targetKey] === BlockType.CABINET && !state.keys['shift']) {
          window.dispatchEvent(new CustomEvent('open-container', { detail: { type: 'cabinet', key: targetKey } }));
          return;
        }

        const bx = Math.round(tx + norm.x);
        const by = Math.round(ty + norm.y);
        const bz = Math.round(tz + norm.z);
        const key = `${bx},${by},${bz}`;

        // Ensure placing doesn't overlap player's boundary box
        const playerMinX = state.playerPosition.x - 0.35;
        const playerMaxX = state.playerPosition.x + 0.35;
        const playerMinY = state.playerPosition.y - 1.6;
        const playerMaxY = state.playerPosition.y + 0.2;
        const playerMinZ = state.playerPosition.z - 0.35;
        const playerMaxZ = state.playerPosition.z + 0.35;

        const overlapsPlayer = 
          bx >= Math.floor(playerMinX) && bx <= Math.floor(playerMaxX) &&
          by >= Math.floor(playerMinY) && by <= Math.floor(playerMaxY) &&
          bz >= Math.floor(playerMinZ) && bz <= Math.floor(playerMaxZ);

        if (!overlapsPlayer) {
          setBlockState(key, state.selectedBlock);
          rebuildWorldMeshes();

          if (state.selectedBlock === BlockType.RUOTK) {
            checkAndTriggerRottingPortal(bx, by, bz);
          }
        }
      }
    }
  }, [rebuildWorldMeshes, setBlockState, checkAndTriggerRottingPortal]);

  // Triggering callback for UI buttons
  const handleTriggerAction = useCallback((action: 'add' | 'mine') => {
    if (action === 'mine') {
      executeMineAgainstFocus();
    } else {
      executePlaceAgainstFocus();
    }
  }, [executeMineAgainstFocus, executePlaceAgainstFocus]);

  // Request pointer lock safely
  const togglePointerLock = useCallback(() => {
    if ((window as any).__limecraft_menu_active) {
      return; // Do not focus pointer lock if overlay panels are active
    }
    const canvas = rendererRef.current?.domElement;
    if (canvas) {
      try {
        if (document.pointerLockElement === canvas) {
          document.exitPointerLock();
        } else {
          const promise = canvas.requestPointerLock() as any;
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              console.warn('Pointer lock request rejected:', err);
            });
          }
        }
      } catch (error) {
        console.warn('Pointer lock request failed:', error);
      }
    }
  }, []);

  // Collision Checking helper
  // Checks if a 3D box bounding player offsets overlaps solid grid blocks
  const checkBlockCollision = useCallback((pos: THREE.Vector3): boolean => {
    const state = stateRef.current;
    
    // Player collision envelope dimensions (width 0.6, height 1.8)
    const halfWidth = 0.3;
    const playerHeight = 1.7;

    const minX = Math.floor(pos.x - halfWidth);
    const maxX = Math.floor(pos.x + halfWidth);
    const minY = Math.floor(pos.y - playerHeight);
    const maxY = Math.floor(pos.y + 0.1);
    const minZ = Math.floor(pos.z - halfWidth);
    const maxZ = Math.floor(pos.z + halfWidth);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;
          const block = state.world[key];
          if (block && block !== BlockType.AIR) {
            return true; // Collided with solid block
          }
        }
      }
    }

    return false;
  }, []);

  // Rebuilds animal models under hard texture pack
  const rebuildMobs = useCallback(() => {
    const state = stateRef.current;
    const scene = sceneRef.current;
    if (!scene) return;
    mobsRef.current.forEach((mob) => {
      scene.remove(mob.mesh);
      const newMesh = createMobGroup(mob.type, state.settings.hardTexturePack);
      newMesh.position.copy(mob.mesh.position);
      newMesh.rotation.copy(mob.mesh.rotation);
      scene.add(newMesh);
      mob.mesh = newMesh;
    });
  }, []);

  // Update Settings from UI
  const handleUpdateSettings = useCallback((updater: (prev: GameSettings) => GameSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      
      // If wireframe or hardTexturePack changed, trigger material rebuild
      if (next.wireframe !== prev.wireframe || next.hardTexturePack !== prev.hardTexturePack) {
        setTimeout(() => {
          rebuildMaterials();
          rebuildMobs();
        }, 30);
      }
      return next;
    });
  }, [rebuildMaterials, rebuildMobs]);

  // MASTER MOUNT ROUTINE (THREE Scene logic, pointer lock controls, loop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & WebGL Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#7ec0ee'); // Minecraft sky blue
    scene.fog = new THREE.FogExp2('#7ec0ee', 0.025); // Adds dense realistic horizon haze

    const camera = new THREE.PerspectiveCamera(settings.fov, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Set aspect ratio corrections
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear and mount canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Save Three.js structural refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight('#fffced', 0.75);
    dirLight.position.set(20, 40, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Add a simple grid helper on the ground to visually orient in empty directions
    const gridHelper = new THREE.GridHelper(200, 100, '#65a30d', '#a3e635');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // 3. Create target highlight wireframe (the retro mesh selection box)
    const lineGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const edges = new THREE.EdgesGeometry(lineGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 });
    const blockWireframe = new THREE.LineSegments(edges, lineMat);
    blockWireframe.visible = false;
    scene.add(blockWireframe);
    blockWireframeRef.current = blockWireframe;

    // 4. Shared block voxel scale properties
    blockGeometryRef.current = new THREE.BoxGeometry(1, 1, 1);
    dirtPathGeometryRef.current = new THREE.BoxGeometry(1.0, 0.9375, 1.0);

    // 5. Build Initial world state textures and cubes
    initWorldData(settings.flatWorld, seedType);
    stateRef.current.materials = getSharedMaterials(stateRef.current.settings.wireframe);
    checkAndSyncChunks();

    // Spawn player safely atop landscape
    let spawnY = 16;
    for (let y = 30; y >= 0; y--) {
      if (stateRef.current.world[`0,${y},0`]) {
        spawnY = y + 1.8;
        break;
      }
    }
    stateRef.current.playerPosition.set(0, spawnY + 1.8, 0);

    // 6. Keyboard input binding
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if command box is active
      if (stateRef.current.isCommandBoxOpen) {
        if (e.key === 'Escape') {
          setIsCommandBoxOpen(false);
          stateRef.current.isCommandBoxOpen = false;
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Open command input box
      if (key === 't' || key === '/') {
        if (stateRef.current.gameScreen === 'playing') {
          e.preventDefault();
          stateRef.current.isCommandBoxOpen = true;
          setIsCommandBoxOpen(true);
          try {
            document.exitPointerLock();
          } catch (err) {}
          return;
        }
      }

      // Toggle cursor unlock keys or focus instructions
      if (key === 'h') {
        // Handled in subcomponent
      }

      // Live keyboard toggle for Flight/Fly Mode
      if (key === 'f') {
        if (stateRef.current.gameScreen === 'playing') {
          setSettings(prev => {
            const nextFly = !prev.flyMode;
            window.dispatchEvent(new CustomEvent('show-game-notification', {
              detail: nextFly ? '🚀 FLIGHT MODE ENABLED - Go anywhere! (W/A/S/D to fly, Space to rise, Shift to sink, Ctrl to sprint fly!)' : '🌎 FLIGHT MODE DISABLED'
            }));
            return { ...prev, flyMode: nextFly };
          });
          return;
        }
      }
      
      stateRef.current.keys[key] = true;

      // Handle block placing hotkeys
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key) || key === 'm' || key === 'b' || key === 'd' || key === 'i' || key === 'g') {
        if (key === 'm') {
          setSelectedBlock(BlockType.MEAT);
        } else if (key === 'b') {
          setSelectedBlock(BlockType.BIRCH);
        } else if (key === 'd') {
          setSelectedBlock(BlockType.DIAMOND);
        } else if (key === 'i') {
          setSelectedBlock(BlockType.DIAMOND_ITEM);
        } else if (key === 'g') {
          setSelectedBlock(BlockType.GOLD_SHARD);
        } else {
          const index = e.key === '0' ? 9 : parseInt(e.key) - 1;
          const mappedTypes = [
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
            BlockType.GOLD_SHARD,
            BlockType.GOLD_BLOCK
          ];
          if (mappedTypes[index] !== undefined) {
            setSelectedBlock(mappedTypes[index]);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (stateRef.current.isCommandBoxOpen) return;
      const key = e.key.toLowerCase();
      stateRef.current.keys[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 7. Mouse move / Drag-to-look camera logic
    let isMouseDown = false;
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setPointerLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Capture rotation look increments
    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isCommandBoxOpen) return;
      
      const state = stateRef.current;
      const sensitivity = 0.0025;

      // Check if mouse locked OR if user dragging on canvas fallback (spectator mode)
      if (document.pointerLockElement === renderer.domElement || isMouseDown) {
        state.playerLookYaw -= e.movementX * sensitivity;
        state.playerLookPitch -= e.movementY * sensitivity;

        // Constraint pitch rotation (Vertical tilt caps -85 to +85 degrees)
        const pitchCap = Math.PI / 2 - 0.08;
        state.playerLookPitch = Math.max(-pitchCap, Math.min(pitchCap, state.playerLookPitch));
      }
    };

    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (stateRef.current.isCommandBoxOpen) return;
      isMouseDown = true;
      // Triggers PointerLock if not locked
      const isLocked = document.pointerLockElement === renderer.domElement;
      if (!isLocked && e.button === 0) {
        // Only lock if clicking on main body
      }
    };

    const handleCanvasMouseUp = () => {
      isMouseDown = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // Direct placing/mining events from locked cursor
    const handleCanvasClick = (e: MouseEvent) => {
      if (stateRef.current.gameScreen !== 'playing') {
        return; // Do not pointer lock or click block actions inside the menus
      }
      if (stateRef.current.isCommandBoxOpen) {
        return; // Click does nothing when entering commands
      }
      if ((window as any).__limecraft_menu_active) {
        return; // Clicking canvas does nothing when overlay menus are open so we don't lock pointer!
      }
      if (document.pointerLockElement !== canvas) {
        try {
          const promise = canvas.requestPointerLock() as any;
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              console.warn('Pointer lock rejected:', err);
            });
          }
        } catch (err) {
          console.warn('Pointer lock failed:', err);
        }
        return;
      }

      // Unlocks cursor with right-click / menu option if you want, but Standard Mine/Place:
      if (e.button === 0) {
        // Left - Mine
        executeMineAgainstFocus();
      } else if (e.button === 2) {
        // Right - Place
        e.preventDefault();
        executePlaceAgainstFocus();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // prevents standard web default page menu on block build
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // 8. ANIMATION GAME LOOP
    let animationFrameId: number;
    let frameCount = 0;

    const gameLoop = () => {
      animationFrameId = requestAnimationFrame(gameLoop);

      const state = stateRef.current;
      const now = performance.now();
      const dt = Math.min((now - state.physicsTime) / 1000, 0.1); // caps physics steps at 100ms
      state.physicsTime = now;

      // Run infinite procedural chunk generation immediately every frame before physics calculations.
      // This guarantees that walking on newly stepped-on coordinate terrain generates the collision grid beforehand.
      checkAndSyncChunks();

      // F. SCAN & POLL ACTIVE LOGITECH OR STANDARD SOFTWARE GAMEPAD
      let gamepad = null;
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            gamepad = gamepads[i];
            break;
          }
        }
      }

      // Sync gamepad status to React states if changed
      if (gamepad) {
        if (!state.gamepadConnected) {
          state.gamepadConnected = true;
          setGamepadConnected(true);
          setGamepadName(gamepad.id);
          window.dispatchEvent(new CustomEvent('show-game-notification', { detail: `🎮 Gamepad Connected: ${gamepad.id}` }));
        }
      } else {
        if (state.gamepadConnected) {
          state.gamepadConnected = false;
          setGamepadConnected(false);
          setGamepadName('');
        }
      }

      // Read gamepad axes with deadzone support
      let g_lx = 0;
      let g_ly = 0;
      let g_rx = 0;
      let g_ry = 0;
      if (gamepad) {
        const deadzone = 0.18;
        g_lx = gamepad.axes[0] || 0;
        g_ly = gamepad.axes[1] || 0;
        g_rx = gamepad.axes[2] || 0;
        g_ry = gamepad.axes[3] || 0;

        if (Math.abs(g_lx) < deadzone) g_lx = 0;
        if (Math.abs(g_ly) < deadzone) g_ly = 0;
        if (Math.abs(g_rx) < deadzone) g_rx = 0;
        if (Math.abs(g_ry) < deadzone) g_ry = 0;

        // Apply right stick look controls
        const analogueLookSensitivity = 1.6; // multiplier of stick tracking speed
        if (Math.abs(g_rx) > 0 || Math.abs(g_ry) > 0) {
          state.playerLookYaw -= g_rx * analogueLookSensitivity * dt;
          state.playerLookPitch -= g_ry * analogueLookSensitivity * dt;

          const pitchCap = Math.PI / 2 - 0.08;
          state.playerLookPitch = Math.max(-pitchCap, Math.min(pitchCap, state.playerLookPitch));
        }

        // Jump control: button A (button 0)
        if (gamepad.buttons[0]?.pressed && state.isGrounded && !state.settings.flyMode) {
          state.playerVelocity.y = 5.8;
          state.isGrounded = false;
        }

        // Fly upwards/downwards options when flyMode is on
        if (state.settings.flyMode) {
          if (gamepad.buttons[0]?.pressed) {
            state.playerVelocity.y = 6.0; // ascend with A
          } else if (gamepad.buttons[1]?.pressed || gamepad.buttons[11]?.pressed || gamepad.buttons[10]?.pressed) {
            state.playerVelocity.y = -6.0; // descend with B or stick clicks
          }
        }

        // Block placing & mining action buttons (RT/7 for mining, LT/6 for placing)
        // We also allow Button X (2) for mining and Button B (1) for placing to support simple layouts
        const mineBtnPressed = (gamepad.buttons[7]?.pressed || (gamepad.buttons[7]?.value && gamepad.buttons[7].value > 0.4)) || gamepad.buttons[2]?.pressed;
        const placeBtnPressed = (gamepad.buttons[6]?.pressed || (gamepad.buttons[6]?.value && gamepad.buttons[6].value > 0.4)) || gamepad.buttons[1]?.pressed;

        if (mineBtnPressed) {
          if (state.gamepadMineCooldown <= 0) {
            executeMineAgainstFocus();
            state.gamepadMineCooldown = 15; // 15 frames mine cooldown (~250ms)
          } else {
            state.gamepadMineCooldown--;
          }
        } else {
          state.gamepadMineCooldown = 0; // release immediately
        }

        if (placeBtnPressed) {
          if (state.gamepadPlaceCooldown <= 0) {
            executePlaceAgainstFocus();
            state.gamepadPlaceCooldown = 18; // 18 frames place cooldown (~300ms)
          } else {
            state.gamepadPlaceCooldown--;
          }
        } else {
          state.gamepadPlaceCooldown = 0; // release immediately
        }

        // Hotbar Switching items: LB (4), RB (5), D-Pad Left (14), D-Pad Right (15)
        const bumperLeft = gamepad.buttons[4]?.pressed || gamepad.buttons[14]?.pressed;
        const bumperRight = gamepad.buttons[5]?.pressed || gamepad.buttons[15]?.pressed;
        const lastBumperLeft = state.gamepadLastButtons[4] || state.gamepadLastButtons[14] || false;
        const lastBumperRight = state.gamepadLastButtons[5] || state.gamepadLastButtons[15] || false;

        const mappedTypes = [
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
          BlockType.GOLD_SHARD,
          BlockType.GOLD_BLOCK
        ];

        let currentIdx = mappedTypes.indexOf(state.selectedBlock);
        if (currentIdx === -1) currentIdx = 0;

        if (bumperLeft && !lastBumperLeft) {
          currentIdx = (currentIdx - 1 + mappedTypes.length) % mappedTypes.length;
          setSelectedBlock(mappedTypes[currentIdx]);
        } else if (bumperRight && !lastBumperRight) {
          currentIdx = (currentIdx + 1) % mappedTypes.length;
          setSelectedBlock(mappedTypes[currentIdx]);
        }

        // Store edge button states
        state.gamepadLastButtons[4] = gamepad.buttons[4]?.pressed || false;
        state.gamepadLastButtons[14] = gamepad.buttons[14]?.pressed || false;
        state.gamepadLastButtons[5] = gamepad.buttons[5]?.pressed || false;
        state.gamepadLastButtons[15] = gamepad.buttons[15]?.pressed || false;

        // Custom start/select actions
        const selectPressed = gamepad.buttons[8]?.pressed || false;
        const lastSelectPressed = state.gamepadLastButtons[8] || false;
        if (selectPressed && !lastSelectPressed) {
          togglePointerLock();
        }
        state.gamepadLastButtons[8] = selectPressed;

        const startPressed = gamepad.buttons[9]?.pressed || false;
        const lastStartPressed = state.gamepadLastButtons[9] || false;
        if (startPressed && !lastStartPressed) {
          if (state.gameScreen === 'playing') {
            setGameScreen('menu');
            state.gameScreen = 'menu';
            try {
              document.exitPointerLock();
            } catch (err) {}
          } else if (state.gameScreen === 'menu') {
            setGameScreen('playing');
            state.gameScreen = 'playing';
          }
        }
        state.gamepadLastButtons[9] = startPressed;
      }

      if (state.gameScreen !== 'playing') {
        // Slow cinematic orbit around spawn coordinates (0,5,0)
        state.playerLookYaw += 0.22 * dt;
        
        const orbitRadius = 15;
        const camX = orbitRadius * Math.sin(state.playerLookYaw);
        const camZ = orbitRadius * Math.cos(state.playerLookYaw);
        
        camera.position.set(camX, 11, camZ);
        camera.lookAt(new THREE.Vector3(0, 4, 0));
        
        blockWireframe.visible = false;
        renderer.render(scene, camera);
        return;
      }

      // B. SPEED MODIFIERS (Sprinting supported with ctrl, Left Stick Click or Button 10)
      let isSprinting = false;
      if (!state.isCommandBoxOpen) {
        isSprinting = state.keys['control'] || state.keys['command'];
        if (gamepad) {
          const stickSprintBtn = gamepad.buttons[10]?.pressed || gamepad.buttons[11]?.pressed;
          if (stickSprintBtn) {
            isSprinting = true;
          }
        }
      }

      // A. APPLY GRAVITY & FLYMODE PHYSICS
      if (state.isCommandBoxOpen) {
        state.playerVelocity.x = 0;
        state.playerVelocity.z = 0;
        if (state.settings.flyMode) {
          state.playerVelocity.y = 0;
        } else if (state.settings.gravity) {
          state.playerVelocity.y -= 14.8 * dt; // Gravity accentuation
          state.playerVelocity.y = Math.max(-35, state.playerVelocity.y);
        }
      } else {
        if (state.settings.flyMode) {
          // Fly physics (Direct floating / noclip)
          if (!gamepad) state.playerVelocity.y = 0;
          if (state.keys[' '] || state.keys['spacebar']) {
            state.playerVelocity.y = isSprinting ? 16.0 : 8.5; // Float upwards faster
          } else if (state.keys['shift']) {
            state.playerVelocity.y = isSprinting ? -16.0 : -8.5; // Float downwards faster
          }
        } else {
          // Add typical Minecraft gravity downwards
          if (state.settings.gravity) {
            state.playerVelocity.y -= 14.8 * dt; // Gravity accentuation
            // Cap terminal velocity
            state.playerVelocity.y = Math.max(-35, state.playerVelocity.y);
          }
        }

        const currentSpeed = state.settings.flyMode 
          ? (isSprinting ? 24.0 : 12.0) 
          : (isSprinting ? 8.2 : 4.5);

        // C. COMPUTE LOOK DIRECTIONAL WALKING VECTORS
        const xWalkDir = new THREE.Vector3();
        const zWalkDir = new THREE.Vector3();

        // Yaw defines rotation around the vertical Y axis
        xWalkDir.set(Math.cos(state.playerLookYaw), 0, -Math.sin(state.playerLookYaw)); // Left/Right direction
        zWalkDir.set(-Math.sin(state.playerLookYaw), 0, -Math.cos(state.playerLookYaw)); // Forward/Back direction

        const moveDirection = new THREE.Vector3(0, 0, 0);

        if (state.keys['w'] || state.keys['arrowup']) {
          moveDirection.add(zWalkDir);
        }
        if (state.keys['s'] || state.keys['arrowdown']) {
          moveDirection.sub(zWalkDir);
        }
        if (state.keys['a']) {
          moveDirection.sub(xWalkDir);
        }
        if (state.keys['d']) {
          moveDirection.add(xWalkDir);
        }

        // Gamepad Analogue Movement
        if (gamepad) {
          if (Math.abs(g_ly) > 0) {
            moveDirection.addScaledVector(zWalkDir, -g_ly);
          }
          if (Math.abs(g_lx) > 0) {
            moveDirection.addScaledVector(xWalkDir, g_lx);
          }
        }

        // Look keys fallback if pointer lock is blocked (using left/right arrows for turning!)
        if (state.keys['arrowleft']) {
          state.playerLookYaw += 2.0 * dt;
          setPlayerLook({ yaw: state.playerLookYaw, pitch: state.playerLookPitch });
        }
        if (state.keys['arrowright']) {
          state.playerLookYaw -= 2.0 * dt;
          setPlayerLook({ yaw: state.playerLookYaw, pitch: state.playerLookPitch });
        }

        const moveLen = moveDirection.length();
        if (moveLen > 0.01) {
          moveDirection.normalize().multiplyScalar(currentSpeed);
          // If analog stick pushed partially, apply proportional speed!
          if (gamepad && (Math.abs(g_lx) > 0 || Math.abs(g_ly) > 0)) {
            const stickMagnitude = Math.min(1.0, Math.sqrt(g_lx * g_lx + g_ly * g_ly));
            moveDirection.multiplyScalar(stickMagnitude);
          }
        }
        
        // Horizontal slide
        state.playerVelocity.x = moveDirection.x;
        state.playerVelocity.z = moveDirection.z;

        // D. HANDLE JUMPING
        if (state.isGrounded && !state.settings.flyMode && (state.keys[' '] || state.keys['spacebar'])) {
          state.playerVelocity.y = 5.8; // jump impulse velocity
          state.isGrounded = false;
        }
      }

      // E. THREE-AXIS INDEPENDENT SLIDING COLLISION PHYSICS
      const targetPos = state.playerPosition.clone();
      
      // 1. Move Y first & probe
      targetPos.y += state.playerVelocity.y * dt;
      if (!state.settings.flyMode && checkBlockCollision(targetPos)) {
        // Collided vertically
        if (state.playerVelocity.y < 0) {
          state.isGrounded = true;
        }
        targetPos.y = state.playerPosition.y; // revert vertical position step
        state.playerVelocity.y = 0;
      } else {
        // If falling, grounded is false
        if (!state.settings.flyMode && Math.abs(state.playerVelocity.y) > 0.1) {
          state.isGrounded = false;
        }
      }

      // 2. Move X & check collision (with Step-Up Assist / Auto-Jump)
      const prevX = targetPos.x;
      targetPos.x += state.playerVelocity.x * dt;
      if (!state.settings.flyMode && checkBlockCollision(targetPos)) {
        // Step climb check: if elevated by 1.05 units we don't collide, let player step up!
        const stepHeight = 1.05;
        const testPos = targetPos.clone();
        testPos.y += stepHeight;
        if (!checkBlockCollision(testPos)) {
          targetPos.y += stepHeight;
          state.isGrounded = true;
        } else {
          targetPos.x = prevX; // slide on wall X
        }
      }

      // 3. Move Z & check (with Step-Up Assist / Auto-Jump)
      const prevZ = targetPos.z;
      targetPos.z += state.playerVelocity.z * dt;
      if (!state.settings.flyMode && checkBlockCollision(targetPos)) {
        // Step climb check: if elevated by 1.05 units we don't collide, let player step up!
        const stepHeight = 1.05;
        const testPos = targetPos.clone();
        testPos.y += stepHeight;
        if (!checkBlockCollision(testPos)) {
          targetPos.y += stepHeight;
          state.isGrounded = true;
        } else {
          targetPos.z = prevZ; // slide on wall Z
        }
      }

      // Apply safe new position
      state.playerPosition.copy(targetPos);
      
      // Throttle HUD state updates to run only once every 12 frames (~190ms).
      // This completely eliminates game micro-stutters and drops React frame tax to 0.
      frameCount++;
      if (frameCount % 12 === 0) {
        setPlayerCoords({ x: state.playerPosition.x, y: state.playerPosition.y, z: state.playerPosition.z });
        setPlayerLook({ yaw: state.playerLookYaw, pitch: state.playerLookPitch });

        // A. WATER ACTIVE FLOWING ENGINE
        if (state.gameScreen === 'playing') {
          const waterKeysToSpawn: { key: string; power: number }[] = [];
          const maxWaterSpills = 250;
          let spillCount = 0;

          // Determine chunks near player
          const cx = Math.floor(state.playerPosition.x / 16);
          const cz = Math.floor(state.playerPosition.z / 16);
          const chunkRadius = state.settings.renderDistance || 3;

          for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
            for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
              const ccx = cx + dx;
              const ccz = cz + dz;
              const chunkKey = `${ccx},${ccz}`;
              const chunkBlocks = state.worldByChunk ? state.worldByChunk[chunkKey] : null;
              if (!chunkBlocks) continue;

              const keys = Object.keys(chunkBlocks);
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const type = chunkBlocks[key];
                if (type === BlockType.WATER) {
                  const [x, y, z] = key.split(',').map(Number);
                  if (y <= 1) continue; // Don't spill below bedrock

                  if (state.waterFlows === undefined) {
                    state.waterFlows = {};
                  }
                  const p = state.waterFlows[key] !== undefined ? state.waterFlows[key] : 4;

                  // 1. Flow down first
                  const downKey = `${x},${y - 1},${z}`;
                  const blockBelow = state.world[downKey];
                  if (!blockBelow || blockBelow === BlockType.AIR) {
                    if (spillCount < maxWaterSpills) {
                      waterKeysToSpawn.push({ key: downKey, power: 4 });
                      spillCount++;
                    }
                  } else if (p > 1 && blockBelow !== BlockType.WATER) {
                    // 2. Spread horizontally if ground below is solid and flow power remains
                    const neighbors = [
                      [x + 1, y, z],
                      [x - 1, y, z],
                      [x, y, z + 1],
                      [x, y, z - 1],
                    ];
                    neighbors.forEach(([nx, ny, nz]) => {
                      const nKey = `${nx},${ny},${nz}`;
                      const nBlock = state.world[nKey];
                      if (!nBlock || nBlock === BlockType.AIR) {
                        if (spillCount < maxWaterSpills) {
                          waterKeysToSpawn.push({ key: nKey, power: p - 1 });
                          spillCount++;
                        }
                      }
                    });
                  }
                }
              }
            }
          }

          // Apply flows
          if (waterKeysToSpawn.length > 0) {
            let updatedAny = false;
            waterKeysToSpawn.forEach(({ key, power }) => {
              if (state.world[key] !== BlockType.WATER) {
                state.world[key] = BlockType.WATER;
                if (state.waterFlows === undefined) {
                  state.waterFlows = {};
                }
                state.waterFlows[key] = power;

                const [bx, , bz] = key.split(',').map(Number);
                const cxKey = Math.floor(bx / 16);
                const czKey = Math.floor(bz / 16);
                const chunkKey = `${cxKey},${czKey}`;
                if (!state.worldByChunk[chunkKey]) {
                  state.worldByChunk[chunkKey] = {};
                }
                state.worldByChunk[chunkKey][key] = BlockType.WATER;
                updatedAny = true;
              }
            });

            if (updatedAny) {
              rebuildWorldMeshes();
            }
          }
        }
      }

      // B. WILD MOB RANDOM SPAWNER
      if (frameCount % 120 === 0 && state.gameScreen === 'playing' && !state.isDreaming) {
        const scene = sceneRef.current;
        if (scene) {
          const currentMobs = mobsRef.current || [];
          if (currentMobs.length < 24) {
            const px = Math.round(state.playerPosition.x);
            const pz = Math.round(state.playerPosition.z);

            const angle = Math.random() * Math.PI * 2;
            const dist = 16 + Math.random() * 22; // 16 to 38 blocks away
            const sx = Math.round(px + Math.cos(angle) * dist);
            const sz = Math.round(pz + Math.sin(angle) * dist);

            let groundY = -999;
            let isWater = false;
            for (let tempY = 24; tempY >= 0; tempY--) {
              const bKey = `${sx},${tempY},${sz}`;
              const block = state.world[bKey];
              if (block && block !== BlockType.AIR) {
                groundY = tempY;
                isWater = (block === BlockType.WATER);
                break;
              }
            }

            if (groundY > 0) {
              let species: 'chicken' | 'cow' | 'fish' = 'chicken';
              if (isWater) {
                species = 'fish';
              } else {
                species = Math.random() < 0.5 ? 'chicken' : 'cow';
              }

              const mesh = createMobGroup(species, state.settings.hardTexturePack);
              mesh.position.set(sx, groundY + 1, sz);
              scene.add(mesh);

              mobsRef.current.push({
                id: `${species}_wild_${Date.now()}`,
                type: species,
                mesh: mesh
              });
            }
          }
        }
      }

      // Keep falling players within bounds (Respawn in clouds if fallen in void)
      if (state.playerPosition.y < -250 && !state.settings.flyMode) {
        state.playerPosition.set(0, 16, 0);
        state.playerVelocity.set(0, 0, 0);
      }

      // Update camera positioning matches player eye level
      camera.position.copy(state.playerPosition);
      // Update camera orientation
      camera.rotation.set(0, 0, 0);
      camera.rotation.y = state.playerLookYaw;
      camera.rotation.x = state.playerLookPitch;
      camera.rotation.order = 'YXZ';

      // F. TARGET BOX HIGHLIGHT RAYCASTER (The building cursor outline)
      const meshes = Object.values(state.instancedMeshes) as THREE.InstancedMesh[];
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0 && intersects[0].distance <= 6.0) {
        const hit = intersects[0];
        const instMesh = hit.object as THREE.InstancedMesh;
        const instanceId = hit.instanceId;
        if (instanceId !== undefined) {
          const type = instMesh.userData.blockType as BlockType;
          const coords = state.instancedBlockCoords[type];
          if (coords && coords[instanceId]) {
            const [bx, by, bz] = coords[instanceId].split(',').map(Number);
            blockWireframe.position.set(bx, by, bz);
            blockWireframe.visible = true;
          } else {
            blockWireframe.visible = false;
          }
        } else {
          blockWireframe.visible = false;
        }
      } else {
        blockWireframe.visible = false;
      }

      // G. SPOOKY ENTITY MANAGEMENT (DEATH LANDS STATE)
      const inDeathLands = Math.abs(state.playerPosition.x) > 900000 || Math.abs(state.playerPosition.z) > 900000;
      if (inDeathLands) {
        // We are in Death Lands. Keep 1 spooky figure tracking and spawning nearby.
        if (spookyEntitiesRef.current.length === 0) {
          const ghost = createSpookyEntity();
          // Find ground height at spawn position or place slightly below eye level.
          // Place it 12 units forward from player direction, on the ground height.
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          forward.y = 0; // lock horizontal forward
          forward.normalize();
          
          const spawnPos = state.playerPosition.clone().addScaledVector(forward, 12);
          // Standard floor height is usually around playerPosition.y - 1.6
          spawnPos.y = Math.max(0, state.playerPosition.y - 1.6);
          
          ghost.position.copy(spawnPos);
          scene.add(ghost);
          spookyEntitiesRef.current.push(ghost);
        } else {
          // Keep looking at player position
          spookyEntitiesRef.current.forEach(ghost => {
            ghost.lookAt(new THREE.Vector3(state.playerPosition.x, ghost.position.y, state.playerPosition.z));
            
            // Subtle creepy bobbing animation
            const time = performance.now() * 0.003;
            ghost.position.y = (state.playerPosition.y - 1.6) + Math.sin(time) * 0.15;
          });
        }
      } else {
        // Not in Death Lands. Clear spooky entities if any exist!
        if (spookyEntitiesRef.current.length > 0) {
          spookyEntitiesRef.current.forEach(ghost => {
            scene.remove(ghost);
          });
          spookyEntitiesRef.current = [];
        }
      }

      // G.2 MOB COMPANION WANDER & GRAVITY PHYSICS
      if (mobsRef.current && mobsRef.current.length > 0) {
        mobsRef.current.forEach(mob => {
          const mesh = mob.mesh;
          
          // Random walk/wander direction turning
          if (Math.random() < 0.015) {
            mesh.rotateY((Math.random() - 0.5) * Math.PI * 0.8);
          }

          // Step forward
          let speed = 0.022;
          if (mob.type === 'chicken') speed = 0.012;
          else if (mob.type === 'cow') speed = 0.016;
          else if (mob.type === 'fish') speed = 0.014;

          mesh.translateZ(speed);

          // Get voxel column location of the mob
          const mx = Math.round(mesh.position.x);
          const mz = Math.round(mesh.position.z);
          
          let groundY = 1;
          let colHasWater = false;
          let waterHeight = -1;

          for (let tempY = 24; tempY >= 0; tempY--) {
            const bKey = `${mx},${tempY},${mz}`;
            const bType = state.world[bKey];
            if (bType && bType !== BlockType.AIR) {
              if (bType === BlockType.WATER) {
                colHasWater = true;
                if (waterHeight === -1) waterHeight = tempY;
              }
              groundY = tempY + 1;
              break;
            }
          }

          if (mob.type === 'fish') {
            if (colHasWater && waterHeight !== -1) {
              // Smooth swimming inside water level
              const targetY = waterHeight + 0.45 + Math.sin((performance.now() + mx * 500) * 0.0035) * 0.25;
              mesh.position.y += (targetY - mesh.position.y) * 0.1;
              // Gentle pitch up and down based on swim height
              mesh.rotation.x = Math.sin((performance.now() + mx * 500) * 0.0035) * 0.15;
              mesh.rotation.z = 0; // reset flopping
            } else {
              // Flopping out of water!
              if (mesh.position.y > groundY) {
                mesh.position.y = Math.max(groundY, mesh.position.y - 0.12);
              } else if (mesh.position.y < groundY) {
                mesh.position.y = groundY;
              }
              mesh.rotation.z = Math.sin(performance.now() * 0.05) * 0.65; // flopping around
              mesh.rotation.x = 0;
            }
          } else {
            // Standard gravity falling simulation
            if (mesh.position.y > groundY) {
              mesh.position.y = Math.max(groundY, mesh.position.y - 0.12);
            } else if (mesh.position.y < groundY) {
              mesh.position.y = groundY;
            }
            mesh.rotation.z = 0;
            mesh.rotation.x = 0;
          }

          // Animated keyframe-like transformations (walking limbs swing, head bobs)
          const t = performance.now() * 0.012;
          const legs: THREE.Object3D[] = [];
          
          mesh.children.forEach(child => {
            if (child.name.toLowerCase().includes('leg')) {
              legs.push(child);
            }
          });
          
          legs.forEach((leg, idx) => {
            const phase = idx % 2 === 0 ? 1 : -1;
            leg.rotation.x = Math.sin(t) * 0.45 * phase;
          });

          // Wiggle fish tail fin
          const tailPivots = mesh.children.filter(c => c.name === 'tail_pivot');
          tailPivots.forEach(tp => {
            tp.rotation.y = Math.sin(performance.now() * 0.02) * 0.5;
          });

          const heads = mesh.children.filter(c => c.name.toLowerCase().includes('head'));
          heads.forEach(h => {
            const baseHeadY = mob.type === 'chicken' ? 0.9 : mob.type === 'dog' ? 0.95 : mob.type === 'pig' ? 0.75 : mob.type === 'cow' ? 1.15 : 0.65;
            h.position.y = baseHeadY + Math.cos(t * 1.5) * 0.035;
          });
        });
      }

      // H. RENDER ACTION
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    // H. RESPONSIVELY RESIZE IFRAME SCREEN CANVAS
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // I. DISMOUNT TEARDOWN CLEANUPS: Free all textures & buffers
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      
      resizeObserver.disconnect();

      // Dispose geometries & textures
      if (blockGeometryRef.current) {
        blockGeometryRef.current.dispose();
      }
      (Object.values(stateRef.current.materials) as THREE.Material[]).forEach((mat) => {
        if (mat) mat.dispose();
      });

      renderer.dispose();
    };
  }, [
    initWorldData,
    rebuildWorldMeshes,
    rebuildMaterials,
    checkAndSyncChunks,
    settings.fov,
    checkBlockCollision,
    executeMineAgainstFocus,
    executePlaceAgainstFocus
  ]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-950 select-none">
      
      {/* 3D WebGL Canvas container */}
      <div 
        ref={containerRef} 
        className="w-full h-full block"
        style={{ cursor: gameScreen === 'playing' ? 'crosshair' : 'default' }}
      />

      {/* Fullscreen Sleeping/Dream Transition Fade Overlay */}
      {isSleepingTransition && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-violet-950 text-white font-sans transition-all duration-500 animate-pulse">
          <div className="text-center p-6 bg-indigo-950/75 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm mx-auto">
            <div className="text-6xl animate-bounce mb-3 select-none">💤</div>
            <h2 className="text-3xl font-extrabold text-indigo-200 tracking-wider font-mono">
              {isDreaming ? 'Waking Up...' : 'Falling Asleep...'}
            </h2>
            <p className="text-violet-300 mt-2 font-mono text-xs leading-relaxed">
              {isDreaming 
                ? 'zZz... Collapsing subconscious cells... returning to normal reality... zZz' 
                : 'zZz... Entering delta-wave sleep... loading sparkly voxel structures... zZz'}
            </p>
            <div className="w-48 h-2.5 bg-violet-900 rounded-full mx-auto mt-6 overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Floating Dream HUD indicator and Quick Wake Button */}
      {gameScreen === 'playing' && isDreaming && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/90 border-2 border-indigo-500/50 hover:border-indigo-400 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in font-sans">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
          </span>
          <div className="flex flex-col text-left">
            <div className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              DREAMWORLD ACTIVE
            </div>
            <div className="text-[10px] font-mono text-indigo-200">Custom fluffy companion mobs spawned!</div>
          </div>
          <button
            onClick={handleSleepAndDream}
            className="ml-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-mono text-xs font-extrabold px-3 py-1.5 rounded-full border border-pink-400/30 transition-all cursor-pointer shadow-md select-none"
          >
            ☀️ Wake Up
          </button>
        </div>
      )}

      {gameScreen === 'playing' ? (
        <>
          {/* Retro Center Crosshair Reticle (Minecraft look-and-feel) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none select-none flex items-center justify-center font-sans">
            <div className="w-4 h-[2px] bg-white mix-blend-difference absolute" />
            <div className="h-4 w-[2px] bg-white mix-[#84cc16] absolute" />
          </div>

          {/* Heads Up Display Overlay (HUD) */}
          <GameUI
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            settings={settings}
            onChangeSettings={handleUpdateSettings}
            coordinates={playerCoords}
            lookAngle={playerLook}
            onSaveWorld={saveWorld}
            onResetWorld={resetWorld}
            onTogglePointerLock={togglePointerLock}
            pointerLocked={pointerLocked}
            blockCounts={blockCounts}
            onTriggerAction={handleTriggerAction}
            isCommandBoxOpen={isCommandBoxOpen}
            setIsCommandBoxOpen={setIsCommandBoxOpen}
            chatLogs={chatLogs}
            onExecuteCommand={handleExecuteCommand}
            gamepadConnected={gamepadConnected}
            gamepadName={gamepadName}
          />
        </>
      ) : (
        /* Dynamic Limecraft Home / Start Screen Overlay */
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-black/45 backdrop-blur-[1px] p-6 md:p-12 overflow-y-auto font-sans text-white">
          
          {/* Header Title with authentic retro block style */}
          <div className="text-center mt-6 md:mt-12 select-none animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-widest text-[#a3e635] drop-shadow-[0_4px_0_#4d7c0f] select-none font-mono tracking-tighter">
              LIMECRAFT
            </h1>
            <p className="mt-3 text-xs md:text-sm text-lime-400 font-mono font-medium tracking-wide bg-lime-950/60 py-1 px-4 rounded-full inline-block border border-lime-800">
              ⚡ Infinite Procedural Voxel Universe ⚡
            </p>
          </div>

          {/* Core Menu Center Panel */}
          <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-700/80 p-6 md:p-8 rounded-xl shadow-2xl backdrop-blur-md">
            
            {/* SCREEN 1: Home Menu */}
            {gameScreen === 'menu' && (
              <div className="flex flex-col gap-4">
                <h2 className="text-center text-lg font-mono tracking-wider text-zinc-400 mb-2 uppercase font-semibold">
                  Main Sector Menu
                </h2>
                
                <button
                  id="btn-singleplayer"
                  onClick={() => setGameScreen('select_singleplayer')}
                  className="w-full bg-zinc-800 hover:bg-[#84cc16] hover:text-black border-2 border-zinc-700 hover:border-[#a3e635] text-zinc-200 transition-all shadow-md py-3 px-5 rounded-lg text-md font-semibold tracking-wide uppercase flex items-center justify-center gap-3 cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  Singleplayer
                </button>

                <button
                  id="btn-multiplayer"
                  onClick={() => {
                    alert('Online and LAN Multiplayer is currently offline - enjoy our fully functional Singleplayer with infinite seed configurations!');
                  }}
                  className="w-full bg-zinc-800/50 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all py-3 px-5 rounded-lg text-md font-semibold tracking-wide uppercase flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Users className="w-5 h-5" />
                  Multiplayer
                  <span className="text-[9px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-normal">Offline</span>
                </button>

                <div className="border-t border-zinc-800 my-2" />

                <div className="flex flex-col gap-1.5 bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-lime-400 text-xs font-mono font-semibold mb-1 uppercase">
                    <Sliders className="w-3.5 h-3.5" /> Quick Settings
                  </div>
                  
                  <label className="flex items-center justify-between text-xs text-zinc-400 cursor-pointer select-none py-1 block">
                    <span>Flat World Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.flatWorld}
                      onChange={(e) => setSettings(prev => ({ ...prev, flatWorld: e.target.checked }))}
                      className="accent-[#84cc16] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-zinc-400 cursor-pointer select-none py-1 block">
                    <span>Gravity Enabled</span>
                    <input
                      type="checkbox"
                      checked={settings.gravity}
                      onChange={(e) => setSettings(prev => ({ ...prev, gravity: e.target.checked }))}
                      className="accent-[#84cc16] rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between text-xs text-zinc-400 cursor-pointer select-none py-1 block">
                    <span>Render Distance (chunks)</span>
                    <select
                      value={settings.renderDistance}
                      onChange={(e) => setSettings(prev => ({ ...prev, renderDistance: parseInt(e.target.value) }))}
                      className="bg-zinc-900 text-zinc-300 rounded border border-zinc-700 text-[11px] p-0.5 font-mono"
                    >
                      <option value="2">2 (Fastest)</option>
                      <option value="3">3 (Normal)</option>
                      <option value="4">4 (Far)</option>
                      <option value="5">5 (Ultra)</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* SCREEN 2: World/Preset Selector */}
            {gameScreen === 'select_singleplayer' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setGameScreen('menu')}
                    className="p-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all border border-zinc-700 text-xs uppercase flex items-center gap-1 font-mono font-medium cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <h2 className="text-md font-mono tracking-wider text-zinc-300 uppercase font-semibold flex-1 text-center font-mono">
                    Select World Seed
                  </h2>
                </div>

                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                  
                  {/* Preset 1: Seed 1 (Hills) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-lime-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-lime-400" />
                        <span className="font-semibold text-sm text-lime-300">Seed 1: Green Hills Wilderness</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Endless rolling lime-grass hills with beautiful forests, ancient cobblestone ruins, and scenic mountain views.
                    </p>
                    <button
                      onClick={() => handleStartGame(1, true)}
                      className="w-full bg-[#84cc16] hover:bg-[#a3e635] active:scale-[0.99] text-black font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Enter Wilderness Seed
                    </button>
                  </div>

                  {/* Preset 2: Seed 2 (Neighborhood) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-blue-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-sm text-blue-300">Seed 2: Cozy Neighborhood</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Undulating terrain featuring beautiful brick neighborhood homes. Go in houses to inspect cabinets, chest blocks, cobblestone structures, and brick chimneys!
                    </p>
                    <button
                      onClick={() => handleStartGame(2, true)}
                      className="w-full bg-blue-500 hover:bg-blue-400 active:scale-[0.99] text-white font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Enter Cozy Neighborhood
                    </button>
                  </div>

                  {/* Preset 3: Seed 3 (Flat Tree plain) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-emerald-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-sm text-emerald-300">Seed 3: Endless Flat Tree Plain</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      A completely flat, endless tree-filled field. Zero rolling hills, just flat grass with lots of trees spawning dynamically and infinitely!
                    </p>
                    <button
                      onClick={() => handleStartGame(3, true)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-white font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Enter Flat Tree Plain
                    </button>
                  </div>

                  {/* Preset 4: Seed 4 (Cozy Village Biome) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-yellow-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-sm text-yellow-300">Seed 4: Giant Infinite Villagers Biome</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      A dense village layout linked by a custom dirt-path network! Homes are clustered together with compact decorative yellow streets.
                    </p>
                    <button
                      onClick={() => handleStartGame(4, true)}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 active:scale-[0.99] text-black font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Enter Village Biome
                    </button>
                  </div>

                  {/* Preset 5: Seed 5 (Cozy Pyramid Hills Biome) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-amber-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Triangle className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-semibold text-sm text-amber-300">Seed 5: Infinite Pyramid Hills</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      An endless, geometric landscape of rolling triangular pyramid hills! Zero random trees except those standing proud on the very peak of each summit.
                    </p>
                    <button
                      onClick={() => handleStartGame(5, true)}
                      className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" /> Enter Pyramid Hills
                    </button>
                  </div>

                  {/* Preset 6: Seed 233 (Birch Night Islands) */}
                  <div className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-indigo-700/60 p-3.5 rounded-lg transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-sm text-indigo-300">Seed 233: Night Birch Islands</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Preset</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      A quiet, mysterious landscape featuring beautiful birch trees standing proud upon floating islands, blanketed beneath an endless dark blue night sky.
                    </p>
                    <button
                      onClick={() => handleStartGame(233, true)}
                      className="w-full bg-indigo-500 hover:bg-indigo-400 active:scale-[0.99] text-white font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Enter Night Birch Islands
                    </button>
                  </div>

                  {/* Saved Custom Worlds Database Section */}
                  {savedWorlds.length > 0 && (
                    <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-zinc-800">
                      <h3 className="text-[10px] font-bold tracking-wider text-zinc-500 font-mono uppercase">
                        Your Custom Saved Worlds & Seeds ({savedWorlds.length})
                      </h3>
                      {savedWorlds.map((world) => (
                        <div key={world.id} className="bg-zinc-950 border border-zinc-800 hover:border-[#84cc16]/50 p-3 rounded-lg transition-all flex items-center justify-between gap-3">
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <span className="text-xs font-bold text-zinc-200 truncate">{world.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              Seed: <span className="text-[#a3e635]">{world.seedString}</span> • Template: {world.seedType === 4 ? 'Villages' : (world.seedType === 5 ? 'Pyramids' : (world.seedType === 842 ? 'Floating Islands' : (world.seedType === 6 ? 'Secret Cosmic Peaks' : (world.seedType === 133 ? 'Flat Teal Skies' : (world.seedType === 143 ? 'Coconut Island' : (world.seedType === 233 ? 'Birch Night Islands' : 'Seed ' + world.seedType))))))}
                            </span>
                            {world.customDescription && (
                              <p className="text-[9.5px] text-[#84cc16] mt-1 font-sans leading-normal line-clamp-2 max-w-xs">
                                ✨ AI: {world.customDescription}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const cleanSeed = (world.seedString || '').trim().toLowerCase();
                                let numericalSeed = world.seedType;
                                if (cleanSeed === 'cat') {
                                  numericalSeed = 1;
                                } else if (cleanSeed === '842') {
                                  numericalSeed = 842;
                                } else if (cleanSeed === '6') {
                                  numericalSeed = 6;
                                } else if (cleanSeed === '133') {
                                  numericalSeed = 133;
                                } else if (cleanSeed === '143') {
                                  numericalSeed = 143;
                                } else if (cleanSeed === '233') {
                                  numericalSeed = 233;
                                } else if (world.seedType === 5) {
                                  numericalSeed = 5;
                                } else if (world.seedType === 4) {
                                  numericalSeed = 4;
                                } else if (world.seedType === 1 || world.seedType === 2 || world.seedType === 3) {
                                  numericalSeed = world.seedType;
                                } else {
                                  let hash = 0;
                                  for (let i = 0; i < world.seedString.length; i++) {
                                    hash = world.seedString.charCodeAt(i) + ((hash << 5) - hash);
                                  }
                                  numericalSeed = (Math.abs(hash) % 3) + 1;
                                }
                                handleStartGame(numericalSeed, false, world.id);
                              }}
                              className="bg-[#84cc16] hover:bg-[#a3e635] text-black p-1.5 px-3 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer font-mono"
                              title="Play custom world seed"
                            >
                              <Play className="w-3" /> Play
                            </button>
                            <button
                              onClick={(e) => handleDeleteCustomWorld(world.id, e)}
                              className="bg-zinc-900 border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-400 p-1.5 rounded transition-all cursor-pointer"
                              title="Delete world permanent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Option 3: Continue previous auto-stored sector if available */}
                  {localStorage.getItem(LOCAL_STORAGE_KEY) ? (
                    <div className="bg-zinc-950/50 hover:bg-zinc-950 border border-zinc-800 hover:border-[#84cc16]/50 p-3.5 rounded-lg transition-all flex flex-col gap-1.5 mt-2">
                      <div className="text-xs text-zinc-400">
                        Continue customized edits from your previously saved workspace block sector.
                      </div>
                      <button
                        onClick={() => handleStartGame(seedType, false, 'default_v1')}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs py-2 px-4 rounded transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Continue Saved World
                      </button>
                    </div>
                  ) : null}

                  <div className="border-t border-zinc-800 my-1" />

                  <button
                    onClick={() => setGameScreen('create_world')}
                    className="w-full bg-zinc-900 hover:text-white text-zinc-400 transition-all border border-zinc-800 text-xs font-semibold py-2 px-4 rounded uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Custom Sandbox Seed
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 3: Create World Sandbox Forms */}
            {gameScreen === 'create_world' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setGameScreen('select_singleplayer')}
                    className="p-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all border border-zinc-700 text-xs uppercase flex items-center gap-1 font-mono font-medium cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <h2 className="text-md font-mono tracking-wider text-zinc-300 uppercase font-semibold flex-1 text-center font-mono">
                    New Sector Setup
                  </h2>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  {/* AI Prompt Generator */}
                  <div className="bg-gradient-to-r from-lime-950/30 to-zinc-950 p-4 rounded-xl border border-[#84cc16]/30 flex flex-col gap-2.5 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#84cc16]/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#83f309] tracking-wider">
                      <Sparkles className="w-4 h-4 text-[#84cc16]" /> AI Sector Generator (Gemini)
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                      Type your dream terrain idea (e.g. <i>"A jagged volcanic golden plain"</i> or <i>"infinite floating diamonds"</i>). Gemini will automatically customize block formulas, heights, and biome options!
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPromptInput}
                        onChange={(e) => setAiPromptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAIGenerateSeed();
                          }
                        }}
                        placeholder="Describe your target biome setup..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#84cc16] text-xs text-zinc-200 rounded-lg p-2 font-sans outline-none focus:ring-1 focus:ring-[#84cc16]"
                        disabled={aiLoading}
                      />
                      <button
                        onClick={handleAIGenerateSeed}
                        disabled={aiLoading || !aiPromptInput.trim()}
                        className="bg-[#84cc16] hover:bg-[#a3e635] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-extrabold text-xs px-3 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
                      >
                        {aiLoading ? (
                          <><span>Thinking...</span></>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 fill-black" />
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiDescription && (
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2 text-[10.5px] font-sans leading-relaxed text-zinc-300 flex flex-col gap-1 mt-1">
                        <span className="font-mono text-[9px] font-bold text-[#84cc16] uppercase tracking-wider block">AI Core Formulation:</span>
                        <span>{aiDescription}</span>
                      </div>
                    )}
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 uppercase font-bold tracking-wider text-[10px] font-mono block">
                      World Sector Label
                    </label>
                    <input
                      type="text"
                      value={worldNameInput}
                      onChange={(e) => setWorldNameInput(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 focus:border-[#84cc16] text-sm text-zinc-100 rounded-lg p-2.5 font-sans outline-none focus:ring-1 focus:ring-[#84cc16]"
                      placeholder="My Epic Sandbox"
                    />
                  </div>

                  {/* Seed String input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 uppercase font-bold tracking-wider text-[10px] font-mono block">
                      Custom String Seed (stored persistently)
                    </label>
                    <input
                      type="text"
                      value={seedStringInput}
                      onChange={(e) => setSeedStringInput(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 focus:border-[#84cc16] text-sm text-zinc-100 rounded-lg p-2.5 font-sans outline-none focus:ring-1 focus:ring-[#84cc16]"
                      placeholder="e.g. infinite_paradise_77"
                    />
                  </div>

                  {/* Seed Preset choice buttons */}
                  <div className="flex flex-col gap-2">
                    <label className="text-zinc-400 uppercase font-bold tracking-wider text-[10px] font-mono block">
                      Terrain / Seed Template
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSeedType(1)}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 1
                            ? 'bg-lime-950/40 border-lime-500 text-lime-300'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 1 (Wild)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Rolling grass & ruins</span>
                      </button>

                      <button
                        onClick={() => setSeedType(2)}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 2
                            ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 2 (Sub)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Houses with chests</span>
                      </button>

                      <button
                        onClick={() => setSeedType(3)}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 3
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 3 (Flat)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Flat grassy tree plains</span>
                      </button>

                      <button
                        onClick={() => setSeedType(4)}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 4
                            ? 'bg-yellow-950/40 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 4 (Villages)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Clustered village paths</span>
                      </button>

                      <button
                        onClick={() => setSeedType(5)}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 5
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 5 (Pyramids)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Rolling pyramids with summit trees</span>
                      </button>

                      <button
                        onClick={() => {
                          setSeedType(233);
                          setSeedStringInput('233');
                        }}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          seedType === 233
                            ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-bold text-xs">Seed 233 (Birch Night)</span>
                        <span className="text-[10px] opacity-80 leading-tight">Birch trees on floating islands under night sky</span>
                      </button>
                    </div>
                  </div>

                  {/* Sandbox checkboxes */}
                  <div className="flex flex-col bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 gap-2">
                    <label className="flex items-center justify-between text-zinc-300 cursor-pointer select-none py-1 block">
                      <span>Flat World Topology</span>
                      <input
                        type="checkbox"
                        checked={settings.flatWorld}
                        onChange={(e) => setSettings(prev => ({ ...prev, flatWorld: e.target.checked }))}
                        className="accent-[#84cc16] w-4 h-4 rounded ml-auto"
                      />
                    </label>

                    <label className="flex items-center justify-between text-zinc-300 cursor-pointer select-none py-1 block">
                      <span>Gravity Physics Activated</span>
                      <input
                        type="checkbox"
                        checked={settings.gravity}
                        onChange={(e) => setSettings(prev => ({ ...prev, gravity: e.target.checked }))}
                        className="accent-[#84cc16] w-4 h-4 rounded ml-auto"
                      />
                    </label>
                  </div>

                  {/* Spawn CTA */}
                  <button
                    onClick={handleCreateAndStartCustomWorld}
                    className="w-full bg-[#84cc16] hover:bg-[#a3e635] text-black font-extrabold text-sm py-3 px-5 rounded-lg transition-all uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-black" /> Create & Start Sandbox
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer credentials and prompt indicators */}
          <div className="text-center text-[10px] md:text-xs text-zinc-500 font-mono tracking-wider max-w-sm mt-4 select-none">
            <span className="bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5 text-[#a3e635]" /> Double-click canvas to lock mouse when playing. Press Esc to release.
            </span>
            <p className="mt-4 opacity-50 font-sans">
              Limecraft Creator Portal v1.4.0 • Google AI Studio
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
