/**
 * Report Service
 * API calls for report generation
 */

import apiClient from '../client';

/**
 * Download comprehensive Excel report
 * Returns the file as a blob for download
 */
export async function downloadExcelReport(): Promise<void> {
  try {
    const response = await apiClient.get('/reports/excel', {
      responseType: 'blob',
    });

    // Create blob from response
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Generate filename with date
    const filename = `HisaabApp_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error downloading Excel report:', error);
    throw new Error('Failed to download report. Please try again.');
  }
}
