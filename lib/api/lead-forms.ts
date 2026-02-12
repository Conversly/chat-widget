import axios from 'axios';
import { API } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/config';
import type { LeadForm, SubmitLeadInput, LeadFormResponse } from '@/types/lead-forms';
import { leadsFetch, CreateLeadResponse } from './leads';

/**
 * Fetch the Lead Form configuration for a chatbot.
 * GET /lead-forms/:chatbotId
 */
export async function getLeadFormConfig(chatbotId: string): Promise<LeadForm | null> {
    const endpoint = `${API.BASE_URL}/lead-forms/${chatbotId}`;

    try {
        const res = await axios.get<ApiResponse<LeadForm, Error>>(endpoint);

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
export async function submitLeadForm(input: SubmitLeadInput): Promise<CreateLeadResponse> {
    const endpoint = `${API.BASE_URL}/lead-forms/submit`;

    try {
        // We can reuse the leadsFetch instance if it has the right config, 
        // or just use axios directly if it's a public endpoint (which it likely is for the widget).
        // Using leadsFetch to be consistent if it adds credentials/headers needed.
        // However, leadsFetch is configured in leads.ts. Let's use that or a new instance.
        // The endpoint is public usually, typically secured by chatbotId or a token if needed.
        // Based on user request "Auth: Public (or Widget Token)", standard axios is fine, 
        // but let's check if leadsFetch has interceptors we need. 
        // leadsFetch has `withCredentials: true`. 

        const res = await leadsFetch.post<ApiResponse<CreateLeadResponse, Error>>(endpoint, input);

        if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to submit form');
        }

        return res.data.data;
    } catch (error) {
        console.error('[LeadForm] Error submitting form:', error);
        throw error;
    }
}
