// frontend/lib/services/pricing-service.ts

import { ServiceCard } from '../types';
import api from '../api-client';

interface GetPricingParams {
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike';
}

interface PricingResponse {
  status: string;
  data: ServiceCard[];
}

/**
 * Fetch pricing data for all services based on vehicle type
 * @param params - Parameters for the request
 * @returns Promise with pricing data
 */
export async function getPricing(params: GetPricingParams): Promise<PricingResponse> {
  const { vehicleType } = params;

  // Retry logic for failed pricing requests
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Call the backend API to get real pricing data
      const response = await api.get(`/pricing?vehicle_type=${vehicleType}`);

      const data = response.data;

      // Transform the API response to match the ServiceCard interface
      if (data.status === 'success' && Array.isArray(data.data)) {
        const transformedData = data.data.map((item: any) => ({
          serviceId: item.serviceId || item.service_id || item.id,
          serviceName: item.serviceName || item.name,
          serviceSlug: item.serviceSlug || item.slug,
          category: item.category,
          price: item.price || item.prices?.[vehicleType] || 0,
          description: item.description,
          icon: item.icon,
          isSelected: item.isSelected || false
        }));

        return {
          status: data.status,
          data: transformedData
        };
      } else {
        throw new Error('Invalid response format from pricing API');
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed to fetch pricing:`, error);
      lastError = error as Error;

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // 1s, 2s, 4s
      }
    }
  }

  // If all retries failed, throw the last error
  if (lastError) {
    console.error('All attempts failed to fetch pricing:', lastError);
    throw new Error(`Failed to fetch pricing data after ${maxRetries} attempts: ${lastError.message}`);
  }

  // This line should never be reached due to the throw above, but TypeScript needs it
  throw new Error('Unexpected error in getPricing function');
}

/**
 * Confirm service selections and prepare for next step
 * @param payload - Service selection payload
 * @returns Promise with confirmation result
 */
export async function confirmSelections(payload: {
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike';
  serviceIds: string[];
  subtotal: number;
}): Promise<{ status: string; data: { confirmationId: string; nextStepUrl: string; subtotal: number } }> {
  try {
    // In a real implementation, this would call the backend API
    // const response = await fetch('/api/v1/selection/confirm', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // });
    // const data = await response.json();

    // For now, returning mock data that matches the API specification
    return {
      status: 'success',
      data: {
        confirmationId: `conf_${Date.now()}`,
        nextStepUrl: '/checkout',
        subtotal: payload.subtotal
      }
    };
  } catch (error) {
    console.error('Error confirming selections:', error);
    throw new Error(`Failed to confirm selections: ${error}`);
  }
}