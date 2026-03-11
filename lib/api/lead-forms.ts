import axios from 'axios';
import { API } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/config';
import type { LeadForm, SubmitLeadInput, LeadFormResponse } from '@/types/lead-forms';
import type { LeadResponse } from '@/types/leads';

const terminalFetch = axios.create({
  baseURL: API.BASE_URL,
  withCredentials: true,
});

/**
 * Fetch the Lead Form configuration for a chatbot.
 * GET /lead-forms/:chatbotId
 */
export async function getLeadFormConfig(chatbotId: string): Promise<LeadForm | null> {
    const endpoint = API.ENDPOINTS.TERMINAL.LEAD_FORMS.GET_CONFIG(chatbotId);

    try {
        const res = await axios.get<ApiResponse<LeadForm, Error>>(API.BASE_URL + endpoint);

        if (!res.data.success) {
            console.warn('[LeadForm] Failed to fetch config:', res.data.message);
            return null;
        }

        return res.data.data;
    } catch (error) {
        console.error('[LeadForm] Error fetching config:', error);
        return null;
    }
}

/**
 * Submit a lead form response.
 * POST /lead-forms/submit
 */
export async function submitLeadForm(input: SubmitLeadInput): Promise<LeadResponse> {
    const endpoint = API.ENDPOINTS.TERMINAL.LEAD_FORMS.SUBMIT();

    try {
        const res = await terminalFetch.post<ApiResponse<LeadResponse, Error>>(endpoint, input);

        if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to submit form');
        }

        return res.data.data;
    } catch (error) {
        console.error('[LeadForm] Error submitting form:', error);
        throw error;
    }
}
