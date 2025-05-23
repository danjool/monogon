// Data Loader - Handles Dictionary and Canto Loading
import { DictionaryValidator } from '../utils/dictionary-validator.js';

export class DataLoader {
    constructor() {
        this.coreDictionary = null;
        this.cantoCache = new Map();
        this.supplementCache = new Map();
        this.maxCacheSize = 5; // Keep 5 cantos in memory
        this.validator = new DictionaryValidator();
    }
    
    async loadCoreDictionary() {
        if (this.coreDictionary) {
            return this.coreDictionary;
        }
        
        try {
            console.log('Loading core dictionary...');
            const { coreDictionary } = await import('../data/dict-core.js');
            this.coreDictionary = coreDictionary;

            this.cacheToStorage('core-dictionary', coreDictionary);
            
            console.log(`Core dictionary loaded: ${Object.keys(coreDictionary).length} words`);
            return this.coreDictionary;
        } catch (error) {
            console.error('Failed to load core dictionary:', error);
            
            // Try to load from localStorage as fallback
            const cached = this.loadFromStorage('core-dictionary');
            if (cached) {
                console.log('Using cached dictionary from localStorage');
                this.coreDictionary = cached;
                return this.coreDictionary;
            }
            
            throw new Error('Core dictionary could not be loaded');
        }
    }
    
    async loadCanto(cantoNumber, isPreload = false) {
        if (this.cantoCache.has(cantoNumber)) {
            console.log(`Canto ${cantoNumber} loaded from cache`);
            return this.cantoCache.get(cantoNumber);
        }
        try {            
            const cantoId = cantoNumber.toString().padStart(2, '0');
            
            const cantoModule = await import(`../data/cantos/canto${cantoId}.js`);
            const cantoData = cantoModule[`canto${cantoId}`];
            
            if (!cantoData) {
                throw new Error(`Canto data not found in module`);
            }
            
            await this.loadCantoSupplement(cantoNumber);
            
            this.cacheCantoData(cantoNumber, cantoData);
            
            this.cacheToStorage(`canto-${cantoNumber}`, cantoData);
            
            if (!isPreload && this.coreDictionary) {
                const supplement = this.getCantoSupplement(cantoNumber);
                this.validator.validateCantoWords(
                    cantoNumber,
                    cantoData,
                    this.coreDictionary,
                    supplement
                );
            }
            
            console.log(`Canto ${cantoNumber} loaded successfully`);
            return cantoData;
            
        } catch (error) {
            console.error(`Failed to load Canto ${cantoNumber}:`, error);
            
            // Try localStorage fallback
            const cached = this.loadFromStorage(`canto-${cantoNumber}`);
            if (cached) {
                console.log(`Using cached Canto ${cantoNumber} from localStorage`);
                this.cacheCantoData(cantoNumber, cached);
                return cached;
            }
            
            return null;
        }
    }
    
    async loadCantoSupplement(cantoNumber) {
        if (this.supplementCache.has(cantoNumber)) {
            return this.supplementCache.get(cantoNumber);
        }
        
        try {
            const cantoId = cantoNumber.toString().padStart(2, '0');
            const supplementModule = await import(`../data/dict-supplements/canto${cantoId}-words.js`);
            const supplement = supplementModule[`canto${cantoId}Supplement`];
            
            if (supplement) {
                this.supplementCache.set(cantoNumber, supplement);
                console.log(`Loaded ${Object.keys(supplement).length} supplementary words for Canto ${cantoNumber}`);
                return supplement;
            }
        } catch (error) {
            // Supplements are optional, don't log errors
            console.log(`No supplement found for Canto ${cantoNumber} (this is normal)`);
        }
        
        return {};
    }
    
    getCanto(cantoNumber) {
        return this.cantoCache.get(cantoNumber);
    }
    
    getDictionary() {
        const merged = { ...this.coreDictionary };
        for (const supplement of this.supplementCache.values()) {
            Object.assign(merged, supplement);
        }
        
        return merged;
    }
    
    getCantoSupplement(cantoNumber) {
        return this.supplementCache.get(cantoNumber) || {};
    }
    
    cacheCantoData(cantoNumber, data) {
        if (this.cantoCache.size >= this.maxCacheSize) {
            const firstKey = this.cantoCache.keys().next().value;
            this.cantoCache.delete(firstKey);
            console.log(`Evicted Canto ${firstKey} from cache`);
        }
        
        this.cantoCache.set(cantoNumber, data);
    }
    
    cacheToStorage(key, data) {
        try {
            const serialized = JSON.stringify({
                data,
                timestamp: Date.now()
            });
            localStorage.setItem(`divine-comedy-${key}`, serialized);
        } catch (error) {
            console.warn('Failed to cache to localStorage:', error);
        }
    }
    
    loadFromStorage(key) {
        try {
            const cached = localStorage.getItem(`divine-comedy-${key}`);
            if (!cached) return null;
            
            const parsed = JSON.parse(cached);
            const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
            
            // Cache expires after 24 hours
            if (ageHours > 24) {
                localStorage.removeItem(`divine-comedy-${key}`);
                return null;
            }
            
            return parsed.data;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return null;
        }
    }
    
    clearCache() {
        this.cantoCache.clear();
        this.supplementCache.clear();
        
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('divine-comedy-')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('All caches cleared');
    }
    
    preloadCanto(cantoNumber) {
        // Non-blocking preload
        this.loadCanto(cantoNumber).catch(error => {
            console.log(`Preload failed for Canto ${cantoNumber}:`, error.message);
        });
    }
    
    getStorageInfo() {
        const info = {
            cantosCached: this.cantoCache.size,
            supplementsCached: this.supplementCache.size,
            dictionaryLoaded: !!this.coreDictionary,
            localStorageUsed: 0
        };

        try {
            const keys = Object.keys(localStorage);
            const divineComedyKeys = keys.filter(key => key.startsWith('divine-comedy-'));
            
            divineComedyKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    info.localStorageUsed += value.length;
                }
            });
            
            info.localStorageUsed = Math.round(info.localStorageUsed / 1024); // KB
        } catch (error) {
            info.localStorageUsed = 'unknown';
        }
        
        return info;
    }
}
