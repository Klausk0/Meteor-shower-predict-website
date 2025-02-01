import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 100, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffdd99, 2, 2000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Sun
const sunGeometry = new THREE.SphereGeometry(12, 64, 64);
const sunMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffaa33,
    emissiveIntensity: 2,
    color: 0xffdd77,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets Data
const planets = [
    { name: "Mercury", size: 1, color: 0xaaaaaa, semiMajorAxis: 20, speed: 0.04 },
    { name: "Venus", size: 2, color: 0xffcc33, semiMajorAxis: 30, speed: 0.03 },
    { name: "Earth", size: 2.5, color: 0x3366ff, semiMajorAxis: 40, speed: 0.02 },
];

planets.forEach((planet) => {
    const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(geometry, material);
    scene.add(planetMesh);
    planet.mesh = planetMesh;
    planet.angle = Math.random() * Math.PI * 2;
});

// Animation Loop
function animate() {
    planets.forEach((planet) => {
        planet.angle += planet.speed * parseFloat(document.getElementById("time-scale").value);
        planet.mesh.position.set(planet.semiMajorAxis * Math.cos(planet.angle), 0, planet.semiMajorAxis * Math.sin(planet.angle));
    });

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Meteor Predictions
const meteorGroup = new THREE.Group();
scene.add(meteorGroup);

document.getElementById("month-selector").addEventListener("change", async () => {
    const selectedMonth = document.getElementById("month-selector").value;
    if (!selectedMonth) {
        clearMeteors();
        return;
    }

    try {
        const response = await fetch(`/get-meteors?month=${selectedMonth}`);
        if (!response.ok) throw new Error("Failed to fetch meteor data");

        const meteors = await response.json();
        updateMeteors(meteors);
    } catch (error) {
        console.error("Error fetching meteors:", error);
    }
});

function clearMeteors() {
    while (meteorGroup.children.length) {
        const meteor = meteorGroup.children[0];
        meteorGroup.remove(meteor);
        meteor.geometry.dispose();
        meteor.material.dispose();
    }
}

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
document.getElementById("month-selector").addEventListener("change", async () => {
    const selectedMonth = document.getElementById("month-selector").value;
    const predictionPanel = document.getElementById("meteor-predictions");

    if (!selectedMonth) {
        predictionPanel.innerHTML = "Select a month to view meteor predictions.";
        return;
    }

    try {
        const apiUrl = "http://127.0.0.1:5000/get-meteors?month=" + selectedMonth;  // Full API URL
        const response = await fetch(apiUrl);

        console.log("Response Headers:", response.headers.get("content-type"));

        if (!response.headers.get("content-type").includes("application/json")) {
            const errorText = await response.text();
            throw new Error(`Invalid response format: ${errorText}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unknown error occurred.");
        }

        if (!data.predictions || data.predictions.length === 0) {
            predictionPanel.innerHTML = "No meteor predictions available for this month.";
            return;
        }

        predictionPanel.innerHTML = `<strong>Meteor Predictions for ${data.month}:</strong><br>`;
        data.predictions.forEach(({ mass, location, date }) => {
            predictionPanel.innerHTML += ` 🌍 ${location} - ⚖️ ${mass} kg<br>`;
        });
    } catch (error) {
        predictionPanel.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        console.error("Error fetching predictions:", error);
    }
});

