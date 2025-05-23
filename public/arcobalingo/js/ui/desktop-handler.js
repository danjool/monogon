// Desktop Handler - Manages desktop-specific interactions
export class DesktopHandler {
    constructor() {
        this.isInitialized = false;
        this.columnWidths = { italian: 33.33, english: 33.33, notes: 33.34 };
        this.isResizing = false;
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        this.setupAccessibility();
        this.isInitialized = true;
    }
    
    setupAccessibility() {
        const headers = document.querySelectorAll('.header h2');
        headers.forEach((header, index) => {
            const columnNames = ['italian-text', 'english-text', 'notes-text'];
            header.setAttribute('id', columnNames[index]);
        });
        
        const columns = document.querySelectorAll('.line');
        columns.forEach((column, index) => {
            column.setAttribute('tabindex', '0');
            column.setAttribute('role', 'article');
        });
    }
    
    
    setupScrollSync() {
        const container = document.getElementById('text-container');
        if (!container) return;
        
        let isScrolling = false;
        
        container.addEventListener('scroll', () => {
            if (isScrolling) return;
            
            isScrolling = true;
            
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        });
    }
    
    handleResize() {
        const container = document.getElementById('text-container');
        if (container) {
            this.updateColumnLayout();
        }
    }
    
    updateColumnLayout() {
        const root = document.documentElement;
        root.style.setProperty('--italian-width', `${this.columnWidths.italian}%`);
        root.style.setProperty('--english-width', `${this.columnWidths.english}%`);
        root.style.setProperty('--notes-width', `${this.columnWidths.notes}%`);
    }
    
    findWord(searchText, columnType = null) {
        let selector = '.word';
        if (columnType) {
            selector += `[data-language="${columnType}"]`;
        }
        
        const words = document.querySelectorAll(selector);
        const matches = [];
        
        words.forEach(word => {
            if (word.dataset.word?.toLowerCase().includes(searchText.toLowerCase())) {
                matches.push(word);
            }
        });
        
        return matches;
    }
    
    highlightSearchResults(searchText) {
        const matches = this.findWord(searchText);
        
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
        
        matches.forEach(match => {
            match.classList.add('search-highlight');
        });
        
        return matches.length;
    }
    
    goToLine(lineNumber) {
        const linePairs = document.querySelectorAll('.line-pair');
        if (lineNumber > 0 && lineNumber <= linePairs.length) {
            const targetLine = linePairs[lineNumber - 1];
            targetLine.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            targetLine.classList.add('line-highlight');
            setTimeout(() => {
                targetLine.classList.remove('line-highlight');
            }, 2000);
        }
    }
    
    getCurrentPosition() {
        const container = document.getElementById('text-container');
        if (!container) return { line: 0, percentage: 0 };
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        const linePairs = document.querySelectorAll('.line-pair');
        let currentLine = 0;
        
        for (let i = 0; i < linePairs.length; i++) {
            const rect = linePairs[i].getBoundingClientRect();
            if (rect.top <= 100) {
                currentLine = i + 1;
            } else {
                break;
            }
        }
        
        return { line: currentLine, percentage: Math.round(percentage) };
    }
    
    destroy() {
        this.isInitialized = false;
    }
    
    getStats() {
        const position = this.getCurrentPosition();
        const totalLines = document.querySelectorAll('.line-pair').length;
        
        return {
            isInitialized: this.isInitialized,
            currentLine: position.line,
            totalLines: totalLines,
            readingProgress: position.percentage,
            columnWidths: this.columnWidths
        };
    }
}
