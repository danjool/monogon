// Main Application Controller
import { DataLoader } from './data/loader.js';
import { Renderer } from './ui/renderer.js';
import { MobileHandler } from './ui/mobile-handler.js';
import { DesktopHandler } from './ui/desktop-handler.js';
import { TooltipManager } from './analysis/tooltip-manager.js';
import { HighlightManager } from './analysis/highlight-manager.js';
import { cantoMetadata} from './data/metadata.js';

class DivineComedyApp {
    constructor() {
        this.dataLoader = new DataLoader();
        this.renderer = new Renderer();
        this.mobileHandler = new MobileHandler();
        this.desktopHandler = new DesktopHandler();
        this.tooltipManager = new TooltipManager();
        this.highlightManager = new HighlightManager();
        
        this.currentCanto = null;
        this.isLoading = false;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }
    
    async init() {
        try {
            await this.dataLoader.loadCoreDictionary();
            
            this.setupRouting();
            
            this.setupEventListeners();
            
            this.generateCantoButtons();
            
            this.handleRoute();
            
            console.log('Divine Comedy Reader initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load application. Please refresh and try again.');
        }
    }
    
    toRomanNumeral(num) {
        const romanNumerals = [
            'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
            'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
            'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
            'XXXI', 'XXXII', 'XXXIII', 'XXXIV'
        ];
        return romanNumerals[num - 1] || num.toString();
    }
    
    generateCantoButtons() {
        const cantoGrid = document.getElementById('canto-grid');
        if (!cantoGrid) return;
        
        cantoGrid.innerHTML = '';
        
        for (let i = 1; i <= 34; i++) {
            const cantoInfo = cantoMetadata[i];
            
            const button = document.createElement('button');
            button.className = `canto-button active`;
            button.dataset.canto = i;
            
            const cantoNumber = document.createElement('span');
            cantoNumber.className = 'canto-number';
            cantoNumber.textContent = this.toRomanNumeral(i);
            
            const cantoTitle = document.createElement('span');
            cantoTitle.className = 'canto-title';
            cantoTitle.textContent = cantoInfo ? cantoInfo.title : `Canto ${this.toRomanNumeral(i)}`;
            
            button.appendChild(cantoNumber);
            button.appendChild(cantoTitle);
            
            cantoGrid.appendChild(button);
        }
    }
    
    setupRouting() {
        window.addEventListener('hashchange', () => this.handleRoute());
        
        window.addEventListener('popstate', () => this.handleRoute());
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.canto-button:not(.disabled)')) {
                const cantoNumber = e.target.dataset.canto;
                this.loadCanto(parseInt(cantoNumber));
            }
        });
        
        const prevBtn = document.getElementById('prev-canto');
        const nextBtn = document.getElementById('next-canto');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCanto(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCanto(1));
        
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile && this.currentCanto) {
                // Re-render when switching between mobile/desktop
                this.renderCurrentCanto();
            }
        });
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1); // Remove #
        
        if (hash.startsWith('canto')) {
            const cantoMatch = hash.match(/canto(\d+)/);
            if (cantoMatch) {
                const cantoNumber = parseInt(cantoMatch[1]);
                this.loadCanto(cantoNumber);
                return;
            }
        }
        
        this.showCantoSelection();
    }
    
    async loadCanto(cantoNumber) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading(`Loading Canto ${cantoNumber}...`);
            
            const cantoData = await this.dataLoader.loadCanto(cantoNumber);
            
            if (!cantoData) {
                throw new Error(`Canto ${cantoNumber} not available`);
            }
            
            this.currentCanto = cantoNumber;
            
            const newHash = `#canto${cantoNumber}`;
            if (window.location.hash !== newHash) {
                history.pushState(null, null, newHash);
            }
            
            await this.renderCurrentCanto();
            
            this.updateNavigation();
            
            this.showReadingInterface();
            
            this.preloadAdjacentCantos(cantoNumber);
            
        } catch (error) {
            console.error(`Failed to load canto ${cantoNumber}:`, error);
            this.showError(`Failed to load Canto ${cantoNumber}. Please try again.`);
        } finally {
            this.isLoading = false;
        }
    }
    
    async renderCurrentCanto() {
        const cantoData = await this.dataLoader.getCanto(this.currentCanto);
        const dictionary = this.dataLoader.getDictionary();
        
        if (this.isMobile) {
            this.renderer.renderMobile(cantoData, dictionary);
            this.mobileHandler.initialize();
        } else {
            this.renderer.renderDesktop(cantoData, dictionary);
            this.desktopHandler.initialize();
        }
        
        this.tooltipManager.initialize(dictionary);
        this.highlightManager.initialize(dictionary);
    }
    
    navigateCanto(direction) {
        const newCanto = this.currentCanto + direction;
        
        if (newCanto >= 1 && newCanto <= 1) {
            this.loadCanto(newCanto);
        }
    }
    
    updateNavigation() {
        const nav = document.getElementById('canto-nav');
        const currentSpan = document.getElementById('current-canto');
        const prevBtn = document.getElementById('prev-canto');
        const nextBtn = document.getElementById('next-canto');
        
        if (nav && currentSpan) {
            nav.style.display = 'flex';
            currentSpan.textContent = `Canto ${this.currentCanto}`;
            
            // Enable/disable navigation buttons
            if (prevBtn) prevBtn.disabled = this.currentCanto <= 1;
            if (nextBtn) nextBtn.disabled = this.currentCanto >= 34; // Assuming 34 is the last canto
        }
    }
    
    showCantoSelection() {
        document.getElementById('canto-selection').style.display = 'block';
        document.getElementById('reading-interface').style.display = 'none';
        document.getElementById('canto-nav').style.display = 'none';
        
        const cantoGrid = document.getElementById('canto-grid');
        if (cantoGrid && cantoGrid.children.length === 0) {
            this.generateCantoButtons();
        }
        
        if (window.location.hash) {
            history.pushState(null, null, window.location.pathname);
        }
        
        this.currentCanto = null;
    }
    
    showReadingInterface() {
        document.getElementById('canto-selection').style.display = 'none';
        document.getElementById('reading-interface').style.display = 'block';
    }
    
    showLoading(message = 'Loading...') {
        const container = document.getElementById('text-container');
        if (container) {
            container.innerHTML = `<div class="loading">${message}</div>`;
        }
    }
    
    showError(message) {
        const container = document.getElementById('text-container');
        if (container) {
            container.innerHTML = `
                <div class="loading" style="color: var(--error-color);">
                    ${message}
                    <br><br>
                    <button onclick="window.location.reload()" style="margin-top: 10px;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
    
    async preloadAdjacentCantos(cantoNumber) {
        const preloadTasks = [];
        
        if (cantoNumber > 1) {
            preloadTasks.push(this.dataLoader.loadCanto(cantoNumber - 1));
        }
        
        if (cantoNumber < 100) { // Total cantos in Divine Comedy
            preloadTasks.push(this.dataLoader.loadCanto(cantoNumber + 1));
        }
        
        Promise.allSettled(preloadTasks).then(results => {
            console.log('Preloading completed:', results);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.divineComedyApp = new DivineComedyApp();
});

// Export for testing/debugging
export { DivineComedyApp };
