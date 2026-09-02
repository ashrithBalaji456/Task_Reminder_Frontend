import { apiClient } from './axios';
import { ApiResponse } from '../types';

export interface PushSubscriptionRequest {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}

export const pushApi = {
  getVapidPublicKey: async (): Promise<string> => {
    const res = await apiClient.get<ApiResponse<{ publicKey: string }>>('/push-subscriptions/vapid-public-key');
    return res.data.data.publicKey;
  },

  registerSubscription: async (subscription: PushSubscriptionRequest): Promise<void> => {
    await apiClient.post<ApiResponse<any>>('/push-subscriptions', subscription);
  },

  unsubscribe: async (endpoint: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>('/push-subscriptions', {
      params: { endpoint },
    });
  },
};
