import * as THREE from 'three';

export class SceneSetup {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Theme lights config
    this.themeColors = {
      genesis: { sky: 0x07090f, ambient: 0x0c111e, moon: 0x8fc8ff },
      cyber: { sky: 0x0c0602, ambient: 0x221008, moon: 0xff5500 },
      cosmic: { sky: 0x080410, ambient: 0x190828, moon: 0xaa22ff }
    };
    
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.themeColors.genesis.sky);
    this.scene.fog = new THREE.FogExp2(this.themeColors.genesis.sky, 0.015);
    
    // Camera Setup (adjusts FOV based on desktop/mobile for responsiveness)
    const isMobile = window.innerWidth < 768;
    const fov = isMobile ? 68 : 58;
    const aspect = this.container.clientWidth / this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    // Camera position: offset depending on mobile
    if (isMobile) {
      this.camera.position.set(0, 14, 21);
    } else {
      this.camera.position.set(0, 11.5, 17.5);
    }
    this.camera.lookAt(0, 1.8, 0);
    
    // WebGLRenderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false }); // disable antialias on mobile for performance
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isMobile; // disable shadows on mobile for 60fps stability
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    
    this.container.appendChild(this.renderer.domElement);
    
    this.setupLights();
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setupLights() {
    // 1. Soft ambient theme light
    this.ambientLight = new THREE.AmbientLight(this.themeColors.genesis.ambient, 1.3);
    this.scene.add(this.ambientLight);
    
    // 2. Silvery directional moon light
    this.moonLight = new THREE.DirectionalLight(this.themeColors.genesis.moon, 1.6);
    this.moonLight.position.set(-15, 22, -10);
    this.moonLight.castShadow = true;
    
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 0.5;
    this.moonLight.shadow.camera.far = 45;
    const d = 20;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0006;
    
    this.scene.add(this.moonLight);
    
    // 3. Central Altar Spotlight
    this.spotLight = new THREE.SpotLight(0xffaaff, 12, 28, Math.PI / 4, 0.45, 1);
    this.spotLight.position.set(0, 14, 0);
    this.spotLight.target.position.set(0, 0, 0);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.bias = -0.001;
    this.scene.add(this.spotLight);
    
    // 4. Cursor Point Light (SpaceKart dynamic depth shadows)
    // Floats over the scene and casts soft moving shadows based on mouse hover coordinates
    const isMobile = window.innerWidth < 768;
    this.cursorLight = new THREE.PointLight(0x00ffff, isMobile ? 0 : 2.5, 9, 1.5);
    this.cursorLight.position.set(0, 3, 0);
    this.cursorLight.castShadow = !isMobile;
    this.cursorLight.shadow.bias = -0.0005;
    this.scene.add(this.cursorLight);
  }

  // Smoothly transition environment lighting on dimension jumps
  transitionThemeLights(themeName) {
    const nextColors = this.themeColors[themeName];
    if (!nextColors) return;
    
    const duration = 1000; // 1 second warp transition
    const startTime = performance.now();
    
    const startSky = this.scene.background.clone();
    const startAmb = this.ambientLight.color.clone();
    const startMoon = this.moonLight.color.clone();
    
    const targetSky = new THREE.Color(nextColors.sky);
    const targetAmb = new THREE.Color(nextColors.ambient);
    const targetMoon = new THREE.Color(nextColors.moon);
    
    const animateTransition = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolate colors
      this.scene.background.copy(startSky).lerp(targetSky, progress);
      this.scene.fog.color.copy(this.scene.background);
      
      this.ambientLight.color.copy(startAmb).lerp(targetAmb, progress);
      this.moonLight.color.copy(startMoon).lerp(targetMoon, progress);
      
      // Spotlights colors swap
      const spotColors = { genesis: 0xffaaff, cyber: 0xff5500, cosmic: 0xaa22ff };
      this.spotLight.color.setHex(spotColors[themeName]);
      this.cursorLight.color.setHex(themeName === 'cyber' ? 0xff5500 : 0x00ffff);
      
      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      }
    };
    requestAnimationFrame(animateTransition);
  }

  dimAmbientForWish() {
    const duration = 2200;
    const startAmb = this.ambientLight.intensity;
    const startMoon = this.moonLight.intensity;
    const startTime = performance.now();

    const animateDim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.ambientLight.intensity = startAmb * (1 - progress * 0.88);
      this.moonLight.intensity = startMoon * (1 - progress * 0.96);
      this.cursorLight.intensity = 0; // turn off cursor light
      
      if (progress < 1) {
        requestAnimationFrame(animateDim);
      }
    };
    requestAnimationFrame(animateDim);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const isMobile = window.innerWidth < 768;
    
    this.camera.fov = isMobile ? 68 : 58;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
