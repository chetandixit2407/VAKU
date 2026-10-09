export function formatDateTime(isoString?: string): { date: string; time: string; full: string; toString: () => string } {
  if (!isoString) {
    return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded', toString() { return 'Not Recorded'; } };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded', toString() { return 'Not Recorded'; } };
    }
    const date = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return {
      date,
      time,
      full: `${date} at ${time}`,
      toString() {
        return `${date} at ${time}`;
      },
    };
  } catch {
    return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded', toString() { return 'Not Recorded'; } };
  }
}

/**
 * Formats an ISO 8601 timestamp for authoritative display:
 * Example: "09 Oct 2026, 03:45:22 PM IST"
 */
export function formatPhotoTimestamp(isoString?: string): string {
  if (!isoString) return 'Not Recorded';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Not Recorded';

    const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    let tzStr = 'IST';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !tz.includes('Calcutta') && !tz.includes('Kolkata') && !tz.includes('Asia/Kolkata')) {
        const shortName = d.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
        if (shortName && shortName !== time) {
          tzStr = shortName;
        }
      }
    } catch {
      tzStr = 'IST';
    }

    return `${day} ${month} ${year}, ${time} ${tzStr}`;
  } catch {
    return 'Not Recorded';
  }
}

