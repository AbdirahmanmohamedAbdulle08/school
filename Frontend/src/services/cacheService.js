const CACHE_KEY_PREFIX = 'wms_cache_';
const CACHE_EXPIRY = 1000 * 60 * 10; // 10 minutes

const cacheService = {
    set: (key, data) => {
        const cacheObj = {
            timestamp: Date.now(),
            data
        };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheObj));
    },

    get: (key) => {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (!cached) return null;

        try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(CACHE_KEY_PREFIX + key);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    },

    remove: (key) => {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
    },

    clear: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

export default cacheService;
