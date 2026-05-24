import * as THREE from 'three';

export class WorldManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    
    this.obstacles = [];
    this.collectibles = [];
    this.candles = [];
    
    this.treeGroups = [];
    this.mushroomGroups = [];
    
    this.themeMaterials = {};
    this.currentTheme = 'genesis';
    
    this.cakeMainGroup = new THREE.Group();
    this.cakeSliceGroup = new THREE.Group();
    this.decorationsGroup = new THREE.Group();
    
    this.islandGroup = new THREE.Group();
    this.cakeGroup = new THREE.Group();
    this.collectiblesGroup = new THREE.Group();
    
    this.scene.add(this.islandGroup);
    this.scene.add(this.cakeGroup);
    this.scene.add(this.collectiblesGroup);
    
    this.cakeGroup.add(this.cakeMainGroup);
    this.cakeGroup.add(this.cakeSliceGroup);
    this.cakeGroup.add(this.decorationsGroup);
    
    this.cakeGroup.position.set(0, 0.55, 0); 
    this.cakeGroup.visible = false;
    
    this.isAssembled = false;
    this.isCut = false;
    this.isGiftOpened = false;
    
    this.buildMaterials();
    this.buildIsland();
    this.buildPedestal();
    this.buildCollectibles();
    this.buildCake();
    this.buildKnife();
    this.buildMamiProps();
  }

  buildMaterials() {
    this.themeMaterials = {
      genesis: {
        grass: new THREE.MeshStandardMaterial({ color: 0x07150e, roughness: 0.8 }),
        grid: new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.35 }),
        crystal: { knife: 0xffffff, candle: 0x00ff88, gift: 0xff1744 }
      },
      cyber: {
        grass: new THREE.MeshStandardMaterial({ color: 0x040810, roughness: 0.9, metalness: 0.8 }),
        grid: new THREE.MeshBasicMaterial({ color: 0xff5500, wireframe: true, transparent: true, opacity: 0.45 }),
        crystal: { knife: 0xff3300, candle: 0xffbb00, gift: 0x00ffcc }
      },
      cosmic: {
        grass: new THREE.MeshStandardMaterial({ color: 0x12051d, roughness: 0.7, metalness: 0.2 }),
        grid: new THREE.MeshBasicMaterial({ color: 0xaa00ff, wireframe: true, transparent: true, opacity: 0.35 }),
        crystal: { knife: 0xaa22ff, candle: 0x00ffff, gift: 0xff00aa }
      }
    };
    
    this.sprinkleTexture = this.createSprinkleTexture();
    this.sprinkleMaterial = new THREE.MeshStandardMaterial({
      map: this.sprinkleTexture,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
  }

  createSprinkleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#fff6db';
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.fillStyle = '#ff5599';
    ctx.fillRect(0, 36, 128, 10);
    ctx.fillRect(0, 78, 128, 10);
    
    const colors = ['#ff3366', '#33ccff', '#ffff33', '#33ff33', '#ff8800', '#aa22ff'];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      const rx = Math.random() * 128;
      const ry = Math.random() * 128;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.8 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  buildIsland() {
    const baseGeo = new THREE.CylinderGeometry(15, 15, 1.4, 32);
    this.grassMesh = new THREE.Mesh(baseGeo, this.themeMaterials.genesis.grass);
    this.grassMesh.receiveShadow = true;
    this.islandGroup.add(this.grassMesh);
    
    const rootGeo = new THREE.ConeGeometry(15, 9, 32);
    rootGeo.translate(0, -4.5, 0);
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x1d1510, roughness: 0.9 });
    const root = new THREE.Mesh(rootGeo, rootMat);
    this.islandGroup.add(root);
    
    this.gridGeo = new THREE.PlaneGeometry(28.8, 28.8, 24, 24);
    this.gridGeo.rotateX(-Math.PI / 2);
    this.gridMesh = new THREE.Mesh(this.gridGeo, this.themeMaterials.genesis.grid);
    this.gridMesh.position.y = 0.76;
    this.islandGroup.add(this.gridMesh);
    
    this.gridInitialY = [];
    const positions = this.gridGeo.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      this.gridInitialY.push(positions[i * 3 + 1]);
    }
    
    for (let i = 0; i < 9; i++) {
      const rockGeo = new THREE.OctahedronGeometry(1.0 + Math.random() * 0.8, 1);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x221c2e, roughness: 0.6, metalness: 0.4 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 20 + Math.random() * 4;
      rock.position.set(Math.cos(angle) * radius, -1 + (Math.random() - 0.5) * 5, Math.sin(angle) * radius);
      rock.userData = { angle, speed: 0.003 + Math.random() * 0.004, radius, rotSpeed: 0.01 + Math.random() * 0.01 };
      this.islandGroup.add(rock);
    }
  }



  buildPedestal() {
    const altar = new THREE.Group();
    altar.position.set(0, 0.7, 0);
    
    const slabGeo = new THREE.CylinderGeometry(3.3, 3.6, 0.7, 16);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.95, roughness: 0.15 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.castShadow = true;
    slab.receiveShadow = true;
    altar.add(slab);
    
    const ringGeo = new THREE.RingGeometry(2.3, 2.5, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    this.altarRing = new THREE.Mesh(ringGeo, ringMat);
    this.altarRing.position.y = 0.36;
    altar.add(this.altarRing);
    
    const coords = [{x:2.7, z:0}, {x:-2.7, z:0}, {x:0, z:2.7}, {x:0, z:-2.7}];
    coords.forEach((coord, idx) => {
      const pillar = new THREE.Group();
      pillar.position.set(coord.x, 0.35, coord.z);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x151821, metalness: 0.8 }));
      beam.position.y = 0.9;
      beam.castShadow = true;
      pillar.add(beam);
      
      const gemGeo = new THREE.OctahedronGeometry(0.2, 0);
      const colors = [0x00ffcc, 0xff0088, 0xffff00, 0x0088ff];
      const color = colors[idx];
      const gemMat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.8, transmission: 0.9, thickness: 0.5 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.y = 2.1;
      gem.userData = { baseH: 2.1, rotSpeed: 0.03 + idx * 0.005 };
      pillar.add(gem);
      
      const light = new THREE.PointLight(color, 2.5, 4.5, 1.2);
      light.position.y = 2.1;
      pillar.add(light);
      
      altar.add(pillar);
      this.obstacles.push({ x: coord.x, z: coord.z, radius: 0.5 });
    });
    
    this.islandGroup.add(altar);
    this.obstacles.push({ x: 0, z: 0, radius: 2.1 });
  }

  buildCollectibles() {
    const locations = [
      { x: -3.8, z: 4.8, type: 'gift', color: 0xff1744 },   
      { x: 3.8, z: -3.2, type: 'candle', color: 0x00ff88 },  
      { x: -3.5, z: -4.5, type: 'knife', color: 0xffffff }   
    ];
    
    locations.forEach((loc) => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(loc.x, 2.2, loc.z);
      
      // Build realistic 3D model depending on the type
      const modelMesh = new THREE.Group();
      
      if (loc.type === 'gift') {
        const boxBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.55, 0.55),
          new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.3 })
        );
        boxBase.castShadow = true;
        modelMesh.add(boxBase);
        
        // Group for parts that will pop off (Lid + Ribbons + Bow)
        this.giftLidGroup = new THREE.Group();
        
        const boxLid = new THREE.Mesh(
          new THREE.BoxGeometry(0.60, 0.16, 0.60),
          new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.3 })
        );
        boxLid.position.y = 0.31;
        boxLid.castShadow = true;
        this.giftLidGroup.add(boxLid);
        
        const ribbon1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.58, 0.58),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
        );
        this.giftLidGroup.add(ribbon1);
        
        const ribbon2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.58, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
        );
        this.giftLidGroup.add(ribbon2);
        
        const bow1 = new THREE.Mesh(
          new THREE.TorusGeometry(0.08, 0.024, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
        );
        bow1.position.set(-0.06, 0.44, 0);
        bow1.rotation.y = Math.PI / 4;
        this.giftLidGroup.add(bow1);
        
        const bow2 = new THREE.Mesh(
          new THREE.TorusGeometry(0.08, 0.024, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
        );
        bow2.position.set(0.06, 0.44, 0);
        bow2.rotation.y = -Math.PI / 4;
        this.giftLidGroup.add(bow2);
        
        modelMesh.add(this.giftLidGroup);
        
        // Surprise Group (Ferrero Rocher 🍫) - initially hidden
        this.giftSurpriseGroup = new THREE.Group();
        this.giftSurpriseGroup.scale.set(0.001, 0.001, 0.001);
        this.giftSurpriseGroup.position.y = 0.15; // rest on bottom base
        
        // Warm golden spotlight for the Ferrero Rocher
        this.giftSurpriseLight = new THREE.PointLight(0xffd700, 0, 3.5, 1.2);
        this.giftSurpriseLight.position.set(0, 0.4, 0);
        this.giftSurpriseGroup.add(this.giftSurpriseLight);
        
        // Brown pleated paper cup base
        const cupGeo = new THREE.CylinderGeometry(0.18, 0.13, 0.16, 24);
        const cupMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.9 });
        const cup = new THREE.Mesh(cupGeo, cupMat);
        cup.castShadow = true;
        this.giftSurpriseGroup.add(cup);
        
        // Golden foil sphere (bumpy foil wrapped texture!)
        const foilGeo = new THREE.IcosahedronGeometry(0.19, 1);
        const foilMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.6,
          roughness: 0.25,
          emissive: 0xffaa00,
          emissiveIntensity: 0.45
        });
        const foil = new THREE.Mesh(foilGeo, foilMat);
        foil.position.y = 0.12;
        foil.castShadow = true;
        this.giftSurpriseGroup.add(foil);
        
        // Little signature oval sticker on top of the foil with golden backing
        const backGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.01, 12);
        const backMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.set(0, 0.305, 0);
        back.rotation.x = Math.PI / 18;
        this.giftSurpriseGroup.add(back);

        const stickerGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12);
        const stickerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
        const sticker = new THREE.Mesh(stickerGeo, stickerMat);
        sticker.position.set(0, 0.31, 0);
        sticker.rotation.x = Math.PI / 18; // slight tilt
        this.giftSurpriseGroup.add(sticker);
        
        modelMesh.add(this.giftSurpriseGroup);
        
      } else if (loc.type === 'candle') {
        const wax = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.65, 16),
          new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.5 })
        );
        wax.castShadow = true;
        modelMesh.add(wax);
        
        const wick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        wick.position.y = 0.365;
        modelMesh.add(wick);
        
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffaa33 })
        );
        flame.scale.set(1, 2.2, 1);
        flame.position.y = 0.48;
        modelMesh.add(flame);
        
      } else if (loc.type === 'knife') {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.18, 0.65),
          new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.1 })
        );
        blade.position.z = 0.3;
        blade.castShadow = true;
        modelMesh.add(blade);
        
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8),
          new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.8 })
        );
        handle.rotateX(Math.PI / 2);
        handle.position.z = -0.12;
        handle.castShadow = true;
        modelMesh.add(handle);
        
        modelMesh.rotation.set(Math.PI / 6, Math.PI / 4, 0);
      }
      
      itemGroup.add(modelMesh);
      
      const outerRingGeo = new THREE.TorusGeometry(0.68, 0.04, 6, 24);
      outerRingGeo.rotateX(Math.PI / 2);
      const outerRing = new THREE.Mesh(outerRingGeo, new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.5 }));
      itemGroup.add(outerRing);
      
      const groundRingGeo = new THREE.RingGeometry(0.5, 0.6, 16);
      groundRingGeo.rotateX(-Math.PI / 2);
      const groundRing = new THREE.Mesh(groundRingGeo, new THREE.MeshBasicMaterial({ color: loc.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
      groundRing.position.y = -1.4;
      itemGroup.add(groundRing);
      
      const light = new THREE.PointLight(loc.color, 4.5, 7.0, 1.2);
      light.position.y = 0.2;
      itemGroup.add(light);
      
      this.collectiblesGroup.add(itemGroup);
      
      this.collectibles.push({
        group: itemGroup,
        crystal: modelMesh, // Bind modelMesh so it bobs & rotates as crystal did
        outerRing: outerRing,
        light: light,
        type: loc.type,
        color: loc.color,
        x: loc.x,
        z: loc.z,
        collected: false
      });
    });
  }

  buildCake() {
    const tiers = [
      { r: 2.1, h: 1.0, y: 0.5, color: 0xff44aa, em: 0x330018 },
      { r: 1.5, h: 0.85, y: 1.35, color: 0x00ffff, em: 0x002222 },
      { r: 0.9, h: 0.7, y: 2.05, color: 0xffff00, em: 0x222200 }
    ];
    
    this.cakeMainGroup.clear();
    this.cakeSliceGroup.clear();
    this.decorationsGroup.clear();
    this.candles = [];
    
    tiers.forEach((t) => {
      const mainGeo = new THREE.CylinderGeometry(t.r, t.r, t.h, 32, 1, false, Math.PI / 4, Math.PI * 2 - Math.PI / 4);
      const mainMat = new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.35, metalness: 0.35, emissive: t.em, emissiveIntensity: 0.5 });
      const mainMesh = new THREE.Mesh(mainGeo, mainMat);
      mainMesh.position.y = t.y;
      mainMesh.castShadow = true;
      this.cakeMainGroup.add(mainMesh);
      
      const sliceGeo = new THREE.CylinderGeometry(t.r, t.r, t.h, 12, 1, false, 0, Math.PI / 4);
      const sliceMesh = new THREE.Mesh(sliceGeo, mainMat);
      sliceMesh.position.y = t.y;
      sliceMesh.castShadow = true;
      this.cakeSliceGroup.add(sliceMesh);
      
      const p1 = new THREE.Mesh(new THREE.PlaneGeometry(t.r, t.h), this.sprinkleMaterial);
      p1.position.set(t.r / 2, t.y, 0); 
      p1.rotation.y = Math.PI / 2; 
      this.cakeSliceGroup.add(p1);
      
      const p1Back = p1.clone();
      p1Back.rotation.y = -Math.PI / 2;
      this.cakeMainGroup.add(p1Back);
      
      const p2 = new THREE.Mesh(new THREE.PlaneGeometry(t.r, t.h), this.sprinkleMaterial);
      const rad45 = Math.PI / 4;
      p2.position.set(Math.cos(rad45) * (t.r / 2), t.y, -Math.sin(rad45) * (t.r / 2));
      p2.rotation.y = Math.PI / 2 - rad45;
      this.cakeSliceGroup.add(p2);
      
      const p2Back = p2.clone();
      p2Back.rotation.y = -Math.PI / 2 - rad45;
      this.cakeMainGroup.add(p2Back);
      
      const creamCount = Math.floor(t.r * 10);
      const creamGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      for (let i = 0; i < creamCount; i++) {
        const angle = Math.PI / 4 + (i / creamCount) * (Math.PI * 2 - Math.PI / 4);
        const cream = new THREE.Mesh(creamGeo, creamMat);
        cream.position.set(Math.cos(angle) * (t.r - 0.05), t.y + t.h / 2, Math.sin(angle) * (t.r - 0.05));
        this.cakeMainGroup.add(cream);
      }
    });
    
    const angleStep = (Math.PI * 2) / 6;
    const colors = [0xff44aa, 0x00ffff, 0xffff00, 0xff5500, 0x00ff88, 0xaa00ff];
    for (let i = 0; i < 6; i++) {
      const candle = new THREE.Group();
      const tierIdx = i % 2 === 0 ? 1 : 2;
      const t = tiers[tierIdx];
      const angle = i * angleStep;
      const x = Math.cos(angle) * (t.r - 0.25);
      const z = Math.sin(angle) * (t.r - 0.25);
      const y = t.y + t.h / 2 + 0.25;
      candle.position.set(x, y, z);
      
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.4 }));
      candle.add(wax);
      
      const flame = this.particles.createFlameMesh();
      flame.position.y = 0.38;
      candle.add(flame);
      
      const light = new THREE.PointLight(0xffaa44, 0, 4.5, 1.4);
      light.position.y = 0.44;
      candle.add(light);
      
      const normalizedAngle = angle % (Math.PI * 2);
      if (normalizedAngle >= 0 && normalizedAngle <= Math.PI / 4) {
        this.cakeSliceGroup.add(candle);
      } else {
        this.cakeMainGroup.add(candle);
      }
      this.candles.push({ group: candle, flameMesh: flame, light: light, lit: true, index: i });
    }
  }

  buildKnife() {
    this.knife = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.35, 1.3);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.15 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.z = 0.65;
    this.knife.add(blade);
    
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    handleGeo.rotateX(Math.PI / 2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.z = -0.2;
    this.knife.add(handle);
    
    this.knife.position.set(1.5, 3.8, 1.5);
    this.knife.rotation.set(-Math.PI / 4, 0, Math.PI / 6);
    this.knife.scale.set(0.001, 0.001, 0.001);
    this.scene.add(this.knife);
  }

  buildMamiProps() {
    this.mamiGroup = new THREE.Group();
    this.mamiGroup.position.set(0, 4.8, 0); // floats above the cake
    this.mamiGroup.scale.set(0.001, 0.001, 0.001);
    this.scene.add(this.mamiGroup);
    
    // Chef Hat
    this.chefHat = new THREE.Group();
    const hatBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    hatBase.castShadow = true;
    this.chefHat.add(hatBase);
    
    // Puffed top spheres
    const puffMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const puffCoords = [
      {x:0, y:0.12, z:0, r:0.18},
      {x:0.08, y:0.10, z:0.08, r:0.15},
      {x:-0.08, y:0.10, z:0.08, r:0.15},
      {x:0.08, y:0.10, z:-0.08, r:0.15},
      {x:-0.08, y:0.10, z:-0.08, r:0.15}
    ];
    puffCoords.forEach((p) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(p.r, 8, 8), puffMaterial);
      puff.position.set(p.x, p.y, p.z);
      this.chefHat.add(puff);
    });
    this.chefHat.position.set(-0.25, 0, 0);
    this.mamiGroup.add(this.chefHat);
    
    // Magic Wand
    this.magicWand = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
    );
    shaft.rotation.x = Math.PI / 2;
    this.magicWand.add(shaft);
    
    const tip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8, metalness: 0.8 })
    );
    tip.position.z = 0.32;
    this.magicWand.add(tip);
    
    this.magicWand.position.set(0.35, 0, 0);
    this.magicWand.rotation.set(-Math.PI / 4, 0, Math.PI / 6);
    this.mamiGroup.add(this.magicWand);
  }

  animateAssembly() {
    if (this.isAssembled) return;
    this.isAssembled = true;
    this.cakeGroup.visible = true;
    
    // Reset Mami props
    if (this.mamiGroup) {
      this.mamiGroup.scale.set(0.001, 0.001, 0.001);
      this.mamiGroup.position.set(0, 4.8, 0);
    }
    
    this.cakeMainGroup.position.y = 8;
    this.cakeSliceGroup.position.y = 8;
    this.cakeSliceGroup.position.x = 0;
    this.cakeSliceGroup.position.z = 0;
    
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      
      // Scale up Mami props at start
      if (elapsed < 500) {
        const ease = elapsed / 500;
        this.mamiGroup.scale.setScalar(ease * 1.2);
      }
      
      // Tiers start dropping in sequence:
      // Main tier starts at 600ms
      if (elapsed > 600 && this.cakeMainGroup.position.y > 0) {
        const t = Math.min((elapsed - 600) / 1000, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease out cubic
        this.cakeMainGroup.position.y = THREE.MathUtils.lerp(8, 0, ease);
        if (t === 1) this.particles.triggerConfettiBlast(new THREE.Vector3(0, 0.7, 0));
      }
      
      // Slice tier starts at 1400ms
      if (elapsed > 1400 && this.cakeSliceGroup.position.y > 0) {
        const t = Math.min((elapsed - 1400) / 1000, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        this.cakeSliceGroup.position.y = THREE.MathUtils.lerp(8, 0, ease);
        if (t === 1) {
          this.particles.triggerConfettiBlast(new THREE.Vector3(0, 0.7, 0));
          this.candles.forEach((c) => {
            if (c.lit) c.light.intensity = 2.5;
          });
        }
      }
      
      // Scale down Mami props and fade in knife at 2800ms
      if (elapsed > 2800) {
        const t = Math.min((elapsed - 2800) / 700, 1);
        this.mamiGroup.scale.setScalar(1.2 * (1 - t));
        
        const kT = Math.min((elapsed - 2800) / 700, 1);
        this.knife.scale.setScalar(kT);
      }
      
      if (elapsed < 3500) {
        requestAnimationFrame(animate);
      } else {
        this.mamiGroup.scale.setScalar(0);
      }
    };
    requestAnimationFrame(animate);
  }

  animateCut(callback) {
    if (this.isCut) return;
    this.isCut = true;
    
    const startTime = performance.now();
    const startPos = new THREE.Vector3(1.5, 3.8, 1.5);
    const cutPos = new THREE.Vector3(0, 2.8, 0); 
    const sliceEndPos = new THREE.Vector3(0, 0.55, 0); 
    
    const animate = (now) => {
      const elapsed = now - startTime;
      
      if (elapsed <= 600) {
        const t = elapsed / 600;
        this.knife.position.lerpVectors(startPos, cutPos, t);
        this.knife.rotation.set(-Math.PI / 8, 0, Math.PI / 8);
      }
      else if (elapsed <= 1200) {
        const t = (elapsed - 600) / 600;
        this.knife.position.lerpVectors(cutPos, sliceEndPos, t);
        
        if (t > 0.8 && this.candles[0].lit) {
          this.extinguishCandles();
          this.particles.triggerConfettiBlast(new THREE.Vector3(0, 0.6, 0));
        }
      }
      else if (elapsed <= 2200) {
        const t = (elapsed - 1200) / 1000;
        const slideAngle = Math.PI / 8;
        const slideDist = t * 0.7; 
        this.cakeSliceGroup.position.x = Math.cos(slideAngle) * slideDist;
        this.cakeSliceGroup.position.z = -Math.sin(slideAngle) * slideDist;
        
        this.knife.position.y = 0.55 + t * 3.0;
        this.knife.scale.setScalar(1 - t);
      }
      
      if (elapsed < 2200) {
        requestAnimationFrame(animate);
      } else {
        if (callback) callback();
      }
    };
    requestAnimationFrame(animate);
  }

  extinguishCandles() {
    this.candles.forEach((c) => {
      c.lit = false;
      if (c.flameMesh) {
        c.group.remove(c.flameMesh);
        c.flameMesh.geometry.dispose();
        c.flameMesh.material.dispose();
        c.flameMesh = null;
      }
      if (c.light) {
        c.light.intensity = 0;
      }
    });
  }

  openGift(callback) {
    if (this.isGiftOpened) return;
    this.isGiftOpened = true;
    
    // Find gift collectible coordinate for confetti blast
    const giftItem = this.collectibles.find(c => c.type === 'gift');
    const blastPos = giftItem ? giftItem.group.position : new THREE.Vector3(-3.8, 2.2, 4.8);
    
    const startTime = performance.now();
    const duration = 1200;
    
    const animateOpen = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Easing out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      
      // 1. Pop off lid group
      if (this.giftLidGroup) {
        this.giftLidGroup.position.y = ease * 2.5;
        this.giftLidGroup.rotation.x = ease * Math.PI / 3;
        this.giftLidGroup.rotation.z = -ease * Math.PI / 4;
        this.giftLidGroup.scale.setScalar(1 - t);
      }
      
      // 2. Animate surprise chocolate rising & scaling up
      if (this.giftSurpriseGroup) {
        const scale = 0.001 + ease * 1.8; // Scale up to 1.8x (impressive chocolate size!)
        this.giftSurpriseGroup.scale.setScalar(scale);
        this.giftSurpriseGroup.position.y = 0.1 + ease * 0.55; // Rise higher to sit cleanly above box base
        this.giftSurpriseGroup.rotation.y = ease * Math.PI * 4; // spin it
        
        // Flare up the golden spotlight inside
        if (this.giftSurpriseLight) {
          this.giftSurpriseLight.intensity = ease * 8.5;
        }
      }
      
      // Update parent gift light color to gold and increase brightness
      if (giftItem && giftItem.light) {
        giftItem.light.color.setHex(0xffd700);
        giftItem.light.intensity = 4.5 + ease * 4.0; // increase up to 8.5
      }
      
      if (t < 1) {
        requestAnimationFrame(animateOpen);
      } else {
        // Trigger confetti blast at open completion!
        this.particles.triggerConfettiBlast(blastPos);
        if (callback) callback();
      }
    };
    requestAnimationFrame(animateOpen);
  }

  swapTheme(themeName) {
    this.currentTheme = themeName;
    const assets = this.themeMaterials[themeName];
    if (!assets) return;
    this.grassMesh.material = assets.grass;
    this.gridMesh.material = assets.grid;
    const colors = { genesis: 0x00ffff, cyber: 0xff5500, cosmic: 0xaa22ff };
    this.altarRing.material.color.setHex(colors[themeName]);
    this.collectibles.forEach((item) => {
      if (!item.collected) {
        const hex = assets.crystal[item.type];
        if (item.outerRing) item.outerRing.material.color.setHex(hex);
        if (item.light) item.light.color.setHex(hex);
      }
    });
  }

  update(time, freqData = null) {
    // 1. Audio ripples
    if (this.gridGeo) {
      const positions = this.gridGeo.attributes.position.array;
      const count = positions.length / 3;
      let audioAmp = 0;
      if (freqData && freqData.length > 0) {
        audioAmp = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 1020;
      }
      for (let i = 0; i < count; i++) {
        const vx = positions[i * 3];
        const vz = positions[i * 3 + 2];
        const dist = Math.sqrt(vx*vx + vz*vz);
        const rippleSpeed = 4.2;
        const waveHeight = 0.12 + audioAmp * 0.95;
        positions[i * 3 + 1] = this.gridInitialY[i] + Math.sin(dist * 0.45 - time * rippleSpeed) * waveHeight;
      }
      this.gridGeo.attributes.position.needsUpdate = true;
    }



    // 5. Orbiting asteroids
    this.islandGroup.children.forEach((child) => {
      if (child.userData && child.userData.speed) {
        const ud = child.userData;
        ud.angle += ud.speed;
        child.position.x = Math.cos(ud.angle) * ud.radius;
        child.position.z = Math.sin(ud.angle) * ud.radius;
        child.rotation.x += ud.rotSpeed;
        child.rotation.y += ud.rotSpeed;
      }
    });

    // 6. Pillar gems
    this.islandGroup.children.forEach((child) => {
      if (child.position.y === 0.7) {
        child.children.forEach((pillar) => {
          pillar.children.forEach((gem) => {
            if (gem.userData && gem.userData.baseH) {
              const ud = gem.userData;
              gem.position.y = ud.baseH + Math.sin(time * 3 + ud.rotSpeed * 100) * 0.15;
              gem.rotation.y += ud.rotSpeed;
              gem.rotation.z += ud.rotSpeed * 0.5;
            }
          });
        });
      }
    });

    // 7. Crystals bobbing
    this.collectibles.forEach((item) => {
      if (!item.collected) {
        item.group.position.y = 2.1 + Math.sin(time * 3.5 + item.x) * 0.22;
        item.crystal.rotation.y += 0.022;
        item.crystal.rotation.x = Math.sin(time) * 0.15;
        item.outerRing.rotation.y -= 0.015;
        item.outerRing.rotation.x = Math.cos(time) * 0.12;
        const scaleVal = 1.0 + Math.sin(time * 6 + item.x) * 0.06;
        item.crystal.scale.set(scaleVal, scaleVal * 1.08, scaleVal);
      }
    });

    // Bob cake
    if (this.cakeGroup.visible && !this.isCut) {
      this.cakeGroup.position.y = 0.55 + Math.sin(time * 2) * 0.03;
    }

    // Bob knife
    if (this.knife && this.knife.scale.x > 0.5 && !this.isCut) {
      this.knife.position.y = 3.8 + Math.sin(time * 3.5) * 0.06;
    }

    // Flicker candle flames
    this.candles.forEach((c) => {
      if (c.lit && c.flameMesh) {
        this.particles.updateFlame(c.flameMesh, time, c.index);
      }
    });

    // Bob and wave Mami props
    if (this.mamiGroup && this.mamiGroup.scale.x > 0.01) {
      // Bob the whole group up and down
      this.mamiGroup.position.y = 4.8 + Math.sin(time * 4) * 0.15;
      
      // Spin the chef hat slightly
      if (this.chefHat) {
        this.chefHat.rotation.y = Math.sin(time * 2) * 0.15;
      }
      
      // Wave the magic wand and spawn stars/confetti occasionally!
      if (this.magicWand) {
        this.magicWand.rotation.z = Math.sin(time * 6) * 0.45;
        this.magicWand.rotation.x = -Math.PI / 4 + Math.cos(time * 6) * 0.25;
        
        // Spawn small confetti sparkles at the tip of the wand occasionally
        if (Math.random() < 0.06) {
          const wandTipWorld = new THREE.Vector3(0.3, 4.8 + Math.sin(time * 4) * 0.15, 0.3);
          this.particles.triggerConfettiBlast(wandTipWorld);
        }
      }
    }
  }
}
