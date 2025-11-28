/**
 * Lazy Load Videos with Intersection Observer
 *
 * This script uses the Intersection Observer API to detect when video elements
 * with the data-lazy attribute enter the viewport, then loads and plays them.
 * This improves initial page load performance by deferring video loading.
 */

(function() {
  'use strict';

  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without Intersection Observer support
    // Simply autoplay all lazy videos immediately
    console.warn('Intersection Observer not supported, loading all videos immediately');
    const lazyVideos = document.querySelectorAll('video[data-lazy]');
    lazyVideos.forEach(video => {
      loadVideo(video);
    });
    return;
  }

  // Configuration for the Intersection Observer
  const observerOptions = {
    root: null, // Use viewport as root
    rootMargin: '200px', // Start loading 200px before video enters viewport
    threshold: 0.01 // Trigger when at least 1% of the video is visible
  };

  // Callback function when a video enters the viewport
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        loadVideo(video);
        // Stop observing this video once it's loaded
        observer.unobserve(video);
      }
    });
  };

  // Function to load and play a video
  function loadVideo(video) {
    // Get the video source URL and type from data attributes
    const videoSrc = video.getAttribute('data-src');
    const videoType = video.getAttribute('data-type');

    console.log('loadVideo called for:', {
      videoSrc,
      videoType,
      hasDataLazy: video.hasAttribute('data-lazy'),
      currentSrc: video.currentSrc,
      readyState: video.readyState
    });

    if (!videoSrc) {
      console.warn('Video has no data-src attribute:', video);
      return;
    }

    // Create a source element
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = videoType || 'video/mp4'; // Default to mp4 if type not specified

    // Append the source to the video element
    video.appendChild(source);

    // Remove the data-lazy attribute
    video.removeAttribute('data-lazy');

    // Load the video
    video.load();

    console.log('Called video.load() for:', videoSrc);

    // Add event listener to see when video actually starts loading
    video.addEventListener('loadstart', () => {
      console.log('VIDEO LOADSTART:', videoSrc);
    });

    video.addEventListener('loadeddata', () => {
      console.log('VIDEO LOADED:', videoSrc);
    });

    video.addEventListener('error', (e) => {
      console.error('VIDEO ERROR:', videoSrc, e);
    });

    // Start playing the video once it's ready
    const playPromise = video.play();

    // Handle play promise (modern browsers return a promise)
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Video playing successfully:', videoSrc);
      }).catch(error => {
        // Auto-play was prevented, which is fine for muted videos
        // User interaction may be required on some platforms
        console.log('Video autoplay prevented:', videoSrc, error);
      });
    }
  }

  // Create the Intersection Observer
  const videoObserver = new IntersectionObserver(observerCallback, observerOptions);

  // Find all videos with data-lazy attribute and observe them
  const lazyVideos = document.querySelectorAll('video[data-lazy]');

  lazyVideos.forEach(video => {
    videoObserver.observe(video);
  });

  // Log how many videos are being lazy loaded
  console.log(`Lazy loading ${lazyVideos.length} videos`);

})();
