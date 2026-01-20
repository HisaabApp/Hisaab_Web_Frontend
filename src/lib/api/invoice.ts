/**
 * Invoice API Service
 * Handles invoice generation and download
 */

import client from './client';

/**
 * Download invoice PDF for a customer's unpaid expenses
 */
export const downloadCustomerInvoice = async (customerId: string) => {
  try {
    const response = await client.get(`/invoices/customer/${customerId}`, {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${customerId}-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    
    return { success: true };
  } catch (error: any) {
    console.error('Download invoice error:', error);
    throw error?.response?.data || { message: 'Failed to download invoice' };
  }
};

/**
 * Download invoice PDF for a specific month
 */
export const downloadMonthlyInvoice = async (
  customerId: string,
  year: number,
  month: number
) => {
  try {
    const response = await client.get(
      `/invoices/customer/${customerId}/month/${year}/${month}`,
      {
        responseType: 'blob',
      }
    );
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${customerId}-${year}-${month}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    
    return { success: true };
  } catch (error: any) {
    console.error('Download monthly invoice error:', error);
    throw error?.response?.data || { message: 'Failed to download invoice' };
  }
};
