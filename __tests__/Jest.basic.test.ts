/**
 * Test simple pour valider que Jest fonctionne
 */

// Export pour faire de ce fichier un module
export {};

describe('Jest Configuration Test', () => {
    it('should run basic Jest functionality', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toBe('hello');
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
    });

    it('should handle mocks', () => {
        const mockFunction = jest.fn();
        mockFunction('test');
        
        expect(mockFunction).toHaveBeenCalled();
        expect(mockFunction).toHaveBeenCalledWith('test');
    });

    it('should handle async operations', async () => {
        const promise = Promise.resolve('success');
        const result = await promise;
        
        expect(result).toBe('success');
    });

    it('should handle objects and arrays', () => {
        const obj = { name: 'test', value: 42 };
        const arr = [1, 2, 3];
        
        expect(obj).toHaveProperty('name');
        expect(obj.name).toBe('test');
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    it('should handle DOM simulation', () => {
        // Vérifier que l'environnement de test fonctionne avec du DOM mocké
        const mockDoc = {
            createElement: (tag: string) => ({
                tagName: tag.toUpperCase(),
                innerHTML: '',
                textContent: ''
            })
        };
        
        expect(typeof mockDoc).toBe('object');
        expect(mockDoc.createElement).toBeDefined();
        
        const div = mockDoc.createElement('div');
        div.innerHTML = '<p>Test content</p>';
        
        expect(div.tagName).toBe('DIV');
        expect(div.innerHTML).toContain('Test content');
    });
});