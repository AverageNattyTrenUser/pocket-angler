/* Pocket Angler — game data (fish, locations, upgrades) */
(function (G) {
  const PA = (G.PA = G.PA || {});

  PA.RARITY = {
    common:    { name: 'Common',    color: '#9aa7b4', w: 60,  luck: 0.15, idx: 0 },
    uncommon:  { name: 'Uncommon',  color: '#5cc46b', w: 26,  luck: 0.35, idx: 1 },
    rare:      { name: 'Rare',      color: '#3d9be9', w: 10,  luck: 0.6,  idx: 2 },
    epic:      { name: 'Epic',      color: '#b05ce6', w: 3.6, luck: 0.9,  idx: 3 },
    legendary: { name: 'Legendary', color: '#ffb627', w: 0.9, luck: 1.25, idx: 4 },
  };

  // look: body, belly, fin, pattern, pat (pattern colour), shape, tail, extra[]
  // shape: normal | long | tall | round | eel | flat | shark
  // tail: fork | round | moon | square | fan | point
  PA.LOCATIONS = [
    {
      id: 'pond', name: 'Willow Pond', cost: 0, tier: 1,
      blurb: 'A sleepy pond under an old willow. Perfect for beginners.',
      water: ['#5aa79a', '#1c4b4c'], sky: ['#8fd3f4', '#e0f4ff'], ground: '#7cb75b',
    },
    {
      id: 'river', name: 'Pebble River', cost: 600, tier: 2,
      blurb: 'Quick, clear water tumbling over stones. Trout love it here.',
      water: ['#57a2c4', '#18465f'], sky: ['#86c8f0', '#e6f6ff'], ground: '#6aa857',
    },
    {
      id: 'lake', name: 'Pine Lake', cost: 2500, tier: 3,
      blurb: 'A deep mountain lake ringed with pines. Big predators lurk below.',
      water: ['#4588b0', '#0f3250'], sky: ['#7ab9e8', '#dcefff'], ground: '#4f8a4a',
    },
    {
      id: 'coast', name: 'Sunny Coast', cost: 8000, tier: 4,
      blurb: 'Salt air, warm sun and fish that fight like freight trains.',
      water: ['#2eb0d0', '#08385f'], sky: ['#6fc4f2', '#fff1d0'], ground: '#e8cf91',
    },
    {
      id: 'frost', name: 'Frostbite Bay', cost: 25000, tier: 5,
      blurb: 'Icy northern waters. Bring your best gear — and a warm hat.',
      water: ['#5d97b8', '#0d2a44'], sky: ['#a6cfe9', '#f2f8ff'], ground: '#eef5fb',
    },
  ];

  const L = (o) => o;
  PA.FISH = [
    // ---------------- Willow Pond ----------------
    L({ id: 'minnow', name: 'Minnow', rarity: 'common', loc: 'pond', time: 'any', depth: 0.15, w: [0.02, 0.09], price: 6, str: 0.25, spd: 1.6, end: 0.6, agi: 0.2,
      desc: 'Tiny, quick and everywhere. Every angler\'s first catch.',
      look: { body: '#9aa88a', belly: '#e9efe2', fin: '#b8c2a8', pattern: 'stripe', pat: '#5e6b55', shape: 'long', tail: 'fork' } }),
    L({ id: 'bluegill', name: 'Bluegill', rarity: 'common', loc: 'pond', time: 'day', depth: 0.35, w: [0.1, 0.6], price: 10, str: 0.4, spd: 1.8, end: 0.8, agi: 0.3,
      desc: 'A round little sunfish with a dark ear flap. Loves warm shallows.',
      look: { body: '#4f73a8', belly: '#f3b54a', fin: '#3d5b86', pattern: 'bands', pat: '#3a5784', shape: 'tall', tail: 'square', extra: ['earflap'] } }),
    L({ id: 'goldfish', name: 'Goldfish', rarity: 'uncommon', loc: 'pond', time: 'any', depth: 0.25, w: [0.1, 0.9], price: 22, str: 0.45, spd: 1.7, end: 0.8, agi: 0.35,
      desc: 'Somebody\'s pet that made a break for freedom. It\'s doing great.',
      look: { body: '#f28c28', belly: '#ffd27a', fin: '#ff9f43', pattern: 'none', shape: 'normal', tail: 'fan' } }),
    L({ id: 'carp', name: 'Common Carp', rarity: 'uncommon', loc: 'pond', time: 'any', depth: 0.6, w: [1, 9], price: 30, str: 0.85, spd: 1.8, end: 1.4, agi: 0.25,
      desc: 'A heavy bottom-feeder. Patient, stubborn and surprisingly strong.',
      look: { body: '#a27d3c', belly: '#ead39a', fin: '#8b6a33', pattern: 'scales', pat: '#7a5c2a', shape: 'normal', tail: 'fork', extra: ['barbels'] } }),
    L({ id: 'koi', name: 'Koi', rarity: 'rare', loc: 'pond', time: 'day', depth: 0.4, w: [1, 6], price: 90, str: 0.9, spd: 2.0, end: 1.3, agi: 0.4,
      desc: 'Elegant and painted like a lantern. Said to bring good luck.',
      look: { body: '#f6f3ea', belly: '#ffffff', fin: '#f1e6d6', pattern: 'koi', pat: '#e63946', shape: 'normal', tail: 'fan', extra: ['barbels'] } }),
    L({ id: 'tench', name: 'Golden Tench', rarity: 'epic', loc: 'pond', time: 'night', depth: 0.7, w: [1, 4], price: 220, str: 1.2, spd: 2.3, end: 1.6, agi: 0.5,
      desc: 'A glowing gold fish that only rises after sunset.',
      look: { body: '#d6a823', belly: '#f6dc7c', fin: '#b98c17', pattern: 'none', shape: 'normal', tail: 'round', extra: ['barbels'], glow: '#ffd75a' } }),
    L({ id: 'whiskers', name: 'Old Whiskers', rarity: 'legendary', loc: 'pond', time: 'night', depth: 0.95, w: [25, 60], price: 900, str: 1.8, spd: 2.6, end: 2.4, agi: 0.55,
      desc: 'A colossal catfish older than the willow itself. Hunts on dark nights in the deepest part of the pond.',
      look: { body: '#4b5040', belly: '#bdb99d', fin: '#3a3e31', pattern: 'mottle', pat: '#383c2e', shape: 'long', tail: 'round', extra: ['whiskers'] } }),

    // ---------------- Pebble River ----------------
    L({ id: 'trout', name: 'Rainbow Trout', rarity: 'common', loc: 'river', time: 'any', depth: 0.4, w: [0.3, 2.5], price: 24, str: 0.7, spd: 2.4, end: 1.0, agi: 0.45,
      desc: 'A pink stripe and a fondness for acrobatics.',
      look: { body: '#8d9c63', belly: '#f6e2d8', fin: '#9aa676', pattern: 'rainbow', pat: '#e77f9a', shape: 'normal', tail: 'square' } }),
    L({ id: 'perch', name: 'Perch', rarity: 'common', loc: 'river', time: 'day', depth: 0.3, w: [0.2, 1.5], price: 20, str: 0.6, spd: 2.0, end: 0.9, agi: 0.35,
      desc: 'Striped, spiny and always hungry.',
      look: { body: '#a3b23d', belly: '#f6eab0', fin: '#e8833a', pattern: 'bands', pat: '#4f5d1f', shape: 'tall', tail: 'fork', extra: ['spinydorsal'] } }),
    L({ id: 'chub', name: 'Chub', rarity: 'uncommon', loc: 'river', time: 'any', depth: 0.5, w: [0.5, 3], price: 40, str: 0.8, spd: 2.2, end: 1.1, agi: 0.35,
      desc: 'A chunky river fish that will eat almost anything.',
      look: { body: '#7f8c90', belly: '#e9eef0', fin: '#c0705a', pattern: 'scales', pat: '#5f6b6e', shape: 'normal', tail: 'fork' } }),
    L({ id: 'grayling', name: 'Grayling', rarity: 'uncommon', loc: 'river', time: 'day', depth: 0.45, w: [0.3, 1.8], price: 55, str: 0.85, spd: 2.5, end: 1.0, agi: 0.5,
      desc: 'Flies a huge sail-like fin, shimmering violet in the sun.',
      look: { body: '#8d95ab', belly: '#e7e9f2', fin: '#8e6bb5', pattern: 'spots', pat: '#3b3f55', shape: 'normal', tail: 'fork', extra: ['sail'] } }),
    L({ id: 'salmon', name: 'Salmon', rarity: 'rare', loc: 'river', time: 'any', depth: 0.65, w: [3, 15], price: 180, str: 1.4, spd: 3.0, end: 1.6, agi: 0.6,
      desc: 'Powered by pure determination. It swam a long way to get here.',
      look: { body: '#93a9bf', belly: '#f4f6f8', fin: '#7d91a6', pattern: 'spots', pat: '#2f3b48', shape: 'normal', tail: 'square' } }),
    L({ id: 'sturgeon', name: 'Sturgeon', rarity: 'epic', loc: 'river', time: 'night', depth: 0.9, w: [10, 40], price: 420, str: 1.8, spd: 2.2, end: 2.4, agi: 0.35,
      desc: 'An armoured giant from the age of dinosaurs.',
      look: { body: '#6c705c', belly: '#d8d6c4', fin: '#575b48', pattern: 'scutes', pat: '#d8d6c4', shape: 'shark', tail: 'shark', extra: ['barbels'] } }),
    L({ id: 'ghosttrout', name: 'Ghost Trout', rarity: 'legendary', loc: 'river', time: 'night', depth: 0.8, w: [6, 14], price: 1600, str: 2.5, spd: 3.4, end: 2.4, agi: 0.75,
      desc: 'A pale, glowing trout seen only by moonlight. Many swear it isn\'t real.',
      look: { body: '#dfeaf4', belly: '#ffffff', fin: '#b9d4ec', pattern: 'spots', pat: '#7fb6e6', shape: 'normal', tail: 'square', glow: '#9fd3ff' } }),

    // ---------------- Pine Lake ----------------
    L({ id: 'bass', name: 'Largemouth Bass', rarity: 'common', loc: 'lake', time: 'day', depth: 0.4, w: [0.8, 5], price: 50, str: 1.0, spd: 2.4, end: 1.2, agi: 0.45,
      desc: 'Big mouth, big attitude.',
      look: { body: '#5d8240', belly: '#eae6bb', fin: '#577a3b', pattern: 'blotch', pat: '#2f4a22', shape: 'normal', tail: 'square', extra: ['bigmouth'] } }),
    L({ id: 'walleye', name: 'Walleye', rarity: 'common', loc: 'lake', time: 'night', depth: 0.6, w: [1, 6], price: 55, str: 1.0, spd: 2.2, end: 1.2, agi: 0.4,
      desc: 'Glassy eyes that see perfectly in the dark.',
      look: { body: '#b59b4b', belly: '#f4f0d8', fin: '#9c8540', pattern: 'mottle', pat: '#7a6a33', shape: 'long', tail: 'fork', extra: ['bigeye'] } }),
    L({ id: 'pike', name: 'Northern Pike', rarity: 'uncommon', loc: 'lake', time: 'any', depth: 0.5, w: [2, 12], price: 95, str: 1.4, spd: 3.0, end: 1.3, agi: 0.6,
      desc: 'An ambush hunter with a duck-bill jaw full of teeth.',
      look: { body: '#4f6c3b', belly: '#e6e8c9', fin: '#6e7d3a', pattern: 'spots', pat: '#cfd8a4', shape: 'long', tail: 'fork', extra: ['duckbill'] } }),
    L({ id: 'laketrout', name: 'Lake Trout', rarity: 'uncommon', loc: 'lake', time: 'any', depth: 0.85, w: [2, 14], price: 110, str: 1.4, spd: 2.5, end: 1.5, agi: 0.45,
      desc: 'Lives deep where the water stays cold all summer.',
      look: { body: '#5c6c72', belly: '#eef1f2', fin: '#6e7e84', pattern: 'spots', pat: '#d9e1e3', shape: 'normal', tail: 'fork' } }),
    L({ id: 'paddlefish', name: 'Paddlefish', rarity: 'rare', loc: 'lake', time: 'any', depth: 0.7, w: [5, 30], price: 330, str: 1.7, spd: 2.4, end: 1.8, agi: 0.45,
      desc: 'Sports a long paddle-shaped nose. Nobody is quite sure why.',
      look: { body: '#7d8c97', belly: '#dfe5ea', fin: '#66747e', pattern: 'none', shape: 'shark', tail: 'shark', extra: ['paddle'] } }),
    L({ id: 'muskie', name: 'Muskellunge', rarity: 'epic', loc: 'lake', time: 'any', depth: 0.6, w: [6, 25], price: 700, str: 2.2, spd: 3.4, end: 2.0, agi: 0.7,
      desc: 'The fish of ten thousand casts. Worth every one of them.',
      look: { body: '#8a8f55', belly: '#eeead0', fin: '#a2763e', pattern: 'bands', pat: '#4d5230', shape: 'long', tail: 'fork', extra: ['duckbill'] } }),
    L({ id: 'monarch', name: 'Lake Monarch', rarity: 'legendary', loc: 'lake', time: 'any', depth: 0.95, w: [30, 70], price: 3500, str: 3.2, spd: 3.8, end: 2.8, agi: 0.8,
      desc: 'A golden giant crowned with spines. Rules the deepest water in Pine Lake.',
      look: { body: '#c99a2c', belly: '#fff0b8', fin: '#a87914', pattern: 'spots', pat: '#fff6d0', shape: 'long', tail: 'fork', extra: ['duckbill', 'crest'], glow: '#ffd75a' } }),

    // ---------------- Sunny Coast ----------------
    L({ id: 'mackerel', name: 'Mackerel', rarity: 'common', loc: 'coast', time: 'any', depth: 0.3, w: [0.3, 1.5], price: 70, str: 1.2, spd: 3.2, end: 1.0, agi: 0.5,
      desc: 'Sleek tiger stripes and boundless energy.',
      look: { body: '#2f7f8f', belly: '#eef4f6', fin: '#2a6c79', pattern: 'wavy', pat: '#173e47', shape: 'long', tail: 'fork' } }),
    L({ id: 'seabream', name: 'Sea Bream', rarity: 'common', loc: 'coast', time: 'day', depth: 0.4, w: [0.5, 3], price: 85, str: 1.3, spd: 2.6, end: 1.2, agi: 0.4,
      desc: 'A rosy, round-faced reef regular.',
      look: { body: '#d9a6a0', belly: '#f8ece8', fin: '#c98a84', pattern: 'scales', pat: '#b98580', shape: 'tall', tail: 'fork' } }),
    L({ id: 'puffer', name: 'Pufferfish', rarity: 'uncommon', loc: 'coast', time: 'day', depth: 0.35, w: [0.3, 2], price: 160, str: 1.0, spd: 1.6, end: 1.0, agi: 0.3,
      desc: 'Inflates when annoyed. You annoyed it.',
      look: { body: '#e8c46a', belly: '#fbf2d6', fin: '#d4a94a', pattern: 'spots', pat: '#7a5a22', shape: 'round', tail: 'round', extra: ['spikes'] } }),
    L({ id: 'snapper', name: 'Red Snapper', rarity: 'uncommon', loc: 'coast', time: 'any', depth: 0.6, w: [2, 10], price: 190, str: 1.8, spd: 2.8, end: 1.6, agi: 0.5,
      desc: 'Bright red and quick-tempered.',
      look: { body: '#e0574a', belly: '#f8c5b5', fin: '#c8463b', pattern: 'scales', pat: '#c04a3e', shape: 'tall', tail: 'fork' } }),
    L({ id: 'mahi', name: 'Mahi-Mahi', rarity: 'rare', loc: 'coast', time: 'day', depth: 0.45, w: [5, 20], price: 520, str: 2.3, spd: 3.8, end: 1.8, agi: 0.75,
      desc: 'Electric green and gold. Fights like it\'s on fire.',
      look: { body: '#2fb36b', belly: '#f2d43a', fin: '#2a8fc4', pattern: 'spots', pat: '#1d6fb8', shape: 'long', tail: 'fork', extra: ['bluntface', 'longdorsal'] } }),
    L({ id: 'swordfish', name: 'Swordfish', rarity: 'epic', loc: 'coast', time: 'any', depth: 0.85, w: [40, 200], price: 1600, str: 3.0, spd: 4.0, end: 2.4, agi: 0.75,
      desc: 'Armed with a sword for a face. Please don\'t argue with it.',
      look: { body: '#3c4f6d', belly: '#c9d4e2', fin: '#33435d', pattern: 'none', shape: 'shark', tail: 'moon', extra: ['bill'] } }),
    L({ id: 'goldmarlin', name: 'Golden Marlin', rarity: 'legendary', loc: 'coast', time: 'any', depth: 0.95, w: [120, 400], price: 8000, str: 4.0, spd: 4.6, end: 3.0, agi: 0.85,
      desc: 'A sun-gold marlin of sailors\' legends. Sightings are rare; catches rarer still.',
      look: { body: '#e3b021', belly: '#fff3c4', fin: '#2f6fb5', pattern: 'bands', pat: '#f6d566', shape: 'shark', tail: 'moon', extra: ['bill', 'sail'], glow: '#ffe37a' } }),

    // ---------------- Frostbite Bay ----------------
    L({ id: 'char', name: 'Arctic Char', rarity: 'common', loc: 'frost', time: 'any', depth: 0.4, w: [1, 6], price: 180, str: 1.7, spd: 3.0, end: 1.3, agi: 0.5,
      desc: 'A cold-water cousin of the trout with a sunset-orange belly.',
      look: { body: '#6c7b8b', belly: '#f08a5d', fin: '#e46d48', pattern: 'spots', pat: '#f6c7b4', shape: 'normal', tail: 'square' } }),
    L({ id: 'cod', name: 'Atlantic Cod', rarity: 'common', loc: 'frost', time: 'day', depth: 0.6, w: [2, 12], price: 200, str: 1.9, spd: 2.5, end: 1.6, agi: 0.35,
      desc: 'A speckled northern staple with a single chin whisker.',
      look: { body: '#a39566', belly: '#efe9d4', fin: '#8f8258', pattern: 'spots', pat: '#6b5f3a', shape: 'normal', tail: 'square', extra: ['chinbarbel', 'stripeline'] } }),
    L({ id: 'lumpfish', name: 'Lumpfish', rarity: 'uncommon', loc: 'frost', time: 'any', depth: 0.5, w: [1, 5], price: 320, str: 1.6, spd: 1.8, end: 1.6, agi: 0.3,
      desc: 'Bumpy, round and extremely huggable. Clings to rocks with a sucker.',
      look: { body: '#6f8f4e', belly: '#c9d79a', fin: '#5d7a40', pattern: 'none', shape: 'round', tail: 'round', extra: ['bumps'] } }),
    L({ id: 'halibut', name: 'Halibut', rarity: 'uncommon', loc: 'frost', time: 'any', depth: 0.9, w: [10, 80], price: 450, str: 2.6, spd: 2.6, end: 2.2, agi: 0.4,
      desc: 'A huge flatfish with both eyes on one side. It saw you first.',
      look: { body: '#6a5a48', belly: '#9c8a74', fin: '#5a4c3c', pattern: 'mottle', pat: '#4b3f32', shape: 'flat', tail: 'square' } }),
    L({ id: 'icefish', name: 'Icefish', rarity: 'rare', loc: 'frost', time: 'night', depth: 0.7, w: [0.5, 2.5], price: 900, str: 2.4, spd: 3.6, end: 1.8, agi: 0.8,
      desc: 'Clear as glass with antifreeze in its veins.',
      look: { body: '#cfe6f2', belly: '#f4fbff', fin: '#a9d1e6', pattern: 'none', shape: 'long', tail: 'fork', extra: ['duckbill'], glow: '#bfe9ff' } }),
    L({ id: 'shark', name: 'Greenland Shark', rarity: 'epic', loc: 'frost', time: 'night', depth: 0.95, w: [150, 600], price: 3200, str: 3.6, spd: 2.8, end: 3.2, agi: 0.5,
      desc: 'Slow, ancient and enormous. Some are over 300 years old.',
      look: { body: '#5d6770', belly: '#9aa3ab', fin: '#4d565e', pattern: 'mottle', pat: '#4a535b', shape: 'shark', tail: 'shark' } }),
    L({ id: 'aurora', name: 'Aurora Eel', rarity: 'legendary', loc: 'frost', time: 'night', depth: 0.85, w: [8, 25], price: 15000, str: 4.6, spd: 4.6, end: 3.0, agi: 0.9,
      desc: 'An eel that carries the northern lights inside it. The ultimate catch.',
      look: { body: '#38d39f', belly: '#b18cff', fin: '#6ee7ff', pattern: 'aurora', pat: '#ff7ad9', shape: 'eel', tail: 'point', glow: '#7dffcf' } }),
  ];

  PA.JUNK = [
    { id: 'boot', name: 'Soggy Boot', value: 3, emoji: 'boot' },
    { id: 'can', name: 'Rusty Can', value: 2, emoji: 'can' },
    { id: 'weed', name: 'Tangled Weed', value: 1, emoji: 'weed' },
    { id: 'duck', name: 'Rubber Duck', value: 25, emoji: 'duck' },
  ];

  PA.UPGRADES = {
    rod: {
      label: 'Rod', stat: 'Reel speed',
      items: [
        { name: 'Twig Rod', cost: 0, reel: 3.0, hook: 0.85 },
        { name: 'Bamboo Rod', cost: 150, reel: 3.7, hook: 0.95 },
        { name: 'Fiberglass Rod', cost: 700, reel: 4.5, hook: 1.05 },
        { name: 'Carbon Rod', cost: 2600, reel: 5.4, hook: 1.15 },
        { name: 'Pro Rod', cost: 9000, reel: 6.4, hook: 1.25 },
        { name: 'Legend Rod', cost: 30000, reel: 7.6, hook: 1.35 },
      ],
    },
    line: {
      label: 'Line', stat: 'Strength',
      items: [
        { name: 'Cotton Line', cost: 0, str: 1.0, len: 45 },
        { name: 'Nylon Line', cost: 120, str: 1.4, len: 55 },
        { name: 'Braided Line', cost: 600, str: 1.9, len: 65 },
        { name: 'Fluoro Line', cost: 2200, str: 2.6, len: 75 },
        { name: 'Titan Line', cost: 8000, str: 3.5, len: 90 },
        { name: 'Dragon Line', cost: 26000, str: 4.6, len: 110 },
      ],
    },
    bait: {
      label: 'Bait', stat: 'Bite speed & luck',
      items: [
        { name: 'Bread', cost: 0, bite: 1.0, luck: 0 },
        { name: 'Worms', cost: 100, bite: 0.85, luck: 0.3 },
        { name: 'Crickets', cost: 500, bite: 0.72, luck: 0.6 },
        { name: 'Shrimp', cost: 1800, bite: 0.62, luck: 1.0 },
        { name: 'Glow Lure', cost: 6500, bite: 0.54, luck: 1.5 },
        { name: 'Golden Lure', cost: 22000, bite: 0.46, luck: 2.2 },
      ],
    },
  };

  // ---------------------------------------------------------------
  // Fight physics — shared by the game and the balance simulator.
  // ---------------------------------------------------------------
  PA.newFight = function (fish, startDist, rnd) {
    return {
      t: 0, dist: startDist, startDist, T: 0.15, stam: 1, burst: 0, warn: 0,
      burstCd: 1.2 + rnd() * 1.5, snapT: 0, slackT: 0, seed: rnd() * 10,
      str: fish.str, spd: fish.spd, end: fish.end, agi: fish.agi,
    };
  };

  // hold: boolean; P = { reel, lineStr, lineLen }. Returns null | 'caught' | 'snap' | 'escape'
  PA.stepFight = function (f, hold, dt, P, rnd) {
    f.t += dt;
    if (f.burst > 0) {
      f.burst -= dt;
      if (f.burst <= 0) {
        f.burst = 0;
        f.burstCd = (3.4 - 2.2 * f.agi) * (0.6 + rnd() * 0.8);
      }
    } else if (f.warn > 0) {
      f.warn -= dt;
      if (f.warn <= 0) { f.warn = 0; f.burst = 0.5 + rnd() * 0.4 + f.agi * 0.6; }
    } else {
      f.burstCd -= dt;
      if (f.burstCd <= 0) f.warn = 0.5;
    }

    const stamF = 0.45 + 0.55 * f.stam;
    const wobble = 0.88 + 0.12 * Math.sin(f.t * 3.1 + f.seed) + 0.06 * Math.sin(f.t * 7.3 + f.seed * 2);
    const force = f.str * stamF * (f.burst > 0 ? 1.7 + 0.6 * f.agi : 1) * wobble;
    const ratio = force / P.lineStr;
    f.ratio = ratio;

    const target = hold ? ratio + 0.22 : ratio * 0.32;
    const rate = target > f.T ? 3.0 : 3.4;
    f.T += (target - f.T) * Math.min(1, rate * dt);

    const swim = f.spd * (0.35 + 0.65 * f.stam) * (f.burst > 0 ? 1.3 : 0.32);
    if (hold) {
      f.dist -= P.reel * (1 - 0.55 * Math.min(1, ratio)) * dt;
      if (f.burst > 0) f.dist += swim * 0.5 * dt;
    } else {
      f.dist += swim * dt;
    }

    const tc = Math.min(1, f.T);
    f.stam = Math.max(0, f.stam - (dt * (0.03 + 0.35 * tc)) / f.end);
    if (f.T < 0.2) f.stam = Math.min(1, f.stam + (dt * 0.03) / f.end);

    if (f.T >= 1) f.snapT += dt; else f.snapT = Math.max(0, f.snapT - dt * 2);

    if (f.snapT > 0.45) return 'snap';
    if (f.dist >= P.lineLen) return 'escape';
    if (f.dist <= 0.4) return 'caught';
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
