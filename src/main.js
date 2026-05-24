import * as THREE from 'three';
import { SceneSetup } from './scene.js';
import { WorldManager } from './world.js';
import { ParticleSystem } from './particles.js';
import { audioManager } from './audio.js';

class ScrollytellingApp {
  constructor() {
    this.activeDimension = 'genesis';
    // Video clip start offsets (seconds) and durations
    this.videoStarts = { video1: 0, video2: 0, video3: 0 };
    this.videoDurations = { video1: 10, video2: 10, video3: 7 };
    
    // Core Engine Setup
    this.engine = new SceneSetup('canvas-container');
    this.particles = new ParticleSystem(this.engine.scene);
    this.world = new WorldManager(this.engine.scene, this.particles);
    
    this.lastTime = 0;
    this.scrollFraction = 0;
    
    // Collectibles collection status
    this.collected = { gift: false, candle: false, knife: false };
    

    
    // Camera Spline Path Keyframes (Scroll 0.0 to 1.0)
    // Maps scroll fraction directly to camera positions and look targets
    this.keyframes = [
      {
        scroll: 0.0,
        pos: new THREE.Vector3(0, 11.5, 17.5),
        look: new THREE.Vector3(0, 1.8, 0),
        theme: 'genesis'
      },
      {
        scroll: 0.2,
        pos: new THREE.Vector3(-3.8, 4.2, 9.0),
        look: new THREE.Vector3(-3.8, 1.4, 4.8),
        theme: 'genesis'
      },
      {
        scroll: 0.4,
        pos: new THREE.Vector3(3.8, 4.2, 1.3),
        look: new THREE.Vector3(3.8, 1.4, -3.2),
        theme: 'genesis'
      },
      {
        scroll: 0.6,
        pos: new THREE.Vector3(-3.5, 4.2, 0.0),
        look: new THREE.Vector3(-3.5, 1.4, -4.5),
        theme: 'genesis'
      },
      {
        scroll: 0.8,
        pos: new THREE.Vector3(2.5, 5.0, 5.5),
        look: new THREE.Vector3(0, 2.0, 0),
        theme: 'genesis'
      },
      {
        scroll: 1.0,
        pos: new THREE.Vector3(0, 6.2, 9.2),
        look: new THREE.Vector3(0, 2.8, 0),
        theme: 'genesis'
      }
    ];
    
    // Visualizer Canvas context

    
    this.setupScrollWrapper();
    this.setupEventListeners();
    this.setupPhotoCarousel();
    this.startLoop();
  }

  setupScrollWrapper() {
    this.scrollWrapper = document.getElementById('scroll-wrapper');
    this.sections = document.querySelectorAll('.scroll-section');
    
    this.scrollWrapper.addEventListener('scroll', () => {
      const scrollH = this.scrollWrapper.scrollHeight - this.scrollWrapper.clientHeight;
      this.scrollFraction = Math.min(Math.max(this.scrollWrapper.scrollTop / scrollH, 0), 1);
      
      this.handleScrollTriggers();
    });
  }

