// E-ink Calendar App
const API_URL = '/api';
let events = [];
let currentDate = new Date();
let selectedDate = new Date();

// E-ink refresh simulation
function simulateEinkRefresh(callback = null) {
  const screen = document.querySelector('.kindle-screen');
  
  // Add the "refreshing" class to initiate animation sequence
  screen.classList.add('refreshing');
  
  // Sequence timing to match real e-ink displays
  setTimeout(() => {
    // First phase: negative flash
    screen.classList.add('negative');
    
    setTimeout(() => {
      // Second phase: all black
      screen.classList.remove('negative');
      screen.classList.add('black');
      
      setTimeout(() => {
        // Third phase: all white
        screen.classList.remove('black');
        screen.classList.add('white');
        
        setTimeout(() => {
          // Final phase: return to normal with new content
          screen.classList.remove('white', 'refreshing');
          
          // Execute callback if provided
          if (callback && typeof callback === 'function') {
            callback();
          }
        }, 100);
      }, 80);
    }, 100);
  }, 50);
}

// Call this when changing views or updating content
function changePage(newContentFunction) {
  simulateEinkRefresh(() => {
    newContentFunction();
  });
}

// Fetch events from API
async function fetchEvents() {
  try {
    const response = await fetch(`${API_URL}/events`);
    events = await response.json();
    renderCalendar();
  } catch (error) {
    console.error('Error fetching events:', error);
    const mockEvents = [
        { title: 'Mock Event 1', start_date: '2023-10-01T10:00:00Z', end_date: '2023-10-01T11:00:00Z' },
        { title: 'Mock Event 2', start_date: '2023-10-02T12:00:00Z', end_date: null }
        ];
    events = mockEvents;
    renderCalendar();
  }
}

// Render the entire calendar
function renderCalendar() {
  renderTodayCard();
  renderMonthViewRibbon();
  renderAllMonthsRibbon();
}

// Format a date with specified options
function formatDate(date, options) {
  return date.toLocaleDateString('en-US', options);
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

// Get events for a specific date
function getEventsForDate(date) {
  return events.filter(event => {
    const eventDate = new Date(event.start_date);
    return isSameDay(eventDate, date);
  });
}

// Format time in a compact way
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  }).replace(/\s/g, ''); // Remove spaces
}

// Render today's card with horizontally stacked events
function renderTodayCard() {
  const todayCard = document.getElementById('todayCard');
  const today = selectedDate;
  
  const dayName = formatDate(today, { weekday: 'long' });
  const dateNum = today.getDate();
  const month = formatDate(today, { month: 'long' });
  const year = formatDate(today, { year: 'numeric' });
  
  const todayEvents = getEventsForDate(today);
  
  let eventsHTML = '';
  if (todayEvents.length > 0) {
    eventsHTML = '<div class="today-events">';
    todayEvents.forEach(event => {
      const startTime = formatTime(new Date(event.start_date));
      const endTime = event.end_date ? formatTime(new Date(event.end_date)) : '';
      
      eventsHTML += `
        <div class="event-card">
          <div class="event-time">${startTime}${endTime ? ` - ${endTime}` : ''}</div>
          <div class="event-title">${event.title}</div>
          ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
        </div>
      `;
    });
    eventsHTML += '</div>';
  } else {
    eventsHTML = '<div class="today-events"><p>No events scheduled</p></div>';
  }
  
  // Get existing card header content
  const headerContent = todayCard.querySelector('.card-header') ? 
    todayCard.querySelector('.card-header').outerHTML : 
    `<div class="card-header">
      <div class="controls">
        <button id="addEventBtn" class="icon-button">+</button>
        <button id="exportBtn" class="icon-button">↓</button>
      </div>
      <div class="battery-indicator">
        <div class="battery-level"></div>
      </div>
    </div>`;
  
  todayCard.innerHTML = `
    ${headerContent}
    <div class="today-header">
      <div class="today-date">${month} ${dateNum}, ${year}</div>
      <div class="today-day">${dayName}</div>
    </div>
    ${eventsHTML}
  `;
  
  // Reattach event listeners
  document.getElementById('addEventBtn').addEventListener('click', () => {
    document.getElementById('addEventModal').classList.add('show');
  });
  
  document.getElementById('exportBtn').addEventListener('click', exportCalendar);
}

// Render the month view ribbon (displays all days in the current month)
function renderMonthViewRibbon() {
  const monthViewRibbon = document.getElementById('monthViewRibbon');
  monthViewRibbon.innerHTML = '';
  
  // Get first day of current month
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Get number of days in current month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Create day items for each day in month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(firstDay);
    date.setDate(i);
    
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);
    const hasEvents = getEventsForDate(date).length > 0;
    
    const dayItem = document.createElement('div');
    dayItem.className = 'day-item';
    if (isSelected) dayItem.classList.add('active');
    if (hasEvents) dayItem.classList.add('has-events');
    
    dayItem.innerHTML = `
      <div class="day-number">${date.getDate()}</div>
      <div class="day-name">${formatDate(date, { weekday: 'short' })}</div>
    `;
    
    // Store date in dataset for click handler
    dayItem.dataset.date = date.toISOString();
    
    dayItem.addEventListener('click', () => {
      selectedDate = new Date(date);
      changePage(renderCalendar);
    });
    
    monthViewRibbon.appendChild(dayItem);
  }
}

// Render the all months ribbon (displays all 12 months in a single row)
function renderAllMonthsRibbon() {
  const allMonthsRibbon = document.getElementById('allMonthsRibbon');
  allMonthsRibbon.innerHTML = '';
  
  // Current year
  const currentYear = currentDate.getFullYear();
  
  // Show all 12 months
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentYear, i, 1);
    
    const isCurrentMonth = i === currentDate.getMonth();
    
    const monthItem = document.createElement('div');
    monthItem.className = 'month-item';
    if (isCurrentMonth) monthItem.classList.add('active');
    
    monthItem.innerHTML = `
      <div class="month-name">${formatDate(monthDate, { month: 'short' })}</div>
    `;
    
    // Store date in dataset
    monthItem.dataset.date = monthDate.toISOString();
    
    monthItem.addEventListener('click', () => {
      currentDate = new Date(monthDate);
      selectedDate = new Date(monthDate);
      changePage(renderCalendar);
    });
    
    allMonthsRibbon.appendChild(monthItem);
  }
}

// Helper function for calendar export
function exportCalendar() {
  try {
    fetch(`${API_URL}/export`)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calendar.ics';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  } catch (error) {
    console.error('Error exporting calendar:', error);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Fetch initial data
  fetchEvents();
  
  // Today button
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date();
    changePage(renderCalendar);
  });
  
  // Manual refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    simulateEinkRefresh(() => {
      fetchEvents();
    });
  });
  
  // Add event modal
  const modal = document.getElementById('addEventModal');
  
  document.getElementById('addEventBtn').addEventListener('click', () => {
    modal.classList.add('show');
  });
  
  document.getElementById('closeModal').addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  // Add event form
  document.getElementById('addEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const event = {
      title: document.getElementById('eventTitle').value,
      description: document.getElementById('eventDescription').value,
      start_date: new Date(document.getElementById('eventStart').value).toISOString(),
      end_date: document.getElementById('eventEnd').value ? 
          new Date(document.getElementById('eventEnd').value).toISOString() : null
    };
    
    try {
      await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      document.getElementById('addEventForm').reset();
      modal.classList.remove('show');
      
      simulateEinkRefresh(() => {
        fetchEvents();
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  });
});