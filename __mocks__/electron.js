// Mock for electron
const electron = {
    shell: {
        openExternal: jest.fn(),
        showItemInFolder: jest.fn()
    },
    ipcRenderer: {
        send: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn()
    }
};

module.exports = electron;