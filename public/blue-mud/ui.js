export class UIManager {
    constructor() {
        this.messageArea = document.getElementById('messages');
        this.gameArea = document.getElementById('gameArea');
        this.loginArea = document.getElementById('loginArea');
    }

    updateRoom(room) {
        document.getElementById('roomTitle').textContent = room.title;
        document.getElementById('roomDesc').textContent = room.description;
        
        const exitsList = room.exits?.map(exit => 
            `${exit.name} (${exit.did})`
        ).join(', ') || 'none';
        document.getElementById('exits').textContent = `Exits: ${exitsList}`;
        
        document.getElementById('playersHere').textContent = 
            `Players here: ${room.players.join(', ') || 'none'}`;
        document.getElementById('itemsHere').textContent = 
            `Items here: ${room.items?.join(', ') || 'none'}`;
    }

    addMessage(sender, text, className = '') {
        const messages = document.getElementById('messages');
        const time = luxon.DateTime.now().toLocaleString(luxon.DateTime.TIME_SIMPLE);
        const classAttr = className ? ` class="${className}"` : '';
        messages.innerHTML += `<p${classAttr}><strong>${time} - ${sender}:</strong> ${marked.parse(text)}</p>`;
        messages.scrollTop = messages.scrollHeight;
    }

    toggleGameArea(show) {
        this.gameArea.style.display = show ? 'block' : 'none';
        this.loginArea.style.display = show ? 'none' : 'block';
    }
}