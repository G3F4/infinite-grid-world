import {
  Color3,
  Engine,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  HemisphericLight,
  Mesh,
  Color4,
  FlyCamera,
} from 'babylonjs';
import DynamicTerrain from './extensions/dynamicTerrain/DynamicTerrain';
import Noise from './noise';

require('file-loader?name=[name].[ext]!./public/index.html');

const noise = new Noise(Math.random());
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function wireMap(scene: Scene) {
  // Map data creation
  // The map is a flat array of successive 3D coordinates (x, y, z).
  // It's defined by a number of points on its width : mapSubX
  // and a number of points on its height : mapSubZ

  const mapSubX = 1000; // point number on X axis
  const mapSubZ = 800; // point number on Z axis
  const seed = 0.3; // seed
  const noiseScale = 0.03; // noise frequency
  const elevationScale = 6.0;
  noise.seed(seed);
  const mapData = new Float32Array(mapSubX * mapSubZ * 3); // 3 float values per point : x, y and z

  const paths = []; // array for the ribbon model
  for (let l = 0; l < mapSubZ; l++) {
    const path = []; // only for the ribbon
    for (let w = 0; w < mapSubX; w++) {
      const x = (w - mapSubX * 0.5) * 2.0;
      const z = (l - mapSubZ * 0.5) * 2.0;
      let y = noise.simplex2(x * noiseScale, z * noiseScale);
      y *= (0.5 + y) * y * elevationScale; // let's increase a bit the noise computed altitude

      mapData[3 * (l * mapSubX + w)] = x;
      mapData[3 * (l * mapSubX + w) + 1] = y;
      mapData[3 * (l * mapSubX + w) + 2] = z;

      path.push(new Vector3(x, y, z));
    }
    paths.push(path);
  }


  function randomColors(howMany = 0) {
    function randomValue() {
      return Math.ceil(Math.random() * 256);
    }

    function randomColor() {
      return Color4.FromInts(randomValue(), randomValue(), randomValue(), randomValue());
    }

    return Array.from({ length: howMany }).map(randomColor);
  }

  const map = MeshBuilder.CreateRibbon(
    'm',
    { pathArray: paths, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  );
  map.position.y = -1.0;
  const mapMaterial = new StandardMaterial('mm', scene);
  mapMaterial.wireframe = true;
  mapMaterial.alpha = 0.5;
  map.material = mapMaterial;

  dynamicTerrainMap({ scene, mapData, mapSubX, mapSubZ, wireframe: false })
}

function dynamicTerrainMap({ scene, mapData = new Float32Array(0), mapSubX = 0, mapSubZ = 0, wireframe = false }) {
  const terrainSub = 1000; // 100 terrain subdivisions
  const params = {
    mapData: mapData, // data map declaration : what data to use ?
    mapSubX: mapSubX, // how are these data stored by rows and columns
    mapSubZ: mapSubZ,
    terrainSub: terrainSub, // how many terrain subdivisions wanted
  };
  const terrain = new DynamicTerrain('t', params, scene);
  const terrainMaterial = new StandardMaterial('tm', scene);
  terrainMaterial.diffuseColor = Color3.Green();
  terrainMaterial.alpha = 0.5;
  terrainMaterial.wireframe = wireframe;
  terrain.mesh.material = terrainMaterial;
}

const createScene = function () {
  const scene = new Scene(engine);
  const camera = new FlyCamera("FlyCamera", new Vector3(0, 5, -10), scene);
  camera.attachControl(canvas, true);
  const light = new HemisphericLight(
    'light1',
    new Vector3(0.0, 1.0, 0.0),
    scene,
  );
  light.intensity = 0.75;
  light.specular = Color3.Black();

  wireMap(scene);
  
  return scene;
};

const scene: Scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});
