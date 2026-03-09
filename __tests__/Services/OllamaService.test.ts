import { OllamaService } from '../../src/Services/IA/OllamaService';
import { OllamaResponse } from '../../src/Services/IA/types';

// Mock global fetch
global.fetch = jest.fn();

describe('OllamaService', () => {
    let ollamaService: OllamaService;
    const mockUrl = 'http://localhost:11434';
    const mockModel = 'llama3';

    beforeEach(() => {
        ollamaService = new OllamaService({
            url: mockUrl,
            model: mockModel,
            temperature: 0.1
        });
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create OllamaService instance with options', () => {
            expect(ollamaService).toBeDefined();
            expect(ollamaService).toBeInstanceOf(OllamaService);
        });
    });

    describe('updateOptions', () => {
        it('should update service options', () => {
            ollamaService.updateOptions({
                url: 'http://localhost:11435',
                model: 'mistral'
            });

            // Can't directly test private options, but we can test that it doesn't throw
            expect(ollamaService).toBeDefined();
        });
    });

    describe('isAvailable', () => {
        it('should return true when Ollama is available', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: [] })
            });

            const result = await ollamaService.isAvailable();
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                `${mockUrl}/api/tags`,
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should return false when Ollama is not available', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await ollamaService.isAvailable();
            expect(result).toBe(false);
        });

        it('should return false when response is not ok', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await ollamaService.isAvailable();
            expect(result).toBe(false);
        });
    });

    describe('listModels', () => {
        it('should return list of available models', async () => {
            const mockModels = [
                { name: 'llama3' },
                { name: 'mistral' },
                { name: 'phi3' }
            ];

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: mockModels })
            });

            const result = await ollamaService.listModels();
            expect(result).toEqual(['llama3', 'mistral', 'phi3']);
        });

        it('should throw error when request fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(ollamaService.listModels()).rejects.toThrow();
        });

        it('should handle empty models list', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            const result = await ollamaService.listModels();
            expect(result).toEqual([]);
        });
    });

    describe('generate', () => {
        const mockResponse: OllamaResponse = {
            model: 'llama3',
            created_at: '2024-01-01T00:00:00Z',
            response: 'Test response',
            done: true
        };

        it('should generate completion successfully', async () => {
            // Mock isAvailable
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true }) // isAvailable
                .mockResolvedValueOnce({ // generate
                    ok: true,
                    json: async () => mockResponse
                });

            const result = await ollamaService.generate('Test prompt');
            
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${mockUrl}/api/generate`,
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Test prompt')
                })
            );
        });

        it('should include system prompt when provided', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

            await ollamaService.generate('Test prompt', 'System prompt');
            
            const callArgs = (global.fetch as jest.Mock).mock.calls[1];
            const body = JSON.parse(callArgs[1].body);
            expect(body.system).toBe('System prompt');
        });

        it('should throw error when Ollama is not available', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

            await expect(ollamaService.generate('Test')).rejects.toThrow();
        });

        it('should throw error when generation fails', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: async () => 'Internal server error'
                });

            await expect(ollamaService.generate('Test')).rejects.toThrow();
        });
    });

    describe('generateJSON', () => {
        it('should parse JSON from response', async () => {
            const jsonData = { entities: [{ type: 'Personne', data: { nom: 'Test' } }] };
            const mockResponse: OllamaResponse = {
                model: 'llama3',
                created_at: '2024-01-01T00:00:00Z',
                response: JSON.stringify(jsonData),
                done: true
            };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

            const result = await ollamaService.generateJSON('Test prompt');
            expect(result).toEqual(jsonData);
        });

        it('should handle JSON embedded in text', async () => {
            const jsonData = { test: 'value' };
            const mockResponse: OllamaResponse = {
                model: 'llama3',
                created_at: '2024-01-01T00:00:00Z',
                response: `Some text before ${JSON.stringify(jsonData)} some text after`,
                done: true
            };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

            const result = await ollamaService.generateJSON('Test');
            expect(result).toEqual(jsonData);
        });

        it('should throw error when no JSON found', async () => {
            const mockResponse: OllamaResponse = {
                model: 'llama3',
                created_at: '2024-01-01T00:00:00Z',
                response: 'No JSON here',
                done: true
            };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

            await expect(ollamaService.generateJSON('Test')).rejects.toThrow();
        });

        it('should throw error when JSON is invalid', async () => {
            const mockResponse: OllamaResponse = {
                model: 'llama3',
                created_at: '2024-01-01T00:00:00Z',
                response: '{ invalid json',
                done: true
            };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

            await expect(ollamaService.generateJSON('Test')).rejects.toThrow();
        });
    });
});
