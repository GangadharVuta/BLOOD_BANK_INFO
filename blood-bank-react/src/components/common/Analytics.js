import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    trackPageView(location.pathname + location.search);

    // Track user engagement
    const trackEngagement = () => {
      const timeSpent = Date.now() - window.pageLoadTime;
      trackEvent('engagement', 'time_spent', Math.floor(timeSpent / 1000));
    };

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      trackEngagement();
    };

    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('engagement', 'tab_hidden');
      } else {
        trackEvent('engagement', 'tab_visible');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location]);

  // Track clicks on important elements
  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;

      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button.textContent.trim() || button.getAttribute('aria-label') || 'Unknown Button';
        trackEvent('interaction', 'button_click', buttonText);
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          trackEvent('navigation', 'link_click', href);
        }
      }

      // Track form submissions
      if (target.tagName === 'FORM' || target.closest('form')) {
        const form = target.tagName === 'FORM' ? target : target.closest('form');
        if (event.type === 'submit') {
          trackEvent('form', 'submit', form.getAttribute('name') || 'unknown_form');
        }
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleClick);
    };
  }, []);

  return null; // This component doesn't render anything
};

// Analytics tracking functions
const trackPageView = (pagePath) => {
  const analyticsData = {
    event: 'page_view',
    page: pagePath,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  // Store in localStorage for development/demo purposes
  // In production, this would be sent to an analytics service
  storeAnalyticsData(analyticsData);

  // Log to console for development
  console.log('📊 Page View Tracked:', analyticsData);
};

const trackEvent = (category, action, label = null, value = null) => {
  const analyticsData = {
    event: 'user_event',
    category,
    action,
    label,
    value,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    userId: localStorage.getItem('userId') || 'anonymous'
  };

  storeAnalyticsData(analyticsData);

  // Log to console for development
  console.log('📊 Event Tracked:', analyticsData);
};

// Store analytics data (in production, send to server)
const storeAnalyticsData = (data) => {
  try {
    const existingData = JSON.parse(localStorage.getItem('analytics') || '[]');
    existingData.push(data);

    // Keep only last 100 events to prevent localStorage bloat
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }

    localStorage.setItem('analytics', JSON.stringify(existingData));
  } catch (error) {
    console.warn('Failed to store analytics data:', error);
  }
};

// Performance monitoring
const trackPerformance = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        const performanceData = {
          event: 'performance',
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
          timestamp: new Date().toISOString()
        };

        storeAnalyticsData(performanceData);
        console.log('⚡ Performance Tracked:', performanceData);
      }, 0);
    });
  }
};

// Initialize performance tracking
trackPerformance();

// Error tracking
window.addEventListener('error', (event) => {
  trackEvent('error', 'javascript_error', `${event.message} at ${event.filename}:${event.lineno}`);
});

window.addEventListener('unhandledrejection', (event) => {
  trackEvent('error', 'unhandled_promise_rejection', event.reason);
});

export default Analytics;