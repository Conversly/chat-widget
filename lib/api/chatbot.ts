import axios from 'axios';
import { API } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/config';
import type { ChatbotCustomizationPartial, ChatbotCustomizationPayload } from '@/types/chatbot';

export type GetWidgetResponse = ChatbotCustomizationPayload;

export interface UpdateWidgetRequest extends ChatbotCustomizationPartial { }
export type UpdateWidgetResponse = ChatbotCustomizationPayload;

// Create axios instance for deploy/widget API
export const deployFetch = axios.create({
	baseURL: API.BASE_URL,
	withCredentials: true,
});

export const getWidgetConfig = async (chatbotId: string | number, playground?: boolean): Promise<GetWidgetResponse> => {
	const endpoint = API.ENDPOINTS.TERMINAL.DEPLOY.WIDGET_EXTERNAL();

	const res = await deployFetch.get<ApiResponse<GetWidgetResponse, Error>>(
		endpoint,
		{
			params: {
				chatbotId: String(chatbotId),
				playground: playground ? "true" : "false"
			},
			headers: {
				"x-verly-chatbot-id": String(chatbotId)
			}
		}
	);

	if (!res.data.success) {
		throw new Error(res.data.message);
	}
	return res.data.data;
};
