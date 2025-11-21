// Holiday Service - Async, non-blocking with timeout and circuit breaker
class HolidayService {
  constructor() {
    this.primaryAPI = 'https://date.nager.at/api/v3';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.requestTimeout = 5000; // 5 seconds timeout
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: null,
      threshold: 3,
      resetTimeout: 60000 // 1 minute
    };
  }

  // Check if circuit breaker should block requests
  isCircuitOpen() {
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < this.circuitBreaker.resetTimeout) {
        return true;
      } else {
        // Reset circuit breaker
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.lastFailureTime = null;
      }
    }
    return false;
  }

  // Record API failure
  recordFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
  }

  // Reset circuit breaker on success
  recordSuccess() {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = null;
  }

  // Get cache key for holidays
  getCacheKey(countryCode, year) {
    return `holidays_${countryCode}_${year}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < this.cacheExpiry);
  }

  // Create a timeout promise
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  // Fetch holidays with timeout and circuit breaker
  async fetchHolidaysWithTimeout(countryCode, year) {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      console.log('Circuit breaker is open, skipping API call');
      throw new Error('Circuit breaker is open');
    }

    const fetchPromise = fetch(`${this.primaryAPI}/PublicHolidays/${year}/${countryCode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add signal for abort capability
      signal: AbortSignal.timeout ? AbortSignal.timeout(this.requestTimeout) : undefined
    });

    const timeoutPromise = this.createTimeoutPromise(this.requestTimeout);

    try {
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const holidays = await response.json();
      this.recordSuccess();
      return holidays;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  // Fetch holidays for a specific country and year
  async fetchHolidays(countryCode, year) {
    const cacheKey = this.getCacheKey(countryCode, year);
    const cachedData = this.cache.get(cacheKey);

    if (this.isCacheValid(cachedData)) {
      console.log(`Using cached holidays for ${countryCode} ${year}`);
      return Promise.resolve(cachedData.data);
    }

    try {
      console.log(`Fetching holidays for ${countryCode} ${year} with timeout`);
      const holidays = await this.fetchHolidaysWithTimeout(countryCode, year);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: holidays,
        timestamp: Date.now()
      });

      return holidays;
    } catch (error) {
      console.warn(`API failed for ${countryCode}, using fallback:`, error.message);
      // Return fallback data immediately
      const fallbackHolidays = this.getComprehensiveFallbackHolidays(countryCode, year);
      
      // Cache fallback data for shorter time
      this.cache.set(cacheKey, {
        data: fallbackHolidays,
        timestamp: Date.now() - (this.cacheExpiry - 60 * 60 * 1000) // Expire in 1 hour
      });
      
      return fallbackHolidays;
    }
  }

  // Get comprehensive fallback holidays - immediate, no async
  getComprehensiveFallbackHolidays(countryCode, year) {
    const fallbackHolidays = {
      'US': [
        { date: `${year}-01-01`, localName: 'New Year\'s Day', name: 'New Year\'s Day', countryCode: 'US' },
        { date: `${year}-01-15`, localName: 'Martin Luther King Jr. Day', name: 'Martin Luther King Jr. Day', countryCode: 'US' },
        { date: `${year}-02-19`, localName: 'Presidents\' Day', name: 'Presidents\' Day', countryCode: 'US' },
        { date: `${year}-05-27`, localName: 'Memorial Day', name: 'Memorial Day', countryCode: 'US' },
        { date: `${year}-07-04`, localName: 'Independence Day', name: 'Independence Day', countryCode: 'US' },
        { date: `${year}-09-02`, localName: 'Labor Day', name: 'Labor Day', countryCode: 'US' },
        { date: `${year}-11-28`, localName: 'Thanksgiving Day', name: 'Thanksgiving Day', countryCode: 'US' },
        { date: `${year}-12-25`, localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'US' }
      ],
      'IN': [
        { date: `${year}-01-01`, localName: 'New Year\'s Day', name: 'New Year\'s Day', countryCode: 'IN' },
        { date: `${year}-01-26`, localName: 'Republic Day', name: 'Republic Day', countryCode: 'IN' },
        { date: `${year}-03-08`, localName: 'Holi', name: 'Holi', countryCode: 'IN' },
        { date: `${year}-08-15`, localName: 'Independence Day', name: 'Independence Day', countryCode: 'IN' },
        { date: `${year}-10-02`, localName: 'Gandhi Jayanti', name: 'Gandhi Jayanti', countryCode: 'IN' },
        { date: `${year}-10-24`, localName: 'Dussehra', name: 'Dussehra', countryCode: 'IN' },
        { date: `${year}-11-12`, localName: 'Diwali', name: 'Diwali', countryCode: 'IN' },
        { date: `${year}-12-25`, localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'IN' }
      ],
      'SG': [
        { date: `${year}-01-01`, localName: 'New Year\'s Day', name: 'New Year\'s Day', countryCode: 'SG' },
        { date: `${year}-02-10`, localName: 'Chinese New Year', name: 'Chinese New Year', countryCode: 'SG' },
        { date: `${year}-04-10`, localName: 'Hari Raya Puasa', name: 'Hari Raya Puasa', countryCode: 'SG' },
        { date: `${year}-05-01`, localName: 'Labour Day', name: 'Labour Day', countryCode: 'SG' },
        { date: `${year}-08-09`, localName: 'National Day', name: 'National Day', countryCode: 'SG' },
        { date: `${year}-10-31`, localName: 'Deepavali', name: 'Deepavali', countryCode: 'SG' },
        { date: `${year}-12-25`, localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'SG' }
      ]
    };

    return fallbackHolidays[countryCode] || [];
  }

  // Get holidays for multiple countries - async with proper error handling
  async getAllHolidays(year) {
    const countries = ['US', 'IN', 'SG'];
    console.log(`Loading holidays for all countries for year ${year}`);
    
    // Use Promise.allSettled to handle failures gracefully
    const holidayPromises = countries.map(async (country) => {
      try {
        const holidays = await this.fetchHolidays(country, year);
        return { country, holidays, status: 'fulfilled' };
      } catch (error) {
        console.error(`Failed to fetch holidays for ${country}:`, error);
        // Return fallback immediately on error
        const fallbackHolidays = this.getComprehensiveFallbackHolidays(country, year);
        return { country, holidays: fallbackHolidays, status: 'rejected', error: error.message };
      }
    });

    try {
      const results = await Promise.allSettled(holidayPromises);
      const holidaysByCountry = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { country, holidays } = result.value;
          holidaysByCountry[country] = holidays;
          console.log(`Loaded ${holidays.length} holidays for ${country}`);
        } else {
          console.error('Promise rejected:', result.reason);
        }
      });

      // Ensure all countries have data (fallback if needed)
      countries.forEach(country => {
        if (!holidaysByCountry[country]) {
          holidaysByCountry[country] = this.getComprehensiveFallbackHolidays(country, year);
          console.log(`Using fallback holidays for ${country}`);
        }
      });

      return holidaysByCountry;
    } catch (error) {
      console.error('Error in getAllHolidays:', error);
      // Return complete fallback for all countries
      const fallbackData = {};
      countries.forEach(country => {
        fallbackData[country] = this.getComprehensiveFallbackHolidays(country, year);
      });
      return fallbackData;
    }
  }

  // Get holidays for a specific month - synchronous operation
  getHolidaysForMonth(holidaysByCountry, year, month) {
    if (!holidaysByCountry || typeof holidaysByCountry !== 'object') {
      return {};
    }

    const monthHolidays = {};
    
    Object.keys(holidaysByCountry).forEach(country => {
      const holidays = holidaysByCountry[country] || [];
      monthHolidays[country] = holidays.filter(holiday => {
        try {
          const holidayDate = new Date(holiday.date);
          return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
        } catch (error) {
          console.warn('Invalid holiday date:', holiday.date);
          return false;
        }
      });
    });

    return monthHolidays;
  }

  // Calculate sprint impact - synchronous operation
  calculateSprintImpact(holidays, releases, month, year) {
    if (!holidays || !releases || !Array.isArray(releases)) {
      return {};
    }

    const impact = {};
    const countries = ['US', 'IN', 'SG'];
    
    countries.forEach(country => {
      const countryHolidays = holidays[country] || [];
      const holidayCount = countryHolidays.length;
      
      if (holidayCount > 0) {
        // Find releases that overlap with this month
        const affectedReleases = releases.filter(release => {
          try {
            const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
            const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
            
            return (workStart.getFullYear() === year && workStart.getMonth() === month) ||
                   (workEnd.getFullYear() === year && workEnd.getMonth() === month) ||
                   (workStart <= new Date(year, month, 1) && workEnd >= new Date(year, month + 1, 0));
          } catch (error) {
            console.warn('Invalid release date:', release);
            return false;
          }
        });

        impact[country] = {
          holidayCount,
          holidays: countryHolidays,
          affectedReleases: affectedReleases,
          workdaysLost: this.calculateWorkdaysLost(countryHolidays),
          severity: holidayCount >= 3 ? 'high' : holidayCount >= 2 ? 'medium' : 'low'
        };
      }
    });

    return impact;
  }

  // Calculate workdays lost - synchronous
  calculateWorkdaysLost(holidays) {
    if (!Array.isArray(holidays)) {
      return 0;
    }

    return holidays.filter(holiday => {
      try {
        const date = new Date(holiday.date);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends
      } catch (error) {
        return false;
      }
    }).length;
  }

  // Utility methods
  getCountryFlag(countryCode) {
    const flags = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'SG': '🇸🇬'
    };
    return flags[countryCode] || '🏁';
  }

  getCountryName(countryCode) {
    const names = {
      'US': 'United States',
      'IN': 'India',
      'SG': 'Singapore'
    };
    return names[countryCode] || countryCode;
  }

  // Get circuit breaker status
  getCircuitBreakerStatus() {
    return {
      isOpen: this.isCircuitOpen(),
      failureCount: this.circuitBreaker.failureCount,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      threshold: this.circuitBreaker.threshold
    };
  }

  // Reset circuit breaker manually
  resetCircuitBreaker() {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = null;
    console.log('Circuit breaker manually reset');
  }
}

export default new HolidayService();