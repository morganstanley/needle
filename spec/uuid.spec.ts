import { generateUUID } from '../main/core/uuid'; // Adjust the import path as necessary

describe('generateUUID', () => {
    it('should return a string', () => {
        const uuid = generateUUID();
        expect(typeof uuid).toBe('string');
    });

    it('should return a valid UUID format', () => {
        const uuid = generateUUID();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs each time it is called', () => {
        const uuid1 = generateUUID();
        const uuid2 = generateUUID();
        const uuid3 = generateUUID();
        expect(uuid1).not.toBe(uuid2);
        expect(uuid1).not.toBe(uuid3);
        expect(uuid2).not.toBe(uuid3);
    });
});
