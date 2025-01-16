const canvas = document.querySelector("#solar-system");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Scene, Camera, and Controls
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 100, 300);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffdd99, 2, 2000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Sun with Emissive Glow
const sunGeometry = new THREE.SphereGeometry(12, 64, 64);
const sunMaterial = new THREE.MeshStandardMaterial({
  emissive: 0xffaa33,
  emissiveIntensity: 2,
  color: 0xffdd77,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starCount = 3000; // Reduced stars for better performance
const starPositions = [];
for (let i = 0; i < starCount; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 4000,
    (Math.random() - 0.5) * 4000,
    (Math.random() - 0.5) * 4000
  );
}
starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Planets Data
const planets = [
  { name: "Mercury", size: 1, color: 0xaaaaaa, semiMajorAxis: 20, semiMinorAxis: 18, tilt: 7, speed: 0.04, info: "Mercury is the smallest planet in the Solar System and closest to the Sun." },
  { name: "Venus", size: 2, color: 0xffcc33, semiMajorAxis: 30, semiMinorAxis: 28, tilt: 3, speed: 0.03, info: "Venus has a thick atmosphere and is the hottest planet in the Solar System." },
  { name: "Earth", size: 2.5, color: 0x3366ff, semiMajorAxis: 40, semiMinorAxis: 38, tilt: 23.5, speed: 0.02, info: "Earth is the only planet known to support life." },
  { name: "Mars", size: 1.8, color: 0xff3300, semiMajorAxis: 50, semiMinorAxis: 48, tilt: 25, speed: 0.018, info: "Mars is known as the Red Planet and has the tallest volcano in the Solar System." },
  { name: "Jupiter", size: 5, color: 0xff9900, semiMajorAxis: 70, semiMinorAxis: 68, tilt: 3, speed: 0.01, info: "Jupiter is the largest planet and has a giant storm called the Great Red Spot." },
  { name: "Saturn", size: 4.5, color: 0xffcc88, semiMajorAxis: 90, semiMinorAxis: 88, tilt: 27, speed: 0.008, info: "Saturn is famous for its extensive ring system." },
  { name: "Uranus", size: 3.8, color: 0x66ccff, semiMajorAxis: 110, semiMinorAxis: 108, tilt: 97.8, speed: 0.007, info: "Uranus rotates on its side and has a bluish color due to methane." },
  { name: "Neptune", size: 3.6, color: 0x3366cc, semiMajorAxis: 130, semiMinorAxis: 128, tilt: 28.3, speed: 0.006, info: "Neptune is the farthest planet from the Sun and has the strongest winds." },
];

// Populate Planet Selector
const planetSelector = document.getElementById("planet-selector");
planets.forEach((planet, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = planet.name;
  planetSelector.appendChild(option);
});

// Add Planets and Orbits
planets.forEach((planet) => {
  const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: planet.color });
  const planetMesh = new THREE.Mesh(geometry, material);

  // Orbit tilt and position
  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.z = THREE.MathUtils.degToRad(planet.tilt); // Set orbit tilt
  scene.add(orbitGroup);

  orbitGroup.add(planetMesh);
  planet.mesh = planetMesh;
  planet.orbitGroup = orbitGroup;
  planet.angle = Math.random() * Math.PI * 2; // Random starting angle

  // Add orbital path
  const orbitCurve = new THREE.EllipseCurve(
    0, 0, // x and y center of ellipse
    planet.semiMajorAxis, planet.semiMinorAxis, // X-radius and Y-radius
    0, 2 * Math.PI, // Start and end angles
    false, // Clockwise
    0 // Rotation angle
  );

  const orbitPoints = orbitCurve.getPoints(200); // Generate points along the curve
  const orbitPathGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });

  const orbitPath = new THREE.Line(orbitPathGeometry, orbitMaterial);
  orbitPath.rotation.x = Math.PI / 2; // Align the orbit to the horizontal plane
  orbitGroup.add(orbitPath); // Add the orbit path to the group
});

// Info Panel Interaction
const infoPanel = document.getElementById("info-panel");
const planetName = document.getElementById("planet-name");
const planetDetails = document.getElementById("planet-details");
const closeInfo = document.getElementById("close-info");

planetSelector.addEventListener("change", () => {
  const selectedPlanet = planets[planetSelector.value];
  if (selectedPlanet) {
    planetName.textContent = selectedPlanet.name;
    planetDetails.textContent = selectedPlanet.info;
    infoPanel.style.display = "block";

    // Smooth camera transition to selected planet
    const target = new THREE.Vector3();
    selectedPlanet.mesh.getWorldPosition(target);
    gsap.to(camera.position, {
      x: target.x + 10,
      y: target.y + 10,
      z: target.z + 10,
      duration: 2,
      onUpdate: () => controls.update(),
    });
  }
});

closeInfo.addEventListener("click", () => {
  infoPanel.style.display = "none";
});

// Animation Loop
function animate() {
  planets.forEach((planet) => {
    planet.angle += planet.speed * parseFloat(document.getElementById("time-scale").value);
    const x = planet.semiMajorAxis * Math.cos(planet.angle);
    const z = planet.semiMinorAxis * Math.sin(planet.angle);
    planet.mesh.position.set(x, 0, z);
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
// Reference to the month selector dropdown
const monthSelector = document.getElementById('month-selector');

// Group for managing meteors independently
const meteorGroup = new THREE.Group();
scene.add(meteorGroup);

// Event listener for month selection
monthSelector.addEventListener('change', async () => {
    const selectedMonth = monthSelector.value;
    if (!selectedMonth) {
        clearMeteors();
        return;
    }

    try {
        // Fetch meteor data for the selected month
        const response = await fetch(`/get-meteors?month=${selectedMonth}`);
        if (!response.ok) {
            console.error('Failed to fetch meteor data:', response.statusText);
            return;
        }

        const meteors = await response.json();
        updateMeteors(meteors);
    } catch (error) {
        console.error('Error fetching meteors:', error);
    }
});

// Clear existing meteors
function clearMeteors() {
    while (meteorGroup.children.length) {
        const meteor = meteorGroup.children[0];
        meteorGroup.remove(meteor);
        meteor.geometry.dispose();
        meteor.material.dispose();
    }
}

// Update meteors in the scene
function updateMeteors(meteors) {
    clearMeteors();

    meteors.forEach(({ x, y, z }) => {
        const meteorGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const meteorMaterial = new THREE.MeshStandardMaterial({ color: 0xff5555 });
        const meteorMesh = new THREE.Mesh(meteorGeometry, meteorMaterial);

        meteorMesh.position.set(x, y, z);
        meteorGroup.add(meteorMesh);
    });
}
