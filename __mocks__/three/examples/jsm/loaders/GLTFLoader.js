// Mock for three/examples/jsm/loaders/GLTFLoader.js

class GLTFLoader {
    constructor() {}
    
    load(url, onLoad, onProgress, onError) {
        if (onLoad) {
            setTimeout(() => {
                onLoad({ 
                    scene: { 
                        children: [],
                        traverse: jest.fn(),
                        add: jest.fn(),
                        remove: jest.fn()
                    } 
                });
            }, 0);
        }
    }
    
    loadAsync(url) {
        return Promise.resolve({
            scene: {
                children: [],
                traverse: jest.fn(),
                add: jest.fn(),
                remove: jest.fn()
            },
            scenes: [],
            cameras: [],
            animations: []
        });
    }
    
    setPath(path) {
        return this;
    }
}

module.exports = { GLTFLoader };
module.exports.GLTFLoader = GLTFLoader;