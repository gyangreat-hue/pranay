import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.fireflies = null;
    this.sparkles = [];
    this.confetti = [];
    this.isConfettiActive = false;
    
    // Theme colors
    this.colors = {
      genesis: 0x00ffff,
      cyber: 0xff5500,
      cosmic: 0xaa22ff
    };
    
    this.initFireflies();
  }

  // Create floating firefly nebulae that wrap the scene
  initFireflies() {
    const count = 90;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const initialRadii = [];
    const speeds = [];
    const angles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 15; // Outer ring wrapping the island
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -1 + Math.random() * 14;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      initialRadii.push(radius);
      speeds.push(0.015 + Math.random() * 0.025);
      angles.push(Math.random() * Math.PI * 2);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Circular glow canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(0, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x00ffff
    });
    
    this.fireflies = new THREE.Points(geometry, material);
    this.scene.add(this.fireflies);
    
    this.fireflyRadii = initialRadii;
    this.fireflySpeeds = speeds;
    this.fireflyAngles = angles;
  }


  // Set particle color based on current dimension
  updateThemeColor(themeName) {
    if (this.fireflies) {
      const color = this.colors[themeName] || 0x00ffff;
      this.fireflies.material.color.setHex(color);
    }
  }


  // Update loop for all particles
  update(time, freqData = null) {
    // 1. Update fireflies & make them audio-reactive (Spherical Waves Style)
    if (this.fireflies) {
      const positions = this.fireflies.geometry.attributes.position.array;
      const count = positions.length / 3;
      
      // Calculate audio-amplitude (bass frequency average)
      let audioAmp = 0;
      if (freqData && freqData.length > 0) {
        audioAmp = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 1020; // range 0 to 1
      }
      
      for (let i = 0; i < count; i++) {
        this.fireflyAngles[i] += this.fireflySpeeds[i];
        
        // Ripple distance based on sound amplitude
        const pulse = 1.0 + audioAmp * 0.45;
        const currentRad = this.fireflyRadii[i] * pulse;
        
        positions[i * 3] = Math.cos(this.fireflyAngles[i]) * currentRad;
        positions[i * 3 + 2] = Math.sin(this.fireflyAngles[i]) * currentRad;
        positions[i * 3 + 1] += Math.sin(this.fireflyAngles[i] + time) * 0.008;
        
        if (positions[i * 3 + 1] < -2 || positions[i * 3 + 1] > 15) {
          positions[i * 3 + 1] = 2 + Math.random() * 8;
        }
      }
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update player trail sparkles
    this.updateSparkles();

    // 3. Update dynamic confetti
    this.updateConfetti();

  }

  addPlayerSparkle(position) {
    const geom = new THREE.SphereGeometry(0.12, 4, 4);
    const colors = [0x00ffff, 0xff44aa, 0xffff44, 0x00ff88];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({
      color: randColor,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    const sparkle = new THREE.Mesh(geom, mat);
    
    sparkle.position.copy(position);
    sparkle.position.y += 0.15 + (Math.random() - 0.5) * 0.4;
    sparkle.position.x += (Math.random() - 0.5) * 0.6;
    sparkle.position.z += (Math.random() - 0.5) * 0.6;
    
    this.scene.add(sparkle);
    
    this.sparkles.push({
      mesh: sparkle,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        0.03 + Math.random() * 0.04,
        (Math.random() - 0.5) * 0.03
      ),
      life: 1.0,
      decay: 0.025 + Math.random() * 0.02
    });
  }

  updateSparkles() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.mesh.position.add(sp.velocity);
      sp.life -= sp.decay;
      sp.mesh.material.opacity = sp.life;
      sp.mesh.scale.setScalar(sp.life);
      
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mesh.material.dispose();
        this.sparkles.splice(i, 1);
      }
    }
  }

  triggerConfettiBlast(centerPos) {
    this.isConfettiActive = true;
    const colors = [0xff00bb, 0x00ffff, 0xffff00, 0xff3333, 0x33ff33, 0xff9900];
    const count = 180;
    
    for (let i = 0; i < count; i++) {
      const width = 0.16 + Math.random() * 0.18;
      const height = 0.08 + Math.random() * 0.1;
      const geom = new THREE.PlaneGeometry(width, height);
      
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1
      });
      
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(centerPos);
      mesh.position.y += 0.4;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.18;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.16 + Math.random() * 0.22, // Upward force
        Math.sin(angle) * speed
      );
      
      const rotationSpeed = new THREE.Vector3(
        Math.random() * 0.25,
        Math.random() * 0.25,
        Math.random() * 0.25
      );
      
      this.scene.add(mesh);
      
      this.confetti.push({
        mesh,
        velocity,
        rotationSpeed,
        life: 1.0,
        decay: 0.0025 + Math.random() * 0.003
      });
    }
  }

  updateConfetti() {
    if (!this.isConfettiActive) return;
    
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const cf = this.confetti[i];
      
      cf.velocity.y -= 0.005; // gravity
      cf.velocity.x += Math.sin(cf.mesh.position.y + i) * 0.001; // wind drift
      
      cf.mesh.position.add(cf.velocity);
      
      cf.mesh.rotation.x += cf.rotationSpeed.x;
      cf.mesh.rotation.y += cf.rotationSpeed.y;
      cf.mesh.rotation.z += cf.rotationSpeed.z;
      
      cf.life -= cf.decay;
      cf.mesh.material.opacity = cf.life;
      
      if (cf.mesh.position.y < 0.2) {
        cf.velocity.set(0, 0, 0);
        cf.rotationSpeed.set(0, 0, 0);
      }
      
      if (cf.life <= 0) {
        this.scene.remove(cf.mesh);
        cf.mesh.geometry.dispose();
        cf.mesh.material.dispose();
        this.confetti.splice(i, 1);
      }
    }
    
    if (this.confetti.length === 0) {
      this.isConfettiActive = false;
    }
  }

  createFlameMesh() {
    const geom = new THREE.SphereGeometry(0.12, 8, 8);
    geom.scale(1, 2.2, 1);
    
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.2;
    return mesh;
  }

  updateFlame(flameMesh, time, index) {
    if (!flameMesh) return;
    const flicker = 0.9 + Math.sin(time * 16 + index) * 0.15;
    flameMesh.scale.set(flicker, flicker * 1.3, flicker);
    
    const red = 1.0;
    const green = 0.55 + Math.sin(time * 11 + index) * 0.18;
    const blue = 0.15 + Math.sin(time * 22 + index) * 0.06;
    flameMesh.material.color.setRGB(red, green, blue);
  }
}
