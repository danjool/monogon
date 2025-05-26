// Pinocchio Reader - Main Application Controller
import { modernDictionary } from './dict-modern.js';
import { chapterMetadata, storyInfo } from './metadata.js';
import { ColorMapper } from './color-mapper.js';
import { HighlightManager } from './highlight-manager.js';

class PinocchioApp {
    constructor() {
        this.dictionary = modernDictionary;
        this.colorMapper = new ColorMapper();
        this.highlightManager = new HighlightManager(this.colorMapper);
        this.currentChapter = null;
        this.isLoading = false;
        this.isMobile = window.innerWidth <= 768;
        this.currentColumn = 0; // For mobile: 0=Italian, 1=English, 2=Notes
        this.PUNCTUATION_REGEX = /^[.,;:!?«»"""'\-—()*…]+|[.,;:!?«»"""'\-—()*…]+$/g;
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize color mapping and highlighting
            this.colorMapper.updateDictionary(this.dictionary);
            this.highlightManager.initialize();
            
            this.setupRouting();
            this.setupEventListeners();
            this.generateChapterButtons();
            this.handleRoute();
            
            console.log('Pinocchio Reader initialized successfully, dictionary loaded with', Object.keys(this.dictionary).length, 'words.');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load application. Please refresh and try again.');
        }
    }
    
    generateChapterButtons() {
        const chapterGrid = document.getElementById('chapter-grid');
        if (!chapterGrid) return;
        
        chapterGrid.innerHTML = '';
        
        // Generate buttons for all 36 chapters
        for (let i = 1; i <= storyInfo.totalChapters; i++) {
            const chapterInfo = chapterMetadata[i];
            
            const button = document.createElement('button');
            button.className = 'chapter-button';
            button.dataset.chapter = i;
            
            const chapterNumber = document.createElement('span');
            chapterNumber.className = 'chapter-number';
            chapterNumber.textContent = `Chapter ${i}`;
            
            const chapterTitle = document.createElement('span');
            chapterTitle.className = 'chapter-title';
            chapterTitle.textContent = chapterInfo ? chapterInfo.title.substring(0, 60) + '...' : `Chapter ${i}`;
            
            button.appendChild(chapterNumber);
            button.appendChild(chapterTitle);
            
            chapterGrid.appendChild(button);
        }
    }
    
    setupRouting() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.chapter-button')) {
                const chapterNumber = e.target.dataset.chapter;
                this.loadChapter(parseInt(chapterNumber));
            }
        });
        
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateChapter(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateChapter(1));
        
        // Mobile swipe handling
        if (this.isMobile) {
            this.setupMobileSwipe();
        }
        
        // Tooltips
        this.setupTooltips();
        
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile && this.currentChapter) {
                this.renderCurrentChapter();
            }
        });
    }
    
    setupMobileSwipe() {
        const container = document.getElementById('text-container');
        if (!container) return;
        
        let touchStartX = 0;
        let touchEndX = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const diff = startX - endX;
        const threshold = 50;
        
        if (Math.abs(diff) < threshold) return;
        
        if (diff > 0 && this.currentColumn < 2) {
            this.switchToColumn(this.currentColumn + 1);
        } else if (diff < 0 && this.currentColumn > 0) {
            this.switchToColumn(this.currentColumn - 1);
        }
    }
    
    switchToColumn(columnIndex) {
        this.currentColumn = columnIndex;
        
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('active');
        });
        
        const selectedColumn = document.querySelector(`.column-content[data-column="${columnIndex}"]`);
        if (selectedColumn) {
            selectedColumn.classList.add('active');
        }
        
        this.updateMobileIndicators();
    }
    
    updateMobileIndicators() {
        const indicators = document.getElementById('swipe-indicators');
        if (!indicators || !this.isMobile) return;
        
        indicators.style.display = 'flex';
        
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        
        const activeDot = document.querySelector(`.dot[data-column="${this.currentColumn}"]`);
        if (activeDot) {
            activeDot.classList.add('active');
        }
    }
    
    setupTooltips() {
        let tooltip = document.getElementById('tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.word[data-language="italian"]')) {
                this.showTooltip(e.target, tooltip);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.word')) {
                tooltip.style.display = 'none';
            }
        });
    }
    
    showTooltip(wordElement, tooltip) {
        const word = wordElement.dataset.word;
        const translation = this.dictionary[word?.toLowerCase()];
        
        if (translation) {
            tooltip.textContent = translation;
            tooltip.style.display = 'block';
            
            const rect = wordElement.getBoundingClientRect();
            
            const tooltipHeight = tooltip.offsetHeight;
            
            // Position the tooltip above the word and account for scrolling
            // getBoundingClientRect() returns coordinates relative to the viewport, the visible part of the document
            // so we need to add the scroll position to get document coordinates
            tooltip.style.left = (rect.left + window.scrollX) + 'px';
            tooltip.style.top = (rect.top + window.scrollY - tooltipHeight - 10) + 'px';
        }
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1);
        
        if (hash.startsWith('chapter')) {
            const chapterMatch = hash.match(/chapter(\d+)/);
            if (chapterMatch) {
                const chapterNumber = parseInt(chapterMatch[1]);
                this.loadChapter(chapterNumber);
                return;
            }
        }
        
        this.showChapterSelection();
    }
    
    async loadChapter(chapterNumber) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading(`Loading Chapter ${chapterNumber}...`);
            
            // Dynamic import of chapter data
            const chapterModule = await import(`./chapters/chapter${chapterNumber.toString().padStart(2, '0')}.js`);
            const chapterData = chapterModule[`chapter${chapterNumber.toString().padStart(2, '0')}`];
            
            if (!chapterData) {
                throw new Error(`Chapter ${chapterNumber} not available at ./chapters/chapter${chapterNumber.toString().padStart(2, '0')}.js`);
            }
            
            this.currentChapter = chapterNumber;
            
            const newHash = `#chapter${chapterNumber}`;
            if (window.location.hash !== newHash) {
                history.pushState(null, null, newHash);
            }
            
            this.renderChapter(chapterData);
            this.updateNavigation();
            this.showReadingInterface();
            this.logUntraslatedWords(chapterData.textPairs,chapterNumber);
            
        } catch (error) {
            console.error(`Failed to load chapter ${chapterNumber}:`, error);
            this.showError(`Chapter ${chapterNumber} is not yet available. Please check back later as we continue adding translated chapters.`);
        } finally {
            this.isLoading = false;
        }
    }

    logUntraslatedWords(textPairs, chapterNumber) {
        const untranslatableWords = new Set();
        
        textPairs.forEach(pair => {
            if (Array.isArray(pair) && pair.length >= 2) {
                const italianWords = pair[0].split(/\s+/);
                
                italianWords.forEach(word => {
                    // Clean punctuation from word (both leading and trailing)
                    const cleanWord = word.replace(this.PUNCTUATION_REGEX, '');
                    
                    // Skip empty words, pure punctuation, and very short words
                    if (cleanWord.length <= 1) return;
                    
                    const normalizedWord = cleanWord.toLowerCase();
                    if (!this.dictionary[normalizedWord]) {
                        untranslatableWords.add(cleanWord);
                    }
                });
            }
        });
        
        if (untranslatableWords.size > 0) {
            console.warn('Untranslated words found:', Array.from(untranslatableWords).sort().join(', '));
        } else {
            console.log('No untranslated words found in this chapter! 🦖 Chapter:', chapterNumber);
        }
    }
    
    renderChapter(chapterData) {
        const container = document.getElementById('text-container');
        if (!container) return;
        
        if (this.isMobile) {
            this.renderMobile(chapterData);
        } else {
            this.renderDesktop(chapterData);
        }
    }
    
    renderMobile(chapterData) {
        const container = document.getElementById('text-container');
        
        const italianColumn = this.renderColumn(chapterData.textPairs, 'italian');
        const englishColumn = this.renderColumn(chapterData.textPairs, 'english');
        const notesColumn = this.renderColumn(chapterData.textPairs, 'notes');
        
        container.innerHTML = `
            <div class="column-content active" data-column="0">
                ${italianColumn}
            </div>
            <div class="column-content" data-column="1">
                ${englishColumn}
            </div>
            <div class="column-content" data-column="2">
                ${notesColumn}
            </div>
        `;
        
        this.updateMobileIndicators();
    }
    
    renderDesktop(chapterData) {
        const container = document.getElementById('text-container');
        
        const html = chapterData.textPairs.map((pair, index) => {
            if (this.isStanzaBreak(pair)) {
                return '<div class="stanza-break"></div>';
            }
            
            const italianLine = this.processLine(pair[0], 'italian');
            const englishLine = this.processLine(pair[1], 'english');
            const notesLine = pair[2] ? `<span class="note">${pair[2]}</span>` : '';
            
            return `<div class="line-pair">
                <div class="line" data-language="italian">${italianLine}</div>
                <div class="line" data-language="english">${englishLine}</div>
                <div class="line" data-language="notes">${notesLine}</div>
            </div>`;
        }).join('');
        
        container.innerHTML = html;
    }
    
    renderColumn(textPairs, columnType) {
        return textPairs.map((pair, index) => {
            if (this.isStanzaBreak(pair)) {
                return '<div class="stanza-break"></div>';
            }
            
            let content = '';
            
            switch (columnType) {
                case 'italian':
                    content = this.processLine(pair[0], 'italian');
                    break;
                case 'english':
                    content = this.processLine(pair[1], 'english');
                    break;
                case 'notes':
                    content = pair[2] ? `<span class="note">${pair[2]}</span>` : '';
                    break;
            }
            
            return `<div class="line" data-language="${columnType}">${content}</div>`;
        }).join('');
    }
    
    processLine(line, language) {
    if (!line || line === '') return '';
    
    // First, add spaces around em dashes when they follow other punctuation
    const preprocessed = line.replace(/([.,;:!?])―/g, '$1 ―');
    
    // Then split by whitespace
    const words = preprocessed.split(/\s+/);
    
    return words.map(word => {
        // Extract clean word by removing ALL punctuation from both ends
        const cleanWord = word.replace(this.PUNCTUATION_REGEX, '').toLowerCase();
        
        if (cleanWord.length === 0) return word;
        
        // Get semantic color for the CLEAN word
        const color = this.colorMapper.getSemanticColor(cleanWord, language);
        
        // Return original word wrapped, but use clean word for data attributes and color
        return `<span class="word" data-word="${cleanWord}" data-language="${language}" style="background-color: ${color}">${word}</span>`;
    }).join(' ');
}

    
    isStanzaBreak(pair) {
        return Array.isArray(pair) && 
               pair.length >= 3 && 
               pair[0] === "" && 
               pair[1] === "" && 
               pair[2] === "";
    }
    
    navigateChapter(direction) {
        const newChapter = this.currentChapter + direction;
        
        if (newChapter >= 1 && newChapter <= storyInfo.totalChapters) {
            this.loadChapter(newChapter);
        }
    }
    
    updateNavigation() {
        const nav = document.getElementById('chapter-nav');
        const currentSpan = document.getElementById('current-chapter');
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (nav && currentSpan) {
            nav.style.display = 'flex';
            currentSpan.textContent = `Chapter ${this.currentChapter}`;
            
            if (prevBtn) prevBtn.disabled = this.currentChapter <= 1;
            if (nextBtn) nextBtn.disabled = this.currentChapter >= storyInfo.totalChapters;
        }
    }
    
    showChapterSelection() {
        document.getElementById('chapter-selection').style.display = 'block';
        document.getElementById('reading-interface').style.display = 'none';
        document.getElementById('chapter-nav').style.display = 'none';
        
        if (window.location.hash) {
            history.pushState(null, null, window.location.pathname);
        }
        
        this.currentChapter = null;
    }
    
    showReadingInterface() {
        document.getElementById('chapter-selection').style.display = 'none';
        document.getElementById('reading-interface').style.display = 'block';
        
        if (this.isMobile) {
            document.getElementById('swipe-indicators').style.display = 'flex';
        } else {
            document.getElementById('swipe-indicators').style.display = 'none';
        }
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
                <div class="loading" style="color: #ff6b6b;">
                    ${message}
                    <br><br>
                    <button onclick="window.location.reload()" style="margin-top: 10px;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pinocchioApp = new PinocchioApp();
});

export { PinocchioApp };
