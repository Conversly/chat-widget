import axios from 'axios';
import { API } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/config';
import type { ChatbotCustomizationPartial, ChatbotCustomizationPayload } from '../../types/deploy';

export type GetWidgetResponse = ChatbotCustomizationPayload;

export interface UpdateWidgetRequest extends ChatbotCustomizationPartial {}
export type UpdateWidgetResponse = ChatbotCustomizationPayload;

// Create axios instance for deploy/widget API
export const deployFetch = axios.create({
	baseURL: API.BASE_URL,
	withCredentials: true,
});

export const getWidgetConfig = async (chatbotId: string | number): Promise<GetWidgetResponse> => {
	const endpoint = '/widget/external';
	const fullUrl = API.BASE_URL + API.ENDPOINTS.DEPLOY.BASE_URL() + endpoint;
	
	console.log('[Conversly] Fetching config from URL:', fullUrl, 'with chatbotId:', chatbotId);
	
	const res = await deployFetch.get<ApiResponse<GetWidgetResponse, Error>>(
		API.ENDPOINTS.DEPLOY.BASE_URL() + endpoint,
		{
			params: {
				chatbotId: String(chatbotId)
			}
		}
	);

	console.log('[Conversly] API Response:', res.data);

	if (!res.data.success) {
		throw new Error(res.data.message);
	}
	return res.data.data;
};
