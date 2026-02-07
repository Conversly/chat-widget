// ============================================================================
// Input Types
// ============================================================================

export interface CreateLeadInput {
    chatbotId: string;
    conversationId: string;
    name: string;
    email: string;
    phoneNumber: string;
    source: 'WIDGET' | 'WHATSAPP' | 'VOICE' | 'SMS';
    topicId?: string;
  }
  
  // ============================================================================
  // Response Types
  // ============================================================================
  
  export interface LeadResponse {
    id: string;
    chatbotId: string;
    conversationId: string;
    name: string;
    email: string;
    phoneNumber: string;
    source: string;
    topicId: string | null;
    topicName: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }