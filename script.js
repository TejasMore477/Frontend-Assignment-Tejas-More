import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls, skybox;
let planet_sun,
  planet_mercury,
  planet_venus,
  planet_earth,
  planet_mars,
  planet_jupiter,
  planet_saturn,
  planet_uranus,
  planet_neptune;
let planet_sun_label;

let mercury_orbit_radius = 50;
let venus_orbit_radius = 60;
let earth_orbit_radius = 70;
let mars_orbit_radius = 80;
let jupiter_orbit_radius = 100;
let saturn_orbit_radius = 120;
let uranus_orbit_radius = 140;
let neptune_orbit_radius = 160;

let mercury_revolution_speed = 2;
let venus_revolution_speed = 1.5;
let earth_revolution_speed = 1;
let mars_revolution_speed = 0.8;
let jupiter_revolution_speed = 0.7;
let saturn_revolution_speed = 0.6;
let uranus_revolution_speed = 0.5;
let neptune_revolution_speed = 0.4;

let shootingStars = [];
let shootingStarTrails = [];
let isAutoGenerating = false;

function createMaterialArray() {
  const skyboxImagepaths = [
    "../img/skybox/space_ft.png",
    "../img/skybox/space_bk.png",
    "../img/skybox/space_up.png",
    "../img/skybox/space_dn.png",
    "../img/skybox/space_rt.png",
    "../img/skybox/space_lf.png",
  ];
  const materialArray = skyboxImagepaths.map((image) => {
    let texture = new THREE.TextureLoader().load(image);
    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  });
  return materialArray;
}

function setSkyBox() {
  const materialArray = createMaterialArray();
  let skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
  skybox = new THREE.Mesh(skyboxGeo, materialArray);
  scene.add(skybox);
}

function loadPlanetTexture(
  texture,
  radius,
  widthSegments,
  heightSegments,
  meshType
) {
  const geometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments
  );
  const loader = new THREE.TextureLoader();
  const planetTexture = loader.load(texture);
  const material =
    meshType == "standard"
      ? new THREE.MeshStandardMaterial({ map: planetTexture })
      : new THREE.MeshBasicMaterial({ map: planetTexture });

  const planet = new THREE.Mesh(geometry, material);

  return planet;
}

function createRing(innerRadius) {
  let outerRadius = innerRadius - 0.1;
  let thetaSegments = 100;
  const geometry = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    thetaSegments
  );
  const material = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createShootingStar() {
  // Create shooting star geometry
  const starGeometry = new THREE.SphereGeometry(1.5, 8, 8);
  const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
  });
  const shootingStar = new THREE.Mesh(starGeometry, starMaterial);

  // Create trail geometry
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  const shootingStarTrail = new THREE.Line(trailGeometry, trailMaterial);

  // Random starting position
  const startX = (Math.random() - 0.5) * 200;
  const startY = (Math.random() - 0.5) * 200;
  const startZ = (Math.random() - 0.5) * 200;
  shootingStar.position.set(startX, startY, startZ);

  // Add to scene
  scene.add(shootingStar);
  scene.add(shootingStarTrail);

  // Animation variables
  let trailPoints = [];
  const maxTrailLength = 30;
  const speed = 2;
  const direction = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  ).normalize();

  // Store the star and its properties
  const starObject = {
    mesh: shootingStar,
    trail: shootingStarTrail,
    trailPoints: trailPoints,
    direction: direction,
    speed: speed,
    maxTrailLength: maxTrailLength,
  };

  shootingStars.push(starObject);
  shootingStarTrails.push(shootingStarTrail);

  return starObject;
}

function updateShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];

    // Update position
    star.mesh.position.add(star.direction.clone().multiplyScalar(star.speed));

    // Update trail
    star.trailPoints.push(star.mesh.position.clone());
    if (star.trailPoints.length > star.maxTrailLength) {
      star.trailPoints.shift();
    }

    // Update trail geometry
    const positions = new Float32Array(star.trailPoints.length * 3);
    star.trailPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    star.trail.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    // Check if shooting star is out of bounds
    if (
      Math.abs(star.mesh.position.x) > 500 ||
      Math.abs(star.mesh.position.y) > 500 ||
      Math.abs(star.mesh.position.z) > 500
    ) {
      scene.remove(star.mesh);
      scene.remove(star.trail);
      shootingStars.splice(i, 1);
      shootingStarTrails.splice(i, 1);
    }
  }
}

function startAutoGenerating() {
  if (!isAutoGenerating) {
    isAutoGenerating = true;
    generateRandomShootingStar();
  }
}

function stopAutoGenerating() {
  isAutoGenerating = false;
  // Remove all existing shooting stars
  shootingStars.forEach((star) => {
    scene.remove(star.mesh);
    scene.remove(star.trail);
  });
  shootingStars = [];
  shootingStarTrails = [];
}

function generateRandomShootingStar() {
  if (!isAutoGenerating) return;

  createShootingStar();

  // Generate next shooting star after random delay (2-5 seconds)
  const delay = 2000 + Math.random() * 3000;
  setTimeout(generateRandomShootingStar, delay);
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    85,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Add controller button event listener
  const controllerBtn = document.getElementById("Controller");
  const speedControls = document.getElementById("speed-controls");

  controllerBtn.addEventListener("click", () => {
    if (
      speedControls.style.display === "none" ||
      !speedControls.style.display
    ) {
      speedControls.style.display = "block";
    } else {
      speedControls.style.display = "none";
    }
  });

  setSkyBox();
  planet_earth = loadPlanetTexture(
    "../img/earth_hd.jpg",
    4,
    100,
    100,
    "standard"
  );
  planet_sun = loadPlanetTexture("../img/sun_hd.jpg", 20, 100, 100, "basic");
  planet_mercury = loadPlanetTexture(
    "../img/mercury_hd.jpg",
    2,
    100,
    100,
    "standard"
  );
  planet_venus = loadPlanetTexture(
    "../img/venus_hd.jpg",
    3,
    100,
    100,
    "standard"
  );
  planet_mars = loadPlanetTexture(
    "../img/mars_hd.jpg",
    3.5,
    100,
    100,
    "standard"
  );
  planet_jupiter = loadPlanetTexture(
    "../img/jupiter_hd.jpg",
    10,
    100,
    100,
    "standard"
  );
  planet_saturn = loadPlanetTexture(
    "../img/saturn_hd.jpg",
    8,
    100,
    100,
    "standard"
  );
  planet_uranus = loadPlanetTexture(
    "../img/uranus_hd.jpg",
    6,
    100,
    100,
    "standard"
  );
  planet_neptune = loadPlanetTexture(
    "../img/neptune_hd.jpg",
    5,
    100,
    100,
    "standard"
  );

  // ADD PLANETS TO THE SCENE
  scene.add(planet_earth);
  scene.add(planet_sun);
  scene.add(planet_mercury);
  scene.add(planet_venus);
  scene.add(planet_mars);
  scene.add(planet_jupiter);
  scene.add(planet_saturn);
  scene.add(planet_uranus);
  scene.add(planet_neptune);

  const sunLight = new THREE.PointLight(0xffffff, 1, 0); // White light, intensity 1, no distance attenuation
  sunLight.position.copy(planet_sun.position); // Position the light at the Sun's position
  scene.add(sunLight);

  // Rotation orbit
  createRing(mercury_orbit_radius);
  createRing(venus_orbit_radius);
  createRing(earth_orbit_radius);
  createRing(mars_orbit_radius);
  createRing(jupiter_orbit_radius);
  createRing(saturn_orbit_radius);
  createRing(uranus_orbit_radius);
  createRing(neptune_orbit_radius);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = "c";
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 12;
  controls.maxDistance = 1000;

  camera.position.z = 100;

  // Add speed control event listeners
  setupSpeedControls();

  // Add shooting star button event listener
  const shootingStarBtn = document.getElementById("shooting-star-btn");
  shootingStarBtn.addEventListener("click", () => {
    if (isAutoGenerating) {
      stopAutoGenerating();
      shootingStarBtn.textContent = "Start Shooting Stars";
    } else {
      startAutoGenerating();
      shootingStarBtn.textContent = "Stop Shooting Stars";
    }
  });
}

