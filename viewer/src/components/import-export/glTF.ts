import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Material,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial
} from 'three';
import { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { IFCPROJECT } from 'web-ifc';
import { IfcComponent } from '../../base-types';
import { IfcContext } from '../context';
import { IfcManager } from '../ifc';
import { disposeMeshRecursively } from '../../utils/ThreeUtils';

export class GLTFManager extends IfcComponent {
  GLTFModels: { [modelID: number]: Group } = {};

  private loader = new GLTFLoader();
  private exporter = new GLTFExporter();
  private tempIfcLoader: IFCLoader | null = null;

  private options = {
    trs: false,
    onlyVisible: false,
    truncateDrawRange: true,
    binary: true,
    maxTextureSize: 0
  };

  constructor(private context: IfcContext, private IFC: IfcManager) {
    super(context);
  }

  dispose() {
    (this.loader as any) = null;
    (this.exporter as any) = null;
    const models = Object.values(this.GLTFModels);
    models.forEach((model) => {
      model.removeFromParent();
      model.children.forEach((child) => disposeMeshRecursively(child as Mesh));
    });
    (this.GLTFModels as any) = null;
  }

  /**
   * Loads any glTF file into the scene using [Three.js loader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader).
   * @url The URL of the GLTF file to load
   */
  async load(url: string) {
    const loaded = (await this.loader.loadAsync(url)) as GLTF;
    const mesh = loaded.scene;
    const modelID = this.getModelID();
    this.GLTFModels[modelID] = mesh;
    this.context.getScene().add(mesh);
    return mesh;
  }

  /**
   * Load glTF and enable IFC.js tools over it. T
   * his just works if the glTF was previously exported from an IFC model using `exportIfcAsGltf()`.
   * @url The URL of the GLTF file to load
   */
  async loadModel(url: string) {
    const gltfMesh = await this.getGltfMesh(url);
    gltfMesh.geometry.computeBoundsTree();
    gltfMesh.modelID = this.getModelID();
    this.context.getScene().add(gltfMesh);
    this.setupMeshAsModel(gltfMesh);
    return gltfMesh;
  }

  // TODO: Split up in smaller methods
  /**
   * Exports the specified IFC file (or file subset) as glTF.
   * @fileURL The URL of the IFC file to convert to glTF
   * @ids (optional) The ids of the items to export. If not defined, the full model is exported
   */
  async exportIfcFileAsGltf(
    ifcFileUrl: string,
    getProperties = false,
    categories?: number[][],
    maxJSONSize?: number,
    onProgress?: (progress: number, total: number, process: string) => void
  ) {
    const loader = new IFCLoader();
    this.tempIfcLoader = loader;
    const state = this.IFC.loader.ifcManager.state;
    const manager = loader.ifcManager;

    if (state.wasmPath) await manager.setWasmPath(state.wasmPath);
    if (state.worker.active) await manager.useWebWorkers(true, state.worker.path);
    if (state.webIfcSettings) await manager.applyWebIfcConfig(state.webIfcSettings);

    const model = await loader.loadAsync(ifcFileUrl, (event) => {
      if (onProgress) onProgress(event.loaded, event.total, 'IFC');
    });

    const result: { gltf: File[]; json: File[]; id: string } = { gltf: [], json: [], id: '' };

    const projects = await manager.getAllItemsOfType(model.modelID, IFCPROJECT, true);
    if (!projects.length) throw new Error('No IfcProject instances were found in the IFC.');
    const GUID = projects[0].GlobalId;
    if (!GUID) throw new Error('The found IfcProject does not have a GUID');
    result.id = GUID.value;

    if (categories) {
      const items: number[] = [];

      for (let i = 0; i < categories.length; i++) {
        const currentCategories = categories[i];
        for (let j = 0; j < currentCategories.length; j++) {
          // eslint-disable-next-line no-await-in-loop
          const foundItems = await manager.getAllItemsOfType(0, currentCategories[j], false);
          items.push(...foundItems);
        }

        // eslint-disable-next-line no-await-in-loop
        const gltf = await this.exportModelPartToGltf(model, items, true);
        result.gltf.push(new File([new Blob([gltf])], 'model-part.gltf'));

        if (onProgress) onProgress(i, categories?.length, 'GLTF');
        items.length = 0;
      }
    } else {
      const gltf = await this.exportMeshToGltf(model);
      result.gltf.push(new File([new Blob([gltf])], 'full-model.gltf'));
    }

    if (getProperties) {
      const previousLoader = this.IFC.properties.loader;
      this.IFC.properties.loader = this.tempIfcLoader;

      const jsons = await this.IFC.properties.serializeAllProperties(
        model,
        maxJSONSize,
        (progress: number, total: number) => {
          if (onProgress) onProgress(progress, total, 'JSON');
        }
      );

      result.json = jsons.map((json) => new File([json], 'properties.json'));
      this.IFC.properties.loader = previousLoader;
    }

    await loader.ifcManager.dispose();
    this.tempIfcLoader = null;
    return result;
  }

  /**
   * Exports the specified model (or model subset) as glTF.
   * @modelID The ID of the IFC model to convert to glTF
   * @ids (optional) The ids of the items to export. If not defined, the full model is exported
   */
  async exportIfcAsGltf(modelID: number, ids?: number[]) {
    const model = this.context.items.ifcModels.find((model) => model.modelID === modelID);
    if (!model) throw new Error('The specified model does not exist!');
    return ids ? this.exportModelPartToGltf(model, ids) : this.exportMeshToGltf(model);
  }

  // TODO: Split up in smaller methods
  private exportModelPartToGltf(model: IFCModel, ids: number[], useTempLoader = false) {
    const coordinates: number[] = [];
    const expressIDs: number[] = [];
    const newIndices: number[] = [];

    const alreadySaved = new Map<number, number>();

    const customID = 'temp-gltf-subset';

    const loader = useTempLoader ? this.tempIfcLoader : this.IFC.loader;
    if (!loader) throw new Error('IFCLoader could not be found!');
    const subset = loader.ifcManager.createSubset({
      modelID: model.modelID,
      ids,
      removePrevious: true,
      customID
    });

    if (!subset.geometry.index) throw new Error('Geometry must be indexed!');

    const positionAttr = subset.geometry.attributes.position;
    const expressIDAttr = subset.geometry.attributes.expressID;

    const newGroups: any[] = subset.geometry.groups.filter((group) => group.count !== 0);
    const newMaterials: Material[] = [];
    const prevMaterials = subset.material as Material[];
    let newMaterialIndex = 0;
    newGroups.forEach((group) => {
      newMaterials.push(prevMaterials[group.materialIndex]);
      group.materialIndex = newMaterialIndex++;
    });

    let newIndex = 0;
    for (let i = 0; i < subset.geometry.index.count; i++) {
      const index = subset.geometry.index.array[i];

      if (!alreadySaved.has(index)) {
        coordinates.push(positionAttr.array[3 * index]);
        coordinates.push(positionAttr.array[3 * index + 1]);
        coordinates.push(positionAttr.array[3 * index + 2]);

        expressIDs.push(expressIDAttr.getX(index));
        alreadySaved.set(index, newIndex++);
      }

      const saved = alreadySaved.get(index) as number;
      newIndices.push(saved);
    }

    const geometryToExport = new BufferGeometry();
    const newVerticesAttr = new BufferAttribute(Float32Array.from(coordinates), 3);
    const newExpressIDAttr = new BufferAttribute(Uint32Array.from(expressIDs), 1);

    geometryToExport.setAttribute('position', newVerticesAttr);
    geometryToExport.setAttribute('expressID', newExpressIDAttr);
    geometryToExport.setIndex(newIndices);
    geometryToExport.groups = newGroups;
    geometryToExport.computeVertexNormals();

    loader.ifcManager.removeSubset(model.modelID, undefined, customID);
    const mesh = new Mesh(geometryToExport, newMaterials);

    return this.exportMeshToGltf(mesh);
  }

  private exportMeshToGltf(model: Mesh) {
    return new Promise<any>((resolve) => {
      this.exporter.parse(model, (result: any) => resolve(result), this.options);
    });
  }

  private getModelID() {
    const models = this.context.items.ifcModels;
    if (!models.length) return 0;
    const allIDs = models.map((model) => model.modelID);
    return Math.max(...allIDs) + 1;
  }

  private async getGltfMesh(url: string) {
    const allMeshes = await this.getMeshes(url);
    const geometry = this.getGeometry(allMeshes);
    const materials = this.getMaterials(allMeshes);
    this.cleanUpLoadedInformation(allMeshes);
    return new Mesh(geometry, materials) as any as IFCModel;
  }

  // Necessary to make the glTF work as a model
  private setupMeshAsModel(newMesh: IFCModel) {
    // TODO: In the future we might want to rethink this or at least fix the typings
    this.IFC.loader.ifcManager.state.models[newMesh.modelID] = { mesh: newMesh } as any;
    const items = this.context.items;
    items.ifcModels.push(newMesh);
    items.pickableIfcModels.push(newMesh);
  }

  private cleanUpLoadedInformation(allMeshes: Mesh[]) {
    allMeshes.forEach((mesh) => {
      mesh.geometry.attributes = {};
      mesh.geometry.dispose();
      (mesh.material as MeshStandardMaterial).dispose();
    });
  }

  private getMaterials(allMeshes: Mesh[]) {
    return allMeshes.map((mesh) => {
      const material = mesh.material as MeshStandardMaterial;
      return new MeshLambertMaterial({
        color: material.color,
        transparent: material.opacity !== 1,
        opacity: material.opacity,
        side: 2
      });
    });
  }

  private async getMeshes(url: string) {
    const result = await this.load(url);
    result.removeFromParent();

    const isNested = result.children[0].children.length !== 0;
    const meshes = isNested ? result.children[0].children : [result.children[0]];
    return meshes as Mesh[];
  }

  private getGeometry(meshes: Mesh[]) {
    const geometry = new BufferGeometry();
    this.setupGeometryAttributes(geometry, meshes);
    this.setupGeometryIndex(meshes, geometry);
    this.setupGroups(meshes, geometry);
    return geometry;
  }

  private setupGeometryAttributes(geometry: BufferGeometry, meshes: Mesh[]) {
    // eslint-disable-next-line no-underscore-dangle
    geometry.setAttribute('expressID', meshes[0].geometry.attributes._expressid);
    geometry.setAttribute('position', meshes[0].geometry.attributes.position);
    geometry.setAttribute('normal', meshes[0].geometry.attributes.normal);
  }

  private setupGeometryIndex(meshes: Mesh[], geometry: BufferGeometry) {
    const indices = meshes.map((mesh) => {
      const index = mesh.geometry.index;
      return index ? index.array : [];
    });

    const indexArray = [];
    for (let i = 0; i < indices.length; i++) {
      for (let j = 0; j < indices[i].length; j++) {
        indexArray.push(indices[i][j]);
      }
    }
    geometry.setIndex(indexArray);
  }

  private setupGroups(meshes: Mesh[], geometry: BufferGeometry) {
    const groupLengths = meshes.map((mesh) => {
      const index = mesh.geometry.index;
      return index ? index.count : 0;
    });
    let start = 0;
    let materialIndex = 0;
    geometry.groups = groupLengths.map((count) => {
      const result = { start, count, materialIndex };
      materialIndex++;
      start += count;
      return result;
    });
  }
}
