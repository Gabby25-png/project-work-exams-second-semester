import calculateReadingTime from '../../utils/readingTime';

describe('Reading Time Utility', () => {
    it('should calculate 1 minute for short text', () => {
        const text = 'This is a short text.';
        expect(calculateReadingTime(text)).toEqual(1);
    });

    it('should calculate 2 minutes for ~300 words', () => {
        const words = new Array(300).fill('word').join(' ');
        expect(calculateReadingTime(words)).toEqual(2);
    });

    it('should handle empty text', () => {
        expect(calculateReadingTime('')).toEqual(0);
    });
});
