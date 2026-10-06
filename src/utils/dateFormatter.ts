export function formatDateTime(isoString?: string): { date: string; time: string; full: string } {
  if (!isoString) {
    return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded' };
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
    return { date, time, full: `${date} at ${time}` };
  } catch {
    return { date: 'Not Recorded', time: 'N/A', full: 'Not Recorded' };
  }
}
