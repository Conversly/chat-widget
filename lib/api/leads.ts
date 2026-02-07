import axios from 'axios';
import { API } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/config';
import type { CreateLeadInput, LeadResponse } from '@/types/leads';

export type CreateLeadResponse = LeadResponse;

export const leadsFetch = axios.create({
	baseURL: API.BASE_URL,
	withCredentials: true,
});

/**
 * Create a lead (terminal service).
 * POST /leads
 *
 * Note: topic is intentionally left empty for now (topicId omitted).
 */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResponse> {
	const endpoint = API.ENDPOINTS.TERMINAL.LEADS.BASE_URL();

	const res = await leadsFetch.post<ApiResponse<CreateLeadResponse, Error>>(endpoint, {
		chatbotId: input.chatbotId,
		conversationId: input.conversationId,
		name: input.name,
		email: input.email,
		phoneNumber: input.phoneNumber,
		source: input.source,
		// topicId: intentionally omitted for now
	});

	if (!res.data.success) {
		throw new Error(res.data.message || 'Failed to create lead');
	}

	return res.data.data;
}