  setupEventListeners() {
    // Top-bar volume toggle
    const muteBtn = document.getElementById('mute-btn');
    const muteIcon = document.getElementById('mute-icon');
    
    muteBtn.addEventListener('click', () => {
      const isMuted = audioManager.toggleMute();
      muteIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      if (!isMuted) {
        audioManager.init();
        audioManager.setTheme(this.activeDimension);
      }
    });
    
    // Audio initial trigger button
    const initBtn = document.getElementById('unmute-init-btn');
    initBtn.addEventListener('click', () => {
      audioManager.init();
      audioManager.setTheme(this.activeDimension);
      initBtn.style.display = 'none'; // hide trigger
      muteIcon.className = 'fa-solid fa-volume-high';
    });

    // Cut cake, video reveal, replay & restart buttons
    document.getElementById('blow-btn').addEventListener('click', () => this.blowCandles());
    document.getElementById('restart-btn').addEventListener('click', () => this.showAtrangiVideo());
    document.getElementById('real-restart-btn').addEventListener('click', () => this.showAtrangiVideo());
    document.getElementById('go-to-start-btn').addEventListener('click', () => this.restartGreeting());
    
    // Gift open button listener
    const giftBtn = document.getElementById('open-gift-btn');
    const giftText = document.getElementById('gift-opened-text');
    if (giftBtn) {
      giftBtn.addEventListener('click', () => {
        giftBtn.disabled = true;
        audioManager.playChime();
        this.world.openGift(() => {
          giftBtn.style.display = 'none';
          if (giftText) {
            giftText.style.display = 'block';
            this.particles.triggerConfettiBlast(new THREE.Vector3(-3.8, 3.2, 4.8));
          }
          audioManager.speak("Main hoon tumhara gift!");
        });
      });
    }
    
    // Mouse coordinates tracker & cursor point light placement
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    
    window.addEventListener('pointermove', (e) => {
      // Update light tracking coordinate on pointer move
      mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouseVec, this.engine.camera);
      const lightPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.8);
      const intersect = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(lightPlane, intersect)) {
        this.engine.cursorLight.position.x = THREE.MathUtils.lerp(this.engine.cursorLight.position.x, intersect.x, 0.08);
        this.engine.cursorLight.position.z = THREE.MathUtils.lerp(this.engine.cursorLight.position.z, intersect.z, 0.08);
      }
    });
  }

  setupPhotoCarousel() {
    this.currentPhotoIndex = 0;
    this.galleryCompleted = false;
    this.photoInterval = null;
    
    this.photoFrames = document.querySelectorAll('#sec-gallery .polaroid-frame');
    this.prevBtn = document.getElementById('prev-photo-btn');
    this.nextBtn = document.getElementById('next-photo-btn');
    this.counterBadge = document.getElementById('photo-counter');
    
    if (!this.nextBtn || !this.prevBtn || this.photoFrames.length === 0) return;
    
    this.updateCarousel = () => {
      this.photoFrames.forEach((frame, idx) => {
        if (idx === this.currentPhotoIndex) {
          frame.classList.add('active');
          frame.style.display = 'block';
        } else {
          frame.classList.remove('active');
          frame.style.display = 'none';
        }
      });
      
      // Update counter
      if (this.counterBadge) {
        this.counterBadge.textContent = `${this.currentPhotoIndex + 1} / ${this.photoFrames.length}`;
      }
      
      // Update buttons
      this.prevBtn.disabled = this.currentPhotoIndex === 0;
      
      if (this.currentPhotoIndex === this.photoFrames.length - 1) {
        this.nextBtn.innerHTML = 'CHALO CAKE KAAT TE HAIN 🎂';
        this.nextBtn.classList.add('pulse-anim');
      } else {
        this.nextBtn.innerHTML = 'NEXT PHOTO 👉';
        this.nextBtn.classList.remove('pulse-anim');
      }
    };
    
    this.prevBtn.addEventListener('click', () => {
      if (this.currentPhotoIndex > 0) {
        this.currentPhotoIndex--;
        this.updateCarousel();
        audioManager.playChime();
        this.startPhotoAutoPlay(); // Reset timer on manual click
      }
    });
    
    this.nextBtn.addEventListener('click', () => {
      if (this.currentPhotoIndex < this.photoFrames.length - 1) {
        this.currentPhotoIndex++;
        this.updateCarousel();
        audioManager.playChime();
        this.startPhotoAutoPlay(); // Reset timer on manual click
      } else {
        this.advanceToAltar();
      }
    });
    
    // Initialize state
    this.updateCarousel();
  }

  startPhotoAutoPlay() {
    this.stopPhotoAutoPlay();
    if (this.galleryCompleted) return;
    
    this.photoInterval = setInterval(() => {
      if (this.currentPhotoIndex < this.photoFrames.length - 1) {
        this.currentPhotoIndex++;
        this.updateCarousel();
        audioManager.playChime();
      } else {
        this.advanceToAltar();
      }
    }, 3000);
  }

  stopPhotoAutoPlay() {
    if (this.photoInterval) {
      clearInterval(this.photoInterval);
      this.photoInterval = null;
    }
  }

  advanceToAltar() {
    this.galleryCompleted = true;
    this.scrollWrapper.style.overflowY = 'auto';
    this.stopPhotoAutoPlay();
    
    // Smoothly scroll to the altar section (Section 6, index 5)
    const targetScroll = 5 * this.scrollWrapper.clientHeight;
    this.scrollWrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
    audioManager.playCelebration();
  }



  // Handle scrollytelling triggers and checkpoints
  handleScrollTriggers() {
    // 1. Activate CSS transition scroll sections (6 total snap sections)
    const activeIndex = Math.min(Math.floor(this.scrollFraction * 6), 5);
    this.sections.forEach((sec, idx) => {
      if (idx === activeIndex) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // 2. Lock scroll wrapper when in photo gallery (index 4) if carousel isn't fully viewed
    if (activeIndex === 4 && !this.galleryCompleted) {
      this.scrollWrapper.style.overflowY = 'hidden';
      const targetScroll = 4 * this.scrollWrapper.clientHeight;
      if (Math.abs(this.scrollWrapper.scrollTop - targetScroll) > 5) {
        this.scrollWrapper.scrollTop = targetScroll;
      }
      this.startPhotoAutoPlay();
    } else {
      this.stopPhotoAutoPlay();
    }

    // 3. Altar Pedestal & Rising Cake activation (final scroll section)
    if (this.scrollFraction >= 0.82) {
      if (!this.world.isAssembled) {
        this.world.animateAssembly();
        this.startBakingProgress();
      }
    }
  }

  startBakingProgress() {
    const progressBar = document.getElementById('cake-progress-bar');
    const progressPercent = document.getElementById('cake-progress-percent');
    const bakingStep = document.getElementById('cake-baking-step');
    const greetStep = document.getElementById('cake-greet-step');
    
    if (!progressBar || !progressPercent || !bakingStep || !greetStep) return;
    
    // Reset steps visibility
    bakingStep.style.display = 'block';
    greetStep.style.display = 'none';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    
    const startTime = performance.now();
    const duration = 3500; // 3.5 seconds
    
    const updateProgress = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const percent = Math.floor(progress * 100);
      progressBar.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        // Complete! Transition card to Step 2
        bakingStep.style.display = 'none';
        greetStep.style.display = 'block';
        
        // Dynamic confetti blast
        this.particles.triggerConfettiBlast(new THREE.Vector3(0, 1.2, 0));
        audioManager.playCelebration();
        audioManager.speak("Vasu khush raho! Mami ka special cake taiyaar hai. Chalo cake kaat te hain!");
      }
    };
    requestAnimationFrame(updateProgress);
  }



  warpDimension(theme) {
    this.activeDimension = theme;
    
    // Sound engine theme swap
    audioManager.setTheme(theme);
    
    // Streaks particle visual effect
    this.particles.triggerWarp();
    
    // Easing Camera FOV elastic jump (SpaceKart hyper warp)
    const dur = 1100;
    const startTime = performance.now();
    const isMobile = window.innerWidth < 768;
    const startFov = isMobile ? 68 : 58;
    const peakFov = 108;
    
    const animateFov = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      
      if (progress < 0.5) {
        this.engine.camera.fov = THREE.MathUtils.lerp(startFov, peakFov, progress / 0.5);
      } else {
        this.engine.camera.fov = THREE.MathUtils.lerp(peakFov, startFov, (progress - 0.5) / 0.5);
      }
      this.engine.camera.updateProjectionMatrix();
      
      if (progress < 1) requestAnimationFrame(animateFov);
    };
    requestAnimationFrame(animateFov);
    
    // Light and materials swap
    this.engine.transitionThemeLights(theme);
    this.world.swapTheme(theme);
    this.particles.updateThemeColor(theme);
  }

  // Spline interpolation for scroll-driven camera motion
  interpolateCamera(scroll) {
    // Find bounding keyframes
    let startIndex = 0;
    let endIndex = 1;
    
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (scroll >= this.keyframes[i].scroll && scroll <= this.keyframes[i + 1].scroll) {
        startIndex = i;
        endIndex = i + 1;
        break;
      }
    }
    
    const kStart = this.keyframes[startIndex];
    const kEnd = this.keyframes[endIndex];
    
    // Interpolation factor t
    const range = kEnd.scroll - kStart.scroll;
    const t = range > 0 ? (scroll - kStart.scroll) / range : 0;
    
    // Interpolate camera coordinates
    this.engine.camera.position.lerpVectors(kStart.pos, kEnd.pos, t);
    
    // Interpolate camera look coordinates
    const targetLook = new THREE.Vector3().lerpVectors(kStart.look, kEnd.look, t);
    this.engine.camera.lookAt(targetLook);
    
    // Dynamic theme warp checker (prevents infinite warp trigger loops)
    const targetTheme = scroll > 0.85 ? kEnd.theme : kStart.theme;
    if (targetTheme !== this.activeDimension) {
      this.warpDimension(targetTheme);
    }
  }

  blowCandles() {
    audioManager.playBlow();
    this.engine.dimAmbientForWish();
    
    // Hide cut button overlay immediately
    document.getElementById('final-card').style.display = 'none';
    
    // Trigger slice down knife animation in world
    this.world.animateCut(() => {
      // Once cut completes, reveal final typewriter card
      const wishCard = document.getElementById('final-wish-card');
      wishCard.style.display = 'block';
      
      this.startTypewriterEffect();
    });
  }

  startTypewriterEffect() {
    const text = "Happy Birthday Pyaare Vasu! ✨🥳\n\nAap humesha haste raho, bahut saari masti karo, dher saare khilone milen aur bahut saari chocolates khao! 🎂🍭🧸\n\nTaali bajao! 👏🎉";
    
    // Speak the plain text version aloud
    const spokenText = "Happy Birthday Pyaare Vasu! Aap humesha haste raho, bahut saari masti karo, dher saare khilone milen aur bahut saari chocolates khao! Taali bajao!";
    audioManager.speak(spokenText);

    const el = document.getElementById('typewriter-text');
    el.innerHTML = "";
    
    let idx = 0;
    const type = () => {
      if (idx < text.length) {
        const char = text.charAt(idx);
        el.innerHTML += char === '\n' ? "<br>" : char;
        idx++;
        setTimeout(type, 45);
      }
    };
    type();
  }

  showAtrangiVideo() {
    audioManager.stopBGM();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Hide buttons
    document.getElementById('real-restart-btn').style.display = 'none';
    document.getElementById('go-to-start-btn').style.display = 'none';
    
    // Reset cards visibility
    document.getElementById('final-wish-card').style.display = 'none';
    const videoCard = document.getElementById('final-video-card');
    if (videoCard) {
      videoCard.style.display = 'block';
    }
    
    // Reset titles
    document.getElementById('video-card-title').textContent = "Vasu Ke Atrangi Kaam! 🤪";
    
    const delayMsg = document.getElementById('video-delay-msg');
    const playerContainer = document.getElementById('video-player-container');
    if (delayMsg) delayMsg.style.display = 'none';
    if (playerContainer) playerContainer.style.display = 'block';

    const video = document.getElementById('atrangi-video');
    if (video) {
      video.muted = audioManager.muted;
      this.videoState = 'video1';
      
      // Clean up previous blob URL
      if (this.currentVideoBlobUrl) {
        URL.revokeObjectURL(this.currentVideoBlobUrl);
        this.currentVideoBlobUrl = null;
      }
      
      document.getElementById('video-card-desc').textContent = "Loading video... 🍿";
      
      // Fetch Video 1 as Blob to bypass range request issues
      fetch("./public/atrangi_video.mp4")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          const mp4Blob = new Blob([blob], { type: 'video/mp4' });
          this.currentVideoBlobUrl = URL.createObjectURL(mp4Blob);
          
          document.getElementById('video-card-desc').textContent = "Dhamal masti aur atrangi shararatein! 🎥🎬";
          video.src = this.currentVideoBlobUrl;
          video.load();
          // Seek to configured start offset for video1
          try { video.currentTime = this.videoStarts.video1; } catch (e) {}

          video.play().catch(err => {
            console.warn("Video 1 unmuted autoplay blocked, trying muted:", err);
            video.muted = true;
            video.play().catch(err2 => console.error("Video 1 muted play failed:", err2));
          });
        })
        .catch(err => {
          console.error("Failed to load Video 1 as blob:", err);
          document.getElementById('video-card-desc').innerHTML = `<span style="color: #ff1744; font-weight: bold;">Video Load Error (${err.message})</span>`;
        });
      
      if (!video._hasErrorListener) {
        video.addEventListener('error', () => {
          const err = video.error;
          const msg = err ? `Code: ${err.code} - ${err.message}` : "Unknown error";
          console.error("Video error:", msg);
          document.getElementById('video-card-desc').innerHTML = `<span style="color: #ff1744; font-weight: bold;">Video Load Error (${msg})</span>`;
        });
        video._hasErrorListener = true;
      }
      
      // Control sequential video playback
      if (!video._hasTimeListener) {
        video.addEventListener('timeupdate', () => {
          if (this.videoState === 'video1' && video.currentTime >= (this.videoStarts.video1 + this.videoDurations.video1)) {
            // Video 1 finished -> Transition to delay 1 screen
            this.videoState = 'delay1';
            video.pause();
            
            if (playerContainer) playerContainer.style.display = 'none';
            if (delayMsg) delayMsg.style.display = 'flex';
            
            setTimeout(() => {
              // Delay 1 over -> Load and play Video 2
              this.videoState = 'video2';
              if (delayMsg) delayMsg.style.display = 'none';
              if (playerContainer) playerContainer.style.display = 'block';
              
              document.getElementById('video-card-title').textContent = "Vasu Ke Atrangi Kaam #2! 🤪";
              document.getElementById('video-card-desc').textContent = "Loading video... 🍿";
              
              if (this.currentVideoBlobUrl) {
                URL.revokeObjectURL(this.currentVideoBlobUrl);
                this.currentVideoBlobUrl = null;
              }
              
              fetch("./public/atrangi_video2.mp4")
                .then(res => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return res.blob();
                })
                .then(blob => {
                  const mp4Blob = new Blob([blob], { type: 'video/mp4' });
                  this.currentVideoBlobUrl = URL.createObjectURL(mp4Blob);
                  
                  document.getElementById('video-card-desc').textContent = "Dusri dhamakedar shararat! 🎬🍿";
                  video.muted = audioManager.muted;
                  video.src = this.currentVideoBlobUrl;
                  video.load();
                  // Seek to configured start offset for video2
                  try { video.currentTime = this.videoStarts.video2; } catch (e) {}

                  video.play().catch(err => {
                    console.warn("Video 2 unmuted autoplay blocked, trying muted:", err);
                    video.muted = true;
                    video.play().catch(err2 => console.error("Video 2 muted play failed:", err2));
                  });
                })
                .catch(err => {
                  console.error("Failed to load Video 2 as blob:", err);
                  document.getElementById('video-card-desc').innerHTML = `<span style="color: #ff1744; font-weight: bold;">Video Load Error (${err.message})</span>`;
                });
            }, 2000);
          } else if (this.videoState === 'video2' && video.currentTime >= (this.videoStarts.video2 + this.videoDurations.video2)) {
            // Video 2 finished -> Transition to delay 2 screen
            this.videoState = 'delay2';
            video.pause();
            
            if (playerContainer) playerContainer.style.display = 'none';
            if (delayMsg) delayMsg.style.display = 'flex';
            
            setTimeout(() => {
              // Delay 2 over -> Load and play Video 3
              this.videoState = 'video3';
              if (delayMsg) delayMsg.style.display = 'none';
              if (playerContainer) playerContainer.style.display = 'block';
              
              document.getElementById('video-card-title').textContent = "Vasu Ke Atrangi Kaam #3! 🤪";
              document.getElementById('video-card-desc').textContent = "Loading video... 🍿";
              
              if (this.currentVideoBlobUrl) {
                URL.revokeObjectURL(this.currentVideoBlobUrl);
                this.currentVideoBlobUrl = null;
              }
              
              fetch("./public/atrangi_video3.mp4")
                .then(res => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return res.blob();
                })
                .then(blob => {
                  const mp4Blob = new Blob([blob], { type: 'video/mp4' });
                  this.currentVideoBlobUrl = URL.createObjectURL(mp4Blob);
                  
                  document.getElementById('video-card-desc').textContent = "Teesri aur sabse atrangi shararat! 🎬🧸";
                  video.muted = audioManager.muted;
                  video.src = this.currentVideoBlobUrl;
                  video.load();
                  // Seek to configured start offset for video3
                  try { video.currentTime = this.videoStarts.video3; } catch (e) {}

                  video.play().catch(err => {
                    console.warn("Video 3 unmuted autoplay blocked, trying muted:", err);
                    video.muted = true;
                    video.play().catch(err2 => console.error("Video 3 muted play failed:", err2));
                  });
                })
                .catch(err => {
                  console.error("Failed to load Video 3 as blob:", err);
                  document.getElementById('video-card-desc').innerHTML = `<span style="color: #ff1744; font-weight: bold;">Video Load Error (${err.message})</span>`;
                });
            }, 2000);
          } else if (this.videoState === 'video3' && video.currentTime >= (this.videoStarts.video3 + this.videoDurations.video3)) {
            // Video 3 finished (capped at 8 seconds) -> End of show, reveal restart options
            this.videoState = 'ended';
            video.pause();
            
            document.getElementById('video-card-title').textContent = "Vasu ki saari shararatein! 🎉";
            document.getElementById('video-card-desc').textContent = "Aapko kaunsi sabse atrangi lagi? 🤪";
            
            document.getElementById('real-restart-btn').style.display = 'inline-block';
            document.getElementById('go-to-start-btn').style.display = 'inline-block';
          }
        });
        video._hasTimeListener = true;
      }
    }
  }

  restartGreeting() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    const video = document.getElementById('atrangi-video');
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.src = ""; // Clear src
    }
    
    if (this.currentVideoBlobUrl) {
      URL.revokeObjectURL(this.currentVideoBlobUrl);
      this.currentVideoBlobUrl = null;
    }
    this.videoState = 'ended';
    
    audioManager.startBGM();
    
    // Ensure scroll wrapper allows scrolling, then scroll to top after layout settles
    try { this.scrollWrapper.style.overflowY = 'auto'; } catch (e) {}
    setTimeout(() => {
      try { this.scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { try { this.scrollWrapper.scrollTop = 0; } catch (e) {} }
    }, 60);
    document.getElementById('final-wish-card').style.display = 'none';
    document.getElementById('final-video-card').style.display = 'none';
    document.getElementById('final-card').style.display = 'block';
    
    // Reset world cake status
    this.world.isCut = false;
    this.world.isAssembled = false;
    this.world.cakeGroup.visible = false;
    this.world.knife.scale.set(0.001, 0.001, 0.001);
    this.world.knife.position.set(1.5, 3.8, 1.5);
    this.world.knife.rotation.set(-Math.PI / 4, 0, Math.PI / 6);
    
    // Clear and rebuild cake groups
    this.world.cakeGroup.clear();
    this.world.cakeMainGroup.clear();
    this.world.cakeSliceGroup.clear();
    this.world.decorationsGroup.clear();
    this.world.cakeGroup.add(this.world.cakeMainGroup);
    this.world.cakeGroup.add(this.world.cakeSliceGroup);
    this.world.cakeGroup.add(this.world.decorationsGroup);
    this.world.candles = [];
    this.world.buildCake();
    
    // Reset open gift status
    this.world.isGiftOpened = false;
    if (this.world.giftLidGroup) {
      this.world.giftLidGroup.position.set(0, 0, 0);
      this.world.giftLidGroup.rotation.set(0, 0, 0);
      this.world.giftLidGroup.scale.setScalar(1);
    }
    if (this.world.giftSurpriseGroup) {
      this.world.giftSurpriseGroup.scale.set(0.001, 0.001, 0.001);
      this.world.giftSurpriseGroup.position.y = 0.1;
      this.world.giftSurpriseGroup.rotation.set(0, 0, 0);
    }
    if (this.world.giftSurpriseLight) {
      this.world.giftSurpriseLight.intensity = 0;
    }
    const giftItem = this.world.collectibles.find(c => c.type === 'gift');
    if (giftItem) {
      giftItem.collected = false;
      if (giftItem.light) {
        giftItem.light.color.setHex(0xff3366);
        giftItem.light.intensity = 4.5;
      }
    }
    const giftBtn = document.getElementById('open-gift-btn');
    const giftText = document.getElementById('gift-opened-text');
    if (giftBtn) {
      giftBtn.style.display = 'inline-block';
      giftBtn.disabled = false;
    }
    if (giftText) {
      giftText.style.display = 'none';
    }
    
    // Reset photo carousel state
    this.galleryCompleted = false;
    this.currentPhotoIndex = 0;
    this.scrollWrapper.style.overflowY = 'auto';
    this.stopPhotoAutoPlay();
    if (this.updateCarousel) {
      this.updateCarousel();
    }
    
    // Reset cake baking step HTML states
    const bakingStep = document.getElementById('cake-baking-step');
    const greetStep = document.getElementById('cake-greet-step');
    if (bakingStep) bakingStep.style.display = 'block';
    if (greetStep) greetStep.style.display = 'none';
    
    if (this.world.mamiGroup) {
      this.world.mamiGroup.scale.set(0.001, 0.001, 0.001);
    }
    
    this.engine.ambientLight.intensity = 1.3;
    this.engine.moonLight.intensity = 1.6;
  }


  startLoop() {
    const loop = (time) => {
      requestAnimationFrame(loop);
      
      if (!this.lastTime) this.lastTime = time;
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;
      
      // 1. Live audio analyser frequency retrieval
      const freqData = audioManager.getFrequencies();
      
      // 2. Camera scroll path mapping
      this.interpolateCamera(this.scrollFraction);
      
      // 3. Subsystem updates (pass freqData to deform terrain waves)
      this.world.update(time * 0.001, freqData);
      this.particles.update(time * 0.001, freqData);
      
      this.engine.render();
    };
    requestAnimationFrame(loop);
  }
}

// Start application
new ScrollytellingApp();
