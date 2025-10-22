// Mock for three.js
const THREE = {
  Scene: class Scene {
    constructor() {
      this.children = [];
    }
    add(child) {
      this.children.push(child);
    }
    remove(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1);
      }
    }
  },
  
  PerspectiveCamera: class PerspectiveCamera {
    constructor(fov, aspect, near, far) {
      this.fov = fov;
      this.aspect = aspect;
      this.near = near;
      this.far = far;
      this.position = { set: jest.fn() };
    }
  },
  
  WebGLRenderer: class WebGLRenderer {
    constructor(options = {}) {
      this.domElement = document.createElement('canvas');
      this.setSize = jest.fn();
      this.setClearColor = jest.fn();
      this.render = jest.fn();
      this.dispose = jest.fn();
    }
  },
  
  Mesh: class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.position = { set: jest.fn() };
      this.rotation = { set: jest.fn() };
      this.scale = { set: jest.fn() };
    }
  },
  
  BoxGeometry: class BoxGeometry {
    constructor(width = 1, height = 1, depth = 1) {
      this.width = width;
      this.height = height;
      this.depth = depth;
    }
  },
  
  MeshBasicMaterial: class MeshBasicMaterial {
    constructor(parameters = {}) {
      this.color = parameters.color || 0xffffff;
    }
  }
};

module.exports = THREE;