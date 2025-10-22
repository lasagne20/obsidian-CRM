// Mock for three/examples/jsm/controls/OrbitControls.js

class OrbitControls {
    constructor(camera, domElement) {
        this.enabled = true;
        this.target = { x: 0, y: 0, z: 0 };
        this.minDistance = 0;
        this.maxDistance = Infinity;
    }
    
    update() {}
    dispose() {}
    saveState() {}
    reset() {}
}

module.exports = { OrbitControls };
module.exports.OrbitControls = OrbitControls;