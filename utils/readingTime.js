const calculateReadingTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / wordsPerMinute);
};

export default calculateReadingTime;