function setupSpeedControls() {
  const speedInputs = {
    "mercury-speed": "mercury_revolution_speed",
    "venus-speed": "venus_revolution_speed",
    "earth-speed": "earth_revolution_speed",
    "mars-speed": "mars_revolution_speed",
    "jupiter-speed": "jupiter_revolution_speed",
    "saturn-speed": "saturn_revolution_speed",
    "uranus-speed": "uranus_revolution_speed",
    "neptune-speed": "neptune_revolution_speed",
  };

  Object.entries(speedInputs).forEach(([inputId, speedVar]) => {
    const input = document.getElementById(inputId);
    const valueDisplay = input.nextElementSibling;

    input.addEventListener("input", (e) => {
      const newSpeed = parseFloat(e.target.value);
      // Update the global speed variable
      switch (speedVar) {
        case "mercury_revolution_speed":
          mercury_revolution_speed = newSpeed;
          break;
        case "venus_revolution_speed":
          venus_revolution_speed = newSpeed;
          break;
        case "earth_revolution_speed":
          earth_revolution_speed = newSpeed;
          break;
        case "mars_revolution_speed":
          mars_revolution_speed = newSpeed;
          break;
        case "jupiter_revolution_speed":
          jupiter_revolution_speed = newSpeed;
          break;
        case "saturn_revolution_speed":
          saturn_revolution_speed = newSpeed;
          break;
        case "uranus_revolution_speed":
          uranus_revolution_speed = newSpeed;
          break;
        case "neptune_revolution_speed":
          neptune_revolution_speed = newSpeed;
          break;
      }
      valueDisplay.textContent = newSpeed.toFixed(1);
    });
  });
}

function planetRevolver(time, speed, planet, orbitRadius, planetName) {
  let orbitSpeedMultiplier = 0.001;
  const planetAngle = time * orbitSpeedMultiplier * speed;
  planet.position.x =
    planet_sun.position.x + orbitRadius * Math.cos(planetAngle);
  planet.position.z =
    planet_sun.position.z + orbitRadius * Math.sin(planetAngle);
}

function animate(time) {
  requestAnimationFrame(animate);

  // Update shooting stars
  updateShootingStars();

  // Rotate the planets
  const rotationSpeed = 0.005;
  planet_earth.rotation.y += rotationSpeed;
  planet_sun.rotation.y += rotationSpeed;
  planet_mercury.rotation.y += rotationSpeed;
  planet_venus.rotation.y += rotationSpeed;
  planet_mars.rotation.y += rotationSpeed;
  planet_jupiter.rotation.y += rotationSpeed;
  planet_saturn.rotation.y += rotationSpeed;
  planet_uranus.rotation.y += rotationSpeed;
  planet_neptune.rotation.y += rotationSpeed;

  planetRevolver(
    time,
    mercury_revolution_speed,
    planet_mercury,
    mercury_orbit_radius,
    "mercury"
  );
  planetRevolver(
    time,
    venus_revolution_speed,
    planet_venus,
    venus_orbit_radius,
    "venus"
  );
  planetRevolver(
    time,
    earth_revolution_speed,
    planet_earth,
    earth_orbit_radius,
    "earth"
  );
  planetRevolver(
    time,
    mars_revolution_speed,
    planet_mars,
    mars_orbit_radius,
    "mars"
  );
  planetRevolver(
    time,
    jupiter_revolution_speed,
    planet_jupiter,
    jupiter_orbit_radius,
    "jupiter"
  );
  planetRevolver(
    time,
    saturn_revolution_speed,
    planet_saturn,
    saturn_orbit_radius,
    "saturn"
  );
  planetRevolver(
    time,
    uranus_revolution_speed,
    planet_uranus,
    uranus_orbit_radius,
    "uranus"
  );
  planetRevolver(
    time,
    neptune_revolution_speed,
    planet_neptune,
    neptune_orbit_radius,
    "neptune"
  );

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);

init();
animate(0); // Initialize with time 0
