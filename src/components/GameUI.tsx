/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { 
  Compass, 
  HelpCircle, 
  RefreshCw, 
  Save, 
  Sliders, 
  Sparkles, 
  Tv, 
  Volume2, 
  VolumeX, 
  Zap, 
  Eye, 
  EyeOff,
  Gamepad2,
  Maximize2,
  Activity,
  Download,
  Package,
  CheckCircle2,
  Loader2,
  Palette
} from 'lucide-react';
import { BlockType, BLOCKS, GameSettings } from '../types';
import { generateTextureCanvas } from './TextureGenerator';

interface BlockThumbnailProps {
  type: BlockType;
  className?: string;
}

export const BlockThumbnail: React.FC<BlockThumbnailProps> = ({ type, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the procedural texture canvas onto this thumbnail
    const texCanvas = generateTextureCanvas(type, 32);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 48, 48);
    ctx.drawImage(texCanvas, 0, 0, 32, 32, 0, 0, 48, 48);
  }, [type]);

  return (
    <div className={`relative w-12 h-12 bg-gray-800 rounded border border-gray-700 overflow-hidden flex items-center justify-center ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={48} 
        height={48} 
        className="w-full h-full pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

interface GameUIProps {
  selectedBlock: BlockType;
  onSelectBlock: (type: BlockType) => void;
  settings: GameSettings;
  onChangeSettings: (updater: (prev: GameSettings) => GameSettings) => void;
  coordinates: { x: number; y: number; z: number } | null;
  lookAngle: { yaw: number; pitch: number } | null;
  onSaveWorld: () => void;
  onResetWorld: () => void;
  onTogglePointerLock: () => void;
  pointerLocked: boolean;
  blockCounts: Record<BlockType, number>;
  onTriggerAction: (action: 'add' | 'mine') => void;
  isCommandBoxOpen: boolean;
  setIsCommandBoxOpen: (val: boolean) => void;
  chatLogs: string[];
  onExecuteCommand: (command: string) => void;
  gamepadConnected?: boolean;
  gamepadName?: string;
}

export const GameUI: React.FC<GameUIProps> = ({
  selectedBlock,
  onSelectBlock,
  settings,
  onChangeSettings,
  coordinates,
  lookAngle,
  onSaveWorld,
  onResetWorld,
  onTogglePointerLock,
  pointerLocked,
  blockCounts,
  onTriggerAction,
  isCommandBoxOpen,
  setIsCommandBoxOpen,
  chatLogs,
  onExecuteCommand,
  gamepadConnected = false,
  gamepadName = ''
}) => {
  const [showHelp, setShowHelp] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showTextures, setShowTextures] = React.useState(false);
  const [isHardpackDownloaded, setIsHardpackDownloaded] = React.useState(() => {
    return localStorage.getItem('limecraft_hardpack_downloaded') === 'true';
  });
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadStatus, setDownloadStatus] = React.useState<'idle' | 'downloading' | 'unpacking' | 'compiling' | 'completed'>('idle');
  const [isCraftingOpen, setIsCraftingOpen] = React.useState(false);
  const [isHotbarVisible, setIsHotbarVisible] = React.useState(true);
  const [craftGrid, setCraftGrid] = React.useState<(BlockType | null)[]>(Array(9).fill(null));
  const [hasCraftedSword, setHasCraftedSword] = React.useState(false);
  const [isSwordEquipped, setIsSwordEquipped] = React.useState(false);
  const [isSwinging, setIsSwinging] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);
  const notificationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startHardpackDownload = () => {
    if (downloadStatus !== 'idle') return;
    setDownloadProgress(0);
    setDownloadStatus('downloading');
    
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 15) + 8;
      if (currentPct >= 100) {
        currentPct = 100;
        setDownloadProgress(100);
        clearInterval(interval);
        
        // Phase 2: Unpack
        setDownloadStatus('unpacking');
        setTimeout(() => {
          // Phase 3: Compile
          setDownloadStatus('compiling');
          setTimeout(() => {
            // Success
            setDownloadStatus('completed');
            setIsHardpackDownloaded(true);
            localStorage.setItem('limecraft_hardpack_downloaded', 'true');
            // Auto apply
            onChangeSettings(prev => ({ ...prev, hardTexturePack: true }));
          }, 1000);
        }, 1000);
      } else {
        setDownloadProgress(currentPct);
      }
    }, 180);
  };

  const uninstallHardpack = () => {
    setIsHardpackDownloaded(false);
    setDownloadStatus('idle');
    setDownloadProgress(0);
    localStorage.removeItem('limecraft_hardpack_downloaded');
    onChangeSettings(prev => ({ ...prev, hardTexturePack: false }));
  };

  // Command Console Input & Ref handlers
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = React.useState('');

  useEffect(() => {
    if (isCommandBoxOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } else {
      setInputText('');
    }
  }, [isCommandBoxOpen]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputText.trim();
    if (command) {
      onExecuteCommand(command);
    }
    setInputText('');
    setIsCommandBoxOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCommandBoxOpen(false);
    }
    e.stopPropagation();
  };

  // Storage Containers state (Chest & Cabinet)
  const [activeContainer, setActiveContainer] = React.useState<{ type: 'chest' | 'cabinet', key: string } | null>(null);
  const [containerStates, setContainerStates] = React.useState<Record<string, (BlockType | null)[]>>(() => {
    try {
      const saved = localStorage.getItem('limecraft_containers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('limecraft_containers', JSON.stringify(containerStates));
    } catch (e) {
      console.warn('Could not save containers', e);
    }
  }, [containerStates]);

  useEffect(() => {
    const handleOpenCrafting = () => {
      setIsCraftingOpen(true);
      setActiveContainer(null); // exclusive panels
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    const handleOpenContainer = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, key } = customEvent.detail;
      setActiveContainer({ type, key });
      setIsCraftingOpen(false); // exclusive panels
      setContainerStates(prev => {
        if (!prev[key]) {
          const slotsCount = type === 'chest' ? 18 : 12;
          return {
            ...prev,
            [key]: Array(slotsCount).fill(null)
          };
        }
        return prev;
      });
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message = customEvent.detail;
      setNotification(message);
      
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 3500);
    };

    window.addEventListener('open-crafting-table', handleOpenCrafting);
    window.addEventListener('open-container', handleOpenContainer as EventListener);
    window.addEventListener('show-game-notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('open-crafting-table', handleOpenCrafting);
      window.removeEventListener('open-container', handleOpenContainer as EventListener);
      window.removeEventListener('show-game-notification', handleNotification as EventListener);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Available hotbar blocks including Brick, Chest, Cabinet and Steak Meat
  const hotbarBlocks = [
    BlockType.GRASS,
    BlockType.SAND,
    BlockType.COCONUT,
    BlockType.COCONUT_MILK,
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
    BlockType.EMERALD,
    BlockType.THICK_WOOD
  ];

  // Track active menu status globally to prevent raw canvas pointer captures
  useEffect(() => {
    const isActive = !!(showHelp || showSettings || showTextures || isCraftingOpen || activeContainer);
    (window as any).__limecraft_menu_active = isActive;
  }, [showHelp, showSettings, showTextures, isCraftingOpen, activeContainer]);

  // Auto-close any active overlays if pointer gets locked by any mechanism
  useEffect(() => {
    if (pointerLocked) {
      setShowHelp(false);
      setShowSettings(false);
      setShowTextures(false);
      setIsCraftingOpen(false);
      setActiveContainer(null);
    }
  }, [pointerLocked]);

  // Map keyboard keys for numbers 1-9, 0, C, H, E, Escape, and items selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommandBoxOpen) return;
      
      const key = e.key.toLowerCase();
      
      // ESC or 'e'/ 'c' key to close active menus if any are open
      if (e.key === 'Escape' || key === 'e') {
        if (showHelp || showSettings || showTextures || isCraftingOpen || activeContainer) {
          e.preventDefault();
          e.stopPropagation();
          setShowHelp(false);
          setShowSettings(false);
          setShowTextures(false);
          setIsCraftingOpen(false);
          setActiveContainer(null);
          return;
        }
      }

      if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1;
        if (hotbarBlocks[index] !== undefined) {
          onSelectBlock(hotbarBlocks[index]);
        }
      }
      if (key === 'c') {
        const anyOpen = showHelp || showSettings || showTextures || isCraftingOpen || activeContainer;
        if (anyOpen) {
          setShowHelp(false);
          setShowSettings(false);
          setShowTextures(false);
          setIsCraftingOpen(false);
          setActiveContainer(null);
        } else {
          setIsCraftingOpen(true);
          setActiveContainer(null);
        }
      }
      if (key === 'h') {
        setShowHelp(prev => !prev);
      }
      if (key === 'm') {
        onSelectBlock(BlockType.MEAT);
      }
      if (key === 'd') {
        onSelectBlock(BlockType.DIAMOND);
      }
      if (key === 'i') {
        onSelectBlock(BlockType.DIAMOND_ITEM);
      }
      if (key === 'g') {
        onSelectBlock(BlockType.GOLD_SHARD);
      }
      if (key === 'b') {
        onSelectBlock(BlockType.BIRCH);
      }
      if (key === 'p') {
        onSelectBlock(BlockType.BED);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onSelectBlock, isCommandBoxOpen, showHelp, showSettings, isCraftingOpen, activeContainer]);

  // Hook up physical mouse-click sword swing animations on canvas
  const [isEating, setIsEating] = React.useState(false);

  useEffect(() => {
    if (selectedBlock !== BlockType.MEAT) return;

    const handleMeatClick = (e: MouseEvent) => {
      // Don't swallow click if we clicked on active UI elements like chest
      const target = e.target as HTMLElement;
      if (target.closest('.pointer-events-auto') && !target.closest('.cursor-crosshair') && !target.closest('canvas')) {
        return;
      }

      if (e.button === 0) {
        setIsEating(true);
        
        // Show delightful eating alerts & sounds
        const biteAlerts = [
          '🍖 *CHOMP!* Super juicy steak!',
          '🍖 *CRUNCH MUNCH!* Infinitely delicious and hot!',
          '🍖 *YUM!* Savory survival nourishment!',
          '★ Delicious full steak food consumed infinitely! (+20 Focus) ★'
        ];
        
        const phrase = biteAlerts[Math.floor(Math.random() * biteAlerts.length)];
        window.dispatchEvent(new CustomEvent('show-game-notification', { detail: phrase }));

        // Quick retro bite audio synthesis blip!
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(75, audioCtx.currentTime + 0.15);
          
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch {
          // fallback safetied
        }

        const timer = setTimeout(() => setIsEating(false), 240);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('mousedown', handleMeatClick);
    return () => window.removeEventListener('mousedown', handleMeatClick);
  }, [selectedBlock]);

  useEffect(() => {
    if (!isSwordEquipped) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Check if clicking inside UI elements
      const target = e.target as HTMLElement;
      if (target.closest('.pointer-events-auto') && !target.closest('.cursor-crosshair') && !target.closest('canvas')) {
        return;
      }

      if (e.button === 0) {
        setIsSwinging(true);
        const timer = setTimeout(() => setIsSwinging(false), 140);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [isSwordEquipped]);

  // Recipe conditions:
  // Is Cross Shape of Stone:
  // [null, stone, null]
  // [stone, stone, stone]
  // [null, stone, null]
  const isStoneCross = 
    craftGrid[1] === BlockType.STONE &&
    craftGrid[3] === BlockType.STONE &&
    craftGrid[4] === BlockType.STONE &&
    craftGrid[5] === BlockType.STONE &&
    craftGrid[7] === BlockType.STONE &&
    craftGrid[0] === null &&
    craftGrid[2] === null &&
    craftGrid[6] === null &&
    craftGrid[8] === null;

  const stoneCount = craftGrid.filter(cell => cell === BlockType.STONE).length;
  // If they filled enough stones (4 or more) and not building the sword cross
  const isBunchOfStone = stoneCount >= 4 && !isStoneCross;

  // Diamond Block craft recipe: placing 4 or more diamond items anywhere in grid
  const diamondItemCount = craftGrid.filter(cell => cell === BlockType.DIAMOND_ITEM).length;
  const isDiamondBlockRecipe = diamondItemCount >= 4;

  // Gold Block craft recipe: placing 9 gold shards to fill the entire crafting grid
  const isGoldBlockRecipe = craftGrid.every(cell => cell === BlockType.GOLD_SHARD);

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans flex flex-col justify-between p-4 z-40 text-white">
      
      {/* Safety Notification Banner */}
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-950/95 border-2 border-red-500/60 shadow-2xl shadow-black/90 text-red-200 text-xs py-3 px-6 rounded-xl font-bold font-mono tracking-wide pointer-events-auto z-55 animate-pulse max-w-sm text-center">
          {notification}
        </div>
      )}
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start w-full">
        {/* Title and Coordinates */}
        <div className="bg-gray-900/85 backdrop-blur-md rounded-xl p-4 border border-lime-500/30 flex flex-col gap-1 pointer-events-auto max-w-sm shadow-xl shadow-black/40">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lime-500 rounded-full animate-pulse" />
            <h1 className="text-xl font-black tracking-wider text-lime-400 font-mono">LIMECRAFT</h1>
          </div>
          <p className="text-xs text-gray-400 font-medium">3D Voxel Sandbox • Styled TV Static Edition</p>

          {/* Coordinates HUD */}
          {settings.showCoordinates && coordinates && (
            <div className="mt-3 border-t border-gray-800 pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
              <span className="text-gray-400">Position:</span>
              <span className="text-lime-300 text-right">
                X: {Math.round(coordinates.x)} Y: {Math.round(coordinates.y)} Z: {Math.round(coordinates.z)}
              </span>
              {lookAngle && (
                <>
                  <span className="text-gray-400">Direction:</span>
                  <span className="text-lime-400 text-right">
                    Yaw: {Math.round((lookAngle.yaw * 180) / Math.PI)}°
                  </span>
                </>
              )}
              <span className="text-gray-400">Total Blocks:</span>
              <span className="text-gray-300 text-right">
                {(Object.values(blockCounts) as number[]).reduce((a, b) => a + b, 0)}
              </span>
              <span className="text-gray-400 flex items-center lg:gap-1 gap-0.5">
                <Gamepad2 size={12} className={gamepadConnected ? 'text-lime-400' : 'text-gray-500'} /> Controller:
              </span>
              <span className={`text-right truncate max-w-[130px] font-semibold ${gamepadConnected ? 'text-lime-300' : 'text-gray-500 text-[10px]'}`} title={gamepadConnected ? gamepadName : 'Logitech/Standard'}>
                {gamepadConnected ? (gamepadName.includes('(') ? gamepadName.split('(')[0].trim() : gamepadName || 'Connected') : 'None'}
              </span>
            </div>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
          <div className="flex gap-2 bg-gray-900/85 backdrop-blur-md rounded-xl p-2 border border-gray-800 shadow-lg shadow-black/30">
            <button
              onClick={() => setIsCraftingOpen(prev => !prev)}
              title="Open Crafting Workbench (C)"
              className={`p-2 rounded-lg transition-colors flex items-center justify-center font-bold text-sm ${
                isCraftingOpen ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-gray-800 text-amber-450 hover:bg-gray-750'
              }`}
            >
              ⚒ Craft
            </button>
            <button
              onClick={() => {
                setShowTextures(prev => !prev);
                setShowSettings(false);
                setShowHelp(false);
                setIsCraftingOpen(false);
              }}
              title="Texture Packs Manager"
              className={`px-3 py-1 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black ${
                showTextures ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-gray-800 text-emerald-400 hover:bg-gray-750'
              }`}
            >
              <Palette size={15} /> Packs
            </button>
            <button
              onClick={() => setShowHelp(prev => !prev)}
              title="Show Instructions"
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                showHelp ? 'bg-lime-500 text-black hover:bg-lime-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={() => setShowSettings(prev => !prev)}
              title="Settings"
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                showSettings ? 'bg-lime-500 text-black hover:bg-lime-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Sliders size={18} />
            </button>
            <button
              onClick={onSaveWorld}
              title="Save World to Browser"
              className="p-2 rounded-lg bg-gray-800 text-lime-400 hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <Save size={18} />
            </button>
            <button
              onClick={onResetWorld}
              title="Regenerate New World"
              className="p-2 rounded-lg bg-gray-800 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Prompt regarding pointer lock state */}
          <button
            onClick={onTogglePointerLock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all mt-1 ${
              pointerLocked
                ? 'bg-lime-500/20 text-lime-400 border-lime-500/50'
                : 'bg-red-500/10 text-red-400 border-red-500/40 animate-pulse'
            }`}
          >
            {pointerLocked ? '✓ Pointer Locked' : '⚠ Click Canvas or Here to Lock mouse'}
          </button>
        </div>
      </div>

      {/* CENTER POP-UPS: HELP & SETTINGS */}
      <div className="flex-1 flex justify-center items-center pointer-events-none relative">
        
        {/* HELP MENU OVERLAY */}
        {showHelp && (
          <div className="absolute bg-gray-950/90 max-w-sm md:max-w-md w-full p-6 rounded-2xl border border-lime-500/40 shadow-2xl shadow-black/85 pointer-events-auto transform transition-all duration-300 mx-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-base font-extrabold tracking-wider text-lime-400 flex items-center gap-2">
                <Gamepad2 size={18} /> LIMECRAFT CONTROLS
              </h2>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white text-xs bg-gray-800 px-2 py-1 rounded-md"
              >
                Close (H)
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300 font-mono">
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-lime-300 font-semibold">W, A, S, D</span>
                <span className="text-gray-300 text-right">Move player</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-lime-300 font-semibold">SPACEBAR</span>
                <span className="text-gray-300 text-right">Jump / Ascend (Fly)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-lime-300 font-semibold">SHIFT key</span>
                <span className="text-gray-300 text-right">Descend (Flymode)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-lime-300 font-semibold">MOUSE LOOK</span>
                <span className="text-gray-300 text-right">Aim camera / Reticle</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-red-400 font-semibold">LEFT-CLICK</span>
                <span className="text-gray-300 text-right">Mine / Destroy Block</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-green-400 font-semibold">RIGHT-CLICK</span>
                <span className="text-gray-300 text-right">Place Active Block</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-900 pb-2">
                <span className="text-lime-300 font-semibold font-mono">NUMKEYS [1 - 6]</span>
                <span className="text-gray-300 text-right">Select Hotbar block</span>
              </div>

              {/* Gamepad mappings integration */}
              <div className="border-t border-gray-800 pt-3 mt-4">
                <h3 className="text-lime-400 font-bold tracking-wider mb-2 text-xs uppercase flex items-center gap-1.5 font-mono">
                  🎮 LOGITECH / GAMEPAD CO-PILOT
                </h3>
                <div className="space-y-2 text-[11px] leading-relaxed text-gray-300">
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">Left Stick</span>
                    <span>Analogue Walk & Strafe</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">Right Stick</span>
                    <span>Pan Camera / Look</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">RT or X button</span>
                    <span>Mine block</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">LT or B button</span>
                    <span>Place block</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">LB / RB Bumpers</span>
                    <span>Cycle block selection</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-300 font-bold">A Button</span>
                    <span>Jump / Ascend (Fly)</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span className="text-lime-100 font-bold">Start / Select</span>
                    <span>Toggle Menu & Cursor</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-800 mt-4 leading-relaxed text-[11px] text-gray-400 select-text">
                <span className="font-bold text-gray-300">Note:</span> If standard pointer lock is blocked, you can use <span className="text-lime-400">Arrow Keys</span> on your keyboard to look around, or click-hold and drag to orbit and explore.
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS DRAWER OVERLAY */}
        {showSettings && (
          <div className="absolute bg-gray-950/90 max-w-sm w-full p-5 rounded-2xl border border-gray-800 shadow-2xl shadow-black/85 pointer-events-auto transform transition-all mx-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-sm font-extrabold tracking-wide text-lime-400 flex items-center gap-2">
                <Sliders size={16} /> WORLD OPTIONS
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-xs bg-gray-800 px-2 py-0.5 rounded-md"
              >
                Done
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Fly Mode Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-lime-400" /> Fly Mode (Creative)
                </span>
                <input 
                  type="checkbox"
                  checked={settings.flyMode}
                  onChange={(e) => onChangeSettings(prev => ({ ...prev, flyMode: e.target.checked }))}
                  className="accent-lime-500 w-4 h-4 rounded cursor-pointer pointer-events-auto"
                />
              </div>

              {/* Gravity Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Compass size={14} className="text-blue-400" /> Gravity Physics
                </span>
                <input 
                  type="checkbox"
                  disabled={settings.flyMode}
                  checked={settings.gravity && !settings.flyMode}
                  onChange={(e) => onChangeSettings(prev => ({ ...prev, gravity: e.target.checked }))}
                  className="accent-lime-500 w-4 h-4 rounded cursor-pointer pointer-events-auto disabled:opacity-40"
                />
              </div>

              {/* Wireframe Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Maximize2 size={14} className="text-orange-400" /> Wireframe Mode
                </span>
                <input 
                  type="checkbox"
                  checked={settings.wireframe}
                  onChange={(e) => onChangeSettings(prev => ({ ...prev, wireframe: e.target.checked }))}
                  className="accent-lime-500 w-4 h-4 rounded cursor-pointer pointer-events-auto"
                />
              </div>

              {/* Show Coordinates Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Tv size={14} className="text-teal-400" /> Show Coordinates HUD
                </span>
                <input 
                  type="checkbox"
                  checked={settings.showCoordinates}
                  onChange={(e) => onChangeSettings(prev => ({ ...prev, showCoordinates: e.target.checked }))}
                  className="accent-lime-500 w-4 h-4 rounded cursor-pointer pointer-events-auto"
                />
              </div>

              {/* Hard Texture Pack Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-400 font-bold" /> Hard Texture Pack 🛠
                </span>
                <input 
                  type="checkbox"
                  checked={settings.hardTexturePack}
                  onChange={(e) => onChangeSettings(prev => ({ ...prev, hardTexturePack: e.target.checked }))}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer pointer-events-auto shadow"
                />
              </div>

              {/* Flat World Generator Toggle */}
              <div className="border-t border-gray-900 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-semibold">Flat World Plane</span>
                  <input 
                    type="checkbox"
                    checked={settings.flatWorld}
                    onChange={(e) => {
                      onChangeSettings(prev => ({ ...prev, flatWorld: e.target.checked }));
                    }}
                    className="accent-lime-500 w-4 h-4 rounded cursor-pointer pointer-events-auto"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                  Reduces height generation to a level plane. Click "Regenerate" on top right to rebuild world!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TEXTURE PACKS OVERLAY */}
        {showTextures && (
          <div className="absolute bg-gray-950/95 max-w-sm w-full p-5 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-black/90 pointer-events-auto transform transition-all mx-4 z-55">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-xs font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5 font-mono">
                <Palette size={16} /> LIME-STORE PACKS
              </h2>
              <button 
                onClick={() => setShowTextures(false)}
                className="text-gray-400 hover:text-white text-xs bg-gray-800 hover:bg-gray-750 px-2 py-0.5 rounded-md cursor-pointer font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Vanilla Default Pack */}
              <div className="bg-gray-900/45 p-3 rounded-xl border border-gray-800 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-200">Limecraft Vanilla</span>
                  {!settings.hardTexturePack ? (
                    <span className="text-[10px] px-2 py-0.5 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded font-bold">
                      ✓ Active
                    </span>
                  ) : (
                    <button
                      onClick={() => onChangeSettings(prev => ({ ...prev, hardTexturePack: false }))}
                      className="text-[10px] px-2.5 py-1 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded cursor-pointer font-bold transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Standard cozy voxel textures, light blue skies, drifting white clouds, and standard furry woodland mobs.
                </p>
              </div>

              {/* Hard Core Pack v2.5 */}
              <div className="bg-gray-900/45 p-3 rounded-xl border border-emerald-500/20 flex flex-col gap-2 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                      Hard Core Pack <span className="text-[9px] px-1 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded font-normal">v2.5</span>
                    </span>
                    <span className="text-[9px] text-gray-400">Published by LimeCraft Team</span>
                  </div>
                  
                  {isHardpackDownloaded ? (
                    <div className="flex gap-1.5 items-center">
                      {settings.hardTexturePack ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 rounded font-black animate-pulse">
                          ✓ Active
                        </span>
                      ) : (
                        <button
                          onClick={() => onChangeSettings(prev => ({ ...prev, hardTexturePack: true }))}
                          className="text-[10px] px-2.5 py-1 bg-emerald-500 text-black hover:bg-emerald-400 rounded cursor-pointer font-bold transition-all shadow-md shadow-emerald-500/10"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  ) : (
                    downloadStatus === 'idle' ? (
                      <button
                        onClick={startHardpackDownload}
                        className="text-[10px] px-2.5 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded cursor-pointer font-black transition-all flex items-center gap-1 shadow-md shadow-emerald-500/10 animate-pulse"
                      >
                        <Download size={11} /> Download Free
                      </button>
                    ) : null
                  )}
                </div>

                {/* If Downloading / Unpacking / Compiling */}
                {downloadStatus !== 'idle' && !isHardpackDownloaded && (
                  <div className="bg-gray-950 p-2.5 rounded-lg border border-emerald-500/20 space-y-2 mt-1">
                    <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin text-emerald-400" />
                        {downloadStatus === 'downloading' && `Downloading data: ${downloadProgress}%`}
                        {downloadStatus === 'unpacking' && "Extracting high-contrast maps..."}
                        {downloadStatus === 'compiling' && "Compiling metallic voxel shaders..."}
                      </span>
                      <span>{downloadStatus === 'downloading' ? '4.12 MB' : 'Processing'}</span>
                    </div>

                    {downloadStatus === 'downloading' && (
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-gray-400 space-y-1.5 border-t border-gray-900 pt-2.5 leading-normal">
                  <div className="flex gap-1.5">
                    <span className="text-emerald-400">💎</span>
                    <span><strong>Diamond Clouds:</strong> Dynamic blue-cyan celestial skies with sapphire foggy borders.</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-emerald-400">☁</span>
                    <span><strong>Tree Clouds:</strong> Drifting sky clouds replaced with massive thick wood trunks and emerald foliage!</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-emerald-400">🟢</span>
                    <span><strong>Transparent Emeralds:</strong> Crystal green glass with gorgeous 70% transparency.</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-emerald-400">⚙</span>
                    <span><strong>Iron & Obsidian Mobs:</strong> Chickens and cows built of shiny metal; cats feature Obsidian skins in normal world dimensions!</span>
                  </div>
                </div>

                {/* Uninstall Option */}
                {isHardpackDownloaded && (
                  <div className="flex justify-end gap-2 border-t border-gray-900 pt-2 mt-1">
                    <button
                      onClick={uninstallHardpack}
                      className="text-[9px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Delete Pack / Re-download
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-gray-500 leading-normal text-center bg-gray-900/25 p-2 rounded">
                ⚡ Textures instantly update in real-time. No restart needed. Select "Done" or "Close" to return to the play scope.
              </div>
            </div>
          </div>
        )}

        {/* CRAFTING TABLE WORKBENCH OVERLAY */}
        {isCraftingOpen && (
          <div className="absolute bg-gray-950/95 max-w-xl w-full p-6 rounded-2xl border border-amber-500/40 shadow-2xl shadow-black/85 pointer-events-auto transform transition-all mx-4 z-55">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-sm font-extrabold tracking-widest text-amber-400 flex items-center gap-2">
                ⚒ WORKBENCH CRAFTING TABLE
              </h2>
              <button 
                onClick={() => setIsCraftingOpen(false)}
                className="text-gray-400 hover:text-white text-xs bg-gray-800 px-2 py-1 rounded-md cursor-pointer"
              >
                Close (C)
              </button>
            </div>

            <p className="text-[11px] text-amber-200/95 font-mono mb-4 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 leading-normal">
              ⚒ <strong>Instructions:</strong> Click any slot in the 3x3 grid below to place your currently selected block (<strong>{BLOCKS[selectedBlock].name}</strong>). Click any filled slot again to clear it! Make special shapes to forge unique items!
            </p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left Panel: 3x3 Grid */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase mb-2 tracking-widest font-mono">3x3 Grid Table</span>
                <div className="grid grid-cols-3 gap-2 bg-amber-950/20 p-4 rounded-xl border-2 border-amber-700/30">
                  {craftGrid.map((blockType, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newGrid = [...craftGrid];
                        if (newGrid[idx] === null) {
                          newGrid[idx] = selectedBlock;
                        } else {
                          newGrid[idx] = null;
                        }
                        setCraftGrid(newGrid);
                      }}
                      className="w-16 h-16 bg-gray-900/95 active:bg-gray-800 hover:border-amber-400 rounded-lg border border-gray-880 flex items-center justify-center relative group overflow-hidden cursor-pointer pointer-events-auto"
                    >
                      {blockType !== null ? (
                        <>
                          <BlockThumbnail type={blockType} className="w-12 h-12 border-0 pointer-events-none" />
                          <div className="absolute bottom-0.5 right-1 text-[8px] bg-black/60 px-1 rounded text-amber-300 font-mono pointer-events-none">
                            {BLOCKS[blockType].name.substring(0, 5)}
                          </div>
                        </>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-800 group-hover:bg-amber-500/50" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Clear Button */}
                <button
                  onClick={() => setCraftGrid(Array(9).fill(null))}
                  className="mt-3 px-3 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs text-red-400 font-mono hover:text-red-300 transition-colors cursor-pointer pointer-events-auto"
                >
                  Clear Grid ⎋
                </button>
              </div>

              {/* Center: Arrow */}
              <div className="flex flex-col items-center text-amber-500/60 rotate-90 md:rotate-0">
                <span className="text-xl">➔</span>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">FORGE</span>
              </div>

              {/* Right Panel: Output & Recipes */}
              <div className="flex-1 w-full bg-gray-900/60 p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center min-h-[170px]">
                {isStoneCross && (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-amber-500/10 rounded-xl border-2 border-amber-500/30 p-1 shadow-lg shadow-amber-500/5">
                      {/* Grey Stone Sword SVG Thumb */}
                      <svg width="44" height="44" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="26" width="2" height="2" fill="#5c3a21" />
                        <rect x="6" y="24" width="2" height="2" fill="#5c3a21" />
                        <rect x="8" y="22" width="2" height="2" fill="#8b5a2b" />
                        <rect x="8" y="20" width="2" height="2" fill="#3a3a3a" />
                        <rect x="10" y="20" width="2" height="2" fill="#2d2d2d" />
                        <rect x="6" y="22" width="2" height="2" fill="#2d2d2d" />
                        <rect x="10" y="18" width="2" height="2" fill="#7a7a7a" />
                        <rect x="12" y="16" width="2" height="2" fill="#7a7a7a" />
                        <rect x="14" y="14" width="2" height="2" fill="#7a7a7a" />
                        <rect x="16" y="12" width="2" height="2" fill="#7a7a7a" />
                        <rect x="18" y="10" width="2" height="2" fill="#7a7a7a" />
                        <rect x="20" y="8" width="2" height="2" fill="#7a7a7a" />
                        <rect x="22" y="6" width="2" height="2" fill="#7a7a7a" />
                        <rect x="24" y="4" width="2" height="2" fill="#b3b3b3" />
                      </svg>
                    </div>
                    <h3 className="text-amber-300 font-black text-xs uppercase tracking-wider font-mono mt-3">STONE SWORD</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Grey slate blades</p>
                    <button
                      onClick={() => {
                        setHasCraftedSword(true);
                        setIsSwordEquipped(true);
                        setCraftGrid(Array(9).fill(null));
                      }}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-xs font-mono tracking-wider rounded-lg hover:from-amber-500 hover:to-amber-400 border border-amber-400 active:scale-95 transition-all shadow-lg cursor-pointer pointer-events-auto"
                    >
                      🔨 FORGE SWORD
                    </button>
                  </div>
                )}

                {isBunchOfStone && (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-cyan-500/10 rounded-xl border-2 border-cyan-500/30 p-1 shadow-lg shadow-cyan-500/5 font-black text-xl text-cyan-400">
                      ∞
                    </div>
                    <h3 className="text-cyan-300 font-black text-xs uppercase tracking-wider font-mono mt-3">INFINITE BLOCKS</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">limitless inventory items</p>
                    <button
                      onClick={() => {
                        onChangeSettings(prev => ({ ...prev, infiniteBlocks: true }));
                        setCraftGrid(Array(9).fill(null));
                      }}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-black font-black text-xs font-mono tracking-wider rounded-lg hover:from-cyan-500 hover:to-cyan-400 border border-cyan-400 active:scale-95 transition-all shadow-lg cursor-pointer pointer-events-auto"
                    >
                      ⚡ ACTIVATE ENGINE
                    </button>
                  </div>
                )}

                {isDiamondBlockRecipe && (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-sky-500/15 rounded-xl border-2 border-sky-400/50 p-1 shadow-lg shadow-sky-400/10">
                      <BlockThumbnail type={BlockType.DIAMOND} className="w-12 h-12 border-0 pointer-events-none" />
                    </div>
                    <h3 className="text-sky-350 font-black text-xs uppercase tracking-wider font-mono mt-3 text-sky-400">DIAMOND BLOCK</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Blue transparent crystal block</p>
                    <button
                      onClick={() => {
                        onSelectBlock(BlockType.DIAMOND);
                        setCraftGrid(Array(9).fill(null));
                      }}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 text-white font-black text-xs font-mono tracking-wider rounded-lg hover:from-sky-550 hover:to-sky-400 border border-sky-400 active:scale-95 transition-all shadow-lg cursor-pointer pointer-events-auto"
                    >
                      💎 FORGE DIAMOND BLOCK
                    </button>
                  </div>
                )}

                {isGoldBlockRecipe && (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-amber-550/15 rounded-xl border-2 border-amber-400/50 p-1 shadow-lg shadow-amber-400/10">
                      <BlockThumbnail type={BlockType.GOLD_BLOCK} className="w-12 h-12 border-0 pointer-events-none" />
                    </div>
                    <h3 className="text-amber-300 font-black text-xs uppercase tracking-wider font-mono mt-3 text-amber-400">BLOCK OF GOLD</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Prestigious heavy raw gold block</p>
                    <button
                      onClick={() => {
                        onSelectBlock(BlockType.GOLD_BLOCK);
                        setCraftGrid(Array(9).fill(null));
                        window.dispatchEvent(new CustomEvent('show-game-notification', { detail: '👑 Prestigious Block of Gold forged and placed in your hand!' }));
                      }}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-xs font-mono tracking-wider rounded-lg hover:from-amber-550 hover:to-amber-400 border border-amber-400 active:scale-95 transition-all shadow-lg cursor-pointer pointer-events-auto"
                    >
                      🏆 FORGE GOLD BLOCK
                    </button>
                  </div>
                )}

                {!isStoneCross && !isBunchOfStone && !isDiamondBlockRecipe && !isGoldBlockRecipe && (
                  <div className="flex flex-col items-center text-center justify-center p-2">
                    <div className="w-10 h-10 rounded-lg border border-dashed border-gray-750 flex items-center justify-center text-gray-500 text-xl font-mono">
                      ?
                    </div>
                    <span className="text-gray-400 text-[10px] mt-2 font-mono font-bold uppercase tracking-wider">Select Recipe</span>
                    <div className="text-[10px] text-gray-500 font-mono mt-2 space-y-1 max-w-xs leading-relaxed text-left">
                      <p>
                        ⚔ <strong>Stone Sword</strong>: Build a <span className="text-amber-400">Cross Shape (+)</span> with Stone blocks (center/edges).
                      </p>
                      <p>
                        ⚡ <strong>Infinite Blocks</strong>: Place <span className="text-cyan-400">4+ Stone blocks</span> anywhere in the grid slot array!
                      </p>
                      <p>
                        💎 <strong>Diamond Block</strong>: Fill <span className="text-sky-400">4+ Diamond Items</span> into the grid to craft!
                      </p>
                      <p>
                        🏆 <strong>Gold Block</strong>: Fill all <span className="text-yellow-400">9 workbench slots</span> with Gold Shards!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER HUD: ON-SCREEN ACTION TRIGGERS & THE HOTBAR INVENTORY */}
      <div className="flex flex-col gap-4 items-center w-full">
        
        {/* Mobile/Iframe Assist Buttons: Click to Mine / Click to Place Blocks */}
        <div className="flex gap-4 p-1.5 pointer-events-auto">
          <button
            onClick={() => onTriggerAction('mine')}
            className="px-5 py-3 rounded-xl bg-red-650/90 active:bg-red-700 hover:bg-red-500 text-white font-black text-xs font-mono tracking-wider border border-red-500 shadow-xl shadow-black/60 pointer-events-auto flex items-center gap-2 cursor-pointer"
          >
            ⛏ MINE BLOCK
          </button>
          
          <button
            onClick={() => onTriggerAction('add')}
            className="px-5 py-3 rounded-xl bg-lime-600/90 active:bg-lime-750 hover:bg-lime-500 text-white font-black text-xs font-mono tracking-wider border border-lime-500 shadow-xl shadow-black/60 pointer-events-auto flex items-center gap-2 cursor-pointer"
          >
            ✚ PLACE ACTIVE
          </button>

          {/* Special Weapon trigger badge */}
          {hasCraftedSword && (
            <button
              onClick={() => setIsSwordEquipped(prev => !prev)}
              className={`px-4 py-3 rounded-xl font-mono font-black text-xs border tracking-wider transition-all pointer-events-auto flex items-center gap-1.5 cursor-pointer shadow-lg shadow-black/40 ${
                isSwordEquipped 
                  ? 'bg-amber-500 text-black border-amber-400 hover:bg-amber-450' 
                  : 'bg-gray-900/90 text-gray-300 border-gray-800 hover:bg-gray-800'
              }`}
            >
              ⚔ {isSwordEquipped ? 'SWORD EQUIPPED' : 'EQUIP STONE SWORD'}
            </button>
          )}
        </div>

        {/* Selected Block Info & Toggle HUD Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-gray-900/95 px-3 py-1.5 rounded-xl border border-gray-800 text-[11px] uppercase font-bold tracking-widest text-lime-400 font-mono shadow-md shadow-black/40">
            Selected Block: {BLOCKS[selectedBlock].name}
          </div>
          
          <button
            onClick={() => setIsHotbarVisible(prev => !prev)}
            className="bg-gray-900/95 hover:bg-gray-850 px-3 py-1.5 rounded-xl border border-gray-800 text-[11px] uppercase font-bold tracking-widest text-gray-300 font-mono shadow-md shadow-black/40 pointer-events-auto flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95"
            title="Toggle hotbar visibility"
          >
            {isHotbarVisible ? <EyeOff className="w-3.5 h-3.5 text-lime-500" /> : <Eye className="w-3.5 h-3.5 text-lime-500 animate-pulse" />}
            {isHotbarVisible ? 'Hide Hotbar (H)' : 'Show Hotbar (H)'}
          </button>
        </div>

        {/* Hotbar Grid Slider */}
        {isHotbarVisible ? (
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-950/95 p-2 rounded-2xl border border-gray-800 shadow-2xl shadow-black/90 pointer-events-auto flex-wrap justify-center transition-all duration-300">
            {hotbarBlocks.map((type, index) => {
              const isSelected = selectedBlock === type;
              const config = BLOCKS[type];
              return (
                <button
                  key={type}
                  onClick={() => onSelectBlock(type)}
                  className={`group flex flex-col items-center p-1 rounded-xl transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-lime-500/20 border-2 border-lime-400 scale-105 shadow-lg shadow-lime-500/10' 
                      : 'bg-transparent border-2 border-transparent hover:bg-gray-900 hover:border-gray-800'
                  }`}
                >
                  {/* Hotbar Indicator Number */}
                  <div className="absolute top-1 left-2 bg-black/60 px-1 rounded text-[8px] font-mono select-none z-10 text-gray-500 font-bold group-hover:text-white">
                    {index === 9 ? '0' : index === 10 ? 'M' : index === 11 ? 'D' : index === 12 ? 'I' : index === 13 ? 'B' : index === 14 ? 'P' : index + 1}
                  </div>

                  <BlockThumbnail type={type} className={isSelected ? 'border-lime-400 shadow shadow-lime-400' : 'border-gray-700'} />
                  
                  {/* Visual Label */}
                  <span className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded text-gray-300 font-semibold group-hover:text-lime-300">
                    {config.name}
                  </span>
                  
                  {/* Simple Counts indicators for fun */}
                  {settings.infiniteBlocks ? (
                    <span className="text-[9px] font-mono text-cyan-400 mt-0.5 font-bold animate-pulse">
                      ∞ materials
                    </span>
                  ) : blockCounts[type] !== undefined ? (
                    <span className="text-[9px] font-mono text-gray-500 mt-0.5 group-hover:text-gray-400">
                      {blockCounts[type]} placed
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-gray-500 mt-0.5">
                      0 placed
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Re-open Hotbar trigger container */
          <div className="pointer-events-auto">
            <button
              onClick={() => setIsHotbarVisible(true)}
              className="flex items-center gap-2 bg-lime-650/90 hover:bg-lime-500 active:scale-95 text-[#090d16] font-black text-xs font-mono tracking-widest py-3 px-6 rounded-2xl border-2 border-lime-400 shadow-2xl shadow-lime-500/10 cursor-pointer transition-all uppercase"
            >
              <Eye className="w-4 h-4" /> Re-open Hotbar Inventory (H)
            </button>
          </div>
        )}
      </div>

      {/* FLOATING STONE SWORD IF WEAPON IS ACTIVE */}
      {isSwordEquipped && (
        <div 
          className="absolute bottom-4 right-4 sm:bottom-12 sm:right-16 pointer-events-none select-none z-50 origin-bottom-right transition-transform"
          style={{
            transform: isSwinging 
              ? 'rotate(-55deg) translate(-25px, -15px)' 
              : 'rotate(10deg) translate(0px, 0px)',
            transition: isSwinging ? 'transform 55ms ease-out' : 'transform 150ms ease-in-out',
            filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.65))'
          }}
        >
          {/* Detailed pixel-art Grey Stone Sword matching the grayer-slate requirement */}
          <svg width="150" height="150" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wooden Handle Grip */}
            <rect x="5" y="25" width="2" height="2" fill="#522f18" />
            <rect x="7" y="23" width="2" height="2" fill="#522f18" />
            <rect x="9" y="21" width="2" height="2" fill="#8c5832" />
            
            {/* Handguard - Dark Grey Slate Bevels */}
            <rect x="9" y="19" width="3" height="2" fill="#3a3a3a" />
            <rect x="7" y="21" width="2" height="3" fill="#3a3a3a" />
            <rect x="11" y="21" width="2" height="2" fill="#2d2d2d" />
            <rect x="5" y="23" width="2" height="2" fill="#2d2d2d" />

            {/* Muted Gray Stone Blade matching the stone color specification */}
            <rect x="11" y="17" width="2" height="2" fill="#7d7d7d" />
            <rect x="13" y="15" width="2" height="2" fill="#7d7d7d" />
            <rect x="15" y="13" width="2" height="2" fill="#7d7d7d" />
            <rect x="17" y="11" width="2" height="2" fill="#7d7d7d" />
            <rect x="19" y="9" width="2" height="2" fill="#7d7d7d" />
            <rect x="21" y="7" width="2" height="2" fill="#7d7d7d" />
            <rect x="23" y="5" width="2" height="2" fill="#7d7d7d" />
            
            {/* Lighter Slate Highlight border lines */}
            <rect x="12" y="17" width="1" height="1" fill="#9c9c9c" />
            <rect x="14" y="15" width="1" height="1" fill="#9c9c9c" />
            <rect x="16" y="13" width="1" height="1" fill="#9c9c9c" />
            <rect x="18" y="11" width="1" height="1" fill="#9c9c9c" />
            <rect x="20" y="9" width="1" height="1" fill="#9c9c9c" />
            <rect x="22" y="7" width="1" height="1" fill="#9c9c9c" />
            <rect x="24" y="5" width="1" height="1" fill="#9c9c9c" />
            <rect x="25" y="3" width="2" height="2" fill="#c4c4c4" />

            {/* Darker Slate Shadows */}
            <rect x="10" y="18" width="1" height="1" fill="#5c5c5c" />
            <rect x="12" y="16" width="1" height="1" fill="#5c5c5c" />
            <rect x="14" y="14" width="1" height="1" fill="#5c5c5c" />
            <rect x="16" y="12" width="1" height="1" fill="#5c5c5c" />
            <rect x="18" y="10" width="1" height="1" fill="#5c5c5c" />
            <rect x="20" y="8" width="1" height="1" fill="#5c5c5c" />
            <rect x="22" y="6" width="1" height="1" fill="#5c5c5c" />
          </svg>
        </div>
      )}

      {/* FLOATING DELICIOUS MEAT STEAK IF SELECTED */}
      {selectedBlock === BlockType.MEAT && (
        <div 
          className="absolute bottom-4 right-4 sm:bottom-12 sm:right-16 pointer-events-none select-none z-50 origin-bottom-right transition-transform"
          style={{
            transform: isEating 
              ? 'scale(0.85) rotate(-20deg) translate(-20px, 15px)' 
              : 'scale(1) rotate(0deg) translate(0px, 0px)',
            transition: isEating ? 'transform 80ms ease-out' : 'transform 180ms ease-in-out',
            filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.65))'
          }}
        >
          {/* Juicy Pixel-Art Steak */}
          <svg width="150" height="150" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outline maroon/dark border */}
            <path d="M10 6C6 6 4 10 4 14C4 18 6 22 10 24C12 25 14 26 18 26C24 26 28 22 28 16C28 10 24 6 18 6H10Z" fill="#3a1111" />
            
            {/* Outer crust - cooked red beef */}
            <path d="M11 8C8 8 6 11 6 14C6 17 8 20 11 22C13 23 15 24 18 24C23 24 26 20 26 16C26 11 23 8 18 8H11Z" fill="#802020" />
            
            {/* Inner tender beef juicy pink */}
            <path d="M13 10C10 10 8 12 8 15C8 17 11 19 13 20C15 21 17 21 19 21C22 21 24 18 24 15C24 12 22 10 19 10H13Z" fill="#cc4444" opacity="0.9" />

            {/* Fat strip white marble line */}
            <path d="M18 8C19 8 20 10 20 12C20 14 21 15 22 16C23 17 24 18 25 18C25.5 18 26 17 26 16C26 14 24 13 23 11C22 9 20 8 18 8Z" fill="#ffeeee" />

            {/* T-bone center curve (classic steak steak bone) */}
            <path d="M12 12C12 11 13 10 14 10C15 10 16 11 16 12C16 13 15 14 14 14C13 14 12 13 12 12Z" fill="#ffffea" />
            <path d="M14 12H10" stroke="#ffffea" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 12V18" stroke="#ffffea" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 12C9 12 8 13 8 14" stroke="#ffffea" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Glistening highlight dots */}
            <rect x="9" y="16" width="2" height="1" fill="#ffa0a0" />
            <rect x="15" y="19" width="3" height="1" fill="#ffa0a0" />
          </svg>
        </div>
      )}

      {/* CONTAINER STORAGE OVERLAY (CHEST & CABINET) */}
      {activeContainer && (
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 bg-gray-950/95 max-w-xl w-[92%] p-5 sm:p-6 rounded-2xl border border-amber-500/40 shadow-2xl shadow-black/95 pointer-events-auto transform transition-all z-55 flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
            <h2 className="text-sm font-extrabold tracking-widest text-amber-400 flex items-center gap-2 font-mono">
              {activeContainer.type === 'chest' ? '📦 WOODEN TRASH & SECURE STORAGE CHEST' : '🚪 ELITE SCANDINAVIAN CABINET DOOR'}
            </h2>
            <button 
              onClick={() => setActiveContainer(null)} 
              className="text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-850 border border-gray-800 px-3 py-1 rounded-lg text-xs font-mono select-none pointer-events-auto cursor-pointer"
            >
              [CLOSE]
            </button>
          </div>
          
          <p className="text-xs text-gray-400 font-mono mb-4 leading-normal">
            🌐 Coordinate ID: <span className="text-amber-400 font-bold">{activeContainer.key}</span>. Click an empty slot to deposit holding <span className="text-lime-300 font-bold">{BLOCKS[selectedBlock].name}</span>, or click a stored item to retrieve it!
          </p>

          {/* Storage Grid View */}
          <div className={`grid gap-2 bg-gray-900/40 p-3 rounded-xl border border-gray-900 justify-center mb-5 ${activeContainer.type === 'chest' ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {(containerStates[activeContainer.key] || []).map((contents, sIdx) => {
              const config = contents !== null ? BLOCKS[contents] : null;
              return (
                <button
                  key={sIdx}
                  onClick={() => {
                    setContainerStates(prev => {
                      const nextGrid = [...(prev[activeContainer.key] || [])];
                      if (contents !== null) {
                        // Retrieve and clear slot
                        nextGrid[sIdx] = null;
                        onSelectBlock(contents);
                        window.dispatchEvent(new CustomEvent('show-game-notification', { detail: `Retrieved ${config?.name} to hand!` }));
                      } else {
                        // Store current selected Block
                        nextGrid[sIdx] = selectedBlock;
                        window.dispatchEvent(new CustomEvent('show-game-notification', { detail: `Deposited ${BLOCKS[selectedBlock].name} into Slot ${sIdx + 1}` }));
                      }
                      return {
                        ...prev,
                        [activeContainer.key]: nextGrid
                      };
                    });
                  }}
                  className="aspect-square w-12 h-12 sm:w-14 sm:h-14 bg-gray-950 hover:bg-gray-900 rounded-xl border border-gray-850 hover:border-lime-500/50 flex flex-col items-center justify-center relative cursor-pointer group transition-all"
                >
                  {/* Slot coordinate/label */}
                  <span className="absolute top-1 left-2 text-[7px] font-mono text-gray-600 group-hover:text-gray-400">
                    #{sIdx + 1}
                  </span>

                  {contents !== null ? (
                    <div className="flex flex-col items-center pointer-events-none scale-90">
                      <BlockThumbnail type={contents} className="w-8 h-8 border-0 pointer-events-none" />
                      <span className="text-[6.5px] text-lime-400 font-mono mt-0.5 max-w-[40px] truncate text-center leading-none font-bold">
                        {config?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[8px] text-gray-700 font-mono group-hover:text-lime-500/50 font-extrabold select-none mt-2">[EMPTY]</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3 mt-1.5 flex-wrap">
            <button
              onClick={() => {
                setContainerStates(prev => {
                  const slotsCount = activeContainer.type === 'chest' ? 18 : 12;
                  return {
                    ...prev,
                    [activeContainer.key]: Array(slotsCount).fill(null)
                  };
                });
                window.dispatchEvent(new CustomEvent('show-game-notification', { detail: '🗑️ Storage completely emptied!' }));
              }}
              className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-bold font-mono rounded-xl cursor-pointer pointer-events-auto"
            >
              🗑️ CLEAR STORAGE
            </button>
            
            <button
              onClick={() => {
                setContainerStates(prev => {
                  const nextGrid = [...(prev[activeContainer.key] || [])];
                  const emptyIdx = nextGrid.indexOf(null);
                  if (emptyIdx !== -1) {
                    nextGrid[emptyIdx] = selectedBlock;
                    window.dispatchEvent(new CustomEvent('show-game-notification', { detail: `Deposited ${BLOCKS[selectedBlock].name} inside Slot ${emptyIdx + 1}` }));
                  } else {
                    window.dispatchEvent(new CustomEvent('show-game-notification', { detail: `⚠️ Container storage is fully packed!` }));
                  }
                  return {
                    ...prev,
                    [activeContainer.key]: nextGrid
                  };
                });
              }}
              className="px-4 py-2 bg-lime-900/80 hover:bg-lime-850 border border-lime-500/30 text-lime-200 text-xs font-bold font-mono rounded-xl cursor-pointer pointer-events-auto"
            >
              📥 QUICK STORE HOLDING
            </button>
          </div>
        </div>
      )}

      {/* PERSISTENT CHAT & COMMAND CONSOLE PANEL */}
      <div className="absolute left-4 bottom-28 max-w-md w-[350px] sm:w-[500px] z-50 flex flex-col gap-1.5 pointer-events-none select-text">
        
        {/* Chat log history overlay */}
        <div 
          className={`flex flex-col gap-1 rounded-xl p-3 max-h-[185px] overflow-y-auto transition-opacity duration-300 font-mono text-sm leading-relaxed ${
            isCommandBoxOpen 
              ? 'bg-black/75 border border-zinc-800/80 pointer-events-auto' 
              : 'bg-black/25 select-none'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {chatLogs.slice(-8).map((log, index) => {
            let textColor = 'text-neutral-200';
            if (log.startsWith('> ')) {
              textColor = 'text-gray-400 font-bold';
            } else if (log.includes('🔴') || log.includes('⚠️') || log.includes('WARNING')) {
              textColor = 'text-red-400 font-extrabold animate-pulse';
            } else if (log.includes('👤') || log.includes('dark presence')) {
              textColor = 'text-indigo-400 font-bold';
            } else if (log.includes('🤖') || log.includes('System:')) {
              textColor = 'text-lime-400 font-semibold';
            } else if (log.includes('🛸') || log.includes('Warp')) {
              textColor = 'text-cyan-300';
            } else if (log.includes('🛸') || log.includes('Teleported')) {
              textColor = 'text-sky-300';
            } else if (log.includes('🌎') || log.includes('🚀') || log.includes('🛠️')) {
              textColor = 'text-yellow-300';
            } else if (log.startsWith('❌')) {
              textColor = 'text-rose-400';
            }
            return (
              <div 
                key={index} 
                className={`break-words text-xs tracking-wide py-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${textColor}`}
              >
                {log}
              </div>
            );
          })}
        </div>

        {/* Console Command Input Box */}
        {isCommandBoxOpen && (
          <form 
            onSubmit={handleInputSubmit}
            className="flex items-center gap-2 bg-black/90 p-2.5 rounded-xl border border-lime-400/50 shadow-2xl pointer-events-auto shadow-black/90"
          >
            <span className="text-lime-400 font-mono text-sm font-black animate-pulse select-none pl-1">
              /
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Enter command... (e.g. tp 1003993, help)"
              className="flex-1 bg-transparent border-none outline-none text-lime-400 text-xs font-mono placeholder-lime-400/35"
              spellCheck={false}
              autoComplete="off"
            />
            <button 
              type="submit"
              className="px-3 py-1 bg-lime-500 text-black font-mono font-black text-[10px] tracking-widest rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              RUN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
