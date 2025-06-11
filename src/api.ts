import { ApiResponse, ChatAttachment } from './types';

const API_URL = 'https://suxr2ydt.rpcl.host/api/v1/workspace/okulyapayzeka/chat';
const API_KEY = import.meta.env.VITE_API_KEY;

export class ChatApiError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ChatApiError';
  }
}

export const sendChatMessage = async (
  message: string, 
  mode: 'query' | 'chat' = 'chat',
  sessionId: string = 'user-session-1',
  attachments?: ChatAttachment[],
  reset: boolean = false
): Promise<ApiResponse> => {
  try {
    // API anahtarı kontrolü
    if (!API_KEY) {
      throw new ChatApiError('API anahtarı bulunamadı. Lütfen .env dosyasında VITE_API_KEY değişkenini ayarlayın.');
    }

    const requestBody: any = {
      message,
      mode,
      sessionId,
      reset
    };

    // Sadece attachments varsa ve içeriği varsa ekle
    if (attachments && attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    console.log('📤 API isteği gönderiliyor:', {
      url: API_URL,
      method: 'POST',
      body: {
        ...requestBody,
        // Güvenlik için attachment içeriğini loglamıyoruz
        attachments: attachments ? `${attachments.length} dosya` : undefined
      }
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 API yanıtı alındı:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorMessage = `API yanıt hatası: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ API hata detayları:', errorData);
        
        if (response.status === 403) {
          if (errorData.error === 'No valid api key found.' || errorData.message === 'Invalid API Key') {
            errorMessage = 'Geçersiz API anahtarı. Lütfen API anahtarınızı kontrol edin ve .env dosyasında VITE_API_KEY değişkenini doğru şekilde ayarlayın.';
          } else {
            errorMessage = 'API erişimi reddedildi. Lütfen yetkilendirme bilgilerinizi kontrol edin.';
          }
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Geçersiz istek. Lütfen gönderdiğiniz verileri kontrol edin.';
        } else if (response.status === 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('❌ Hata yanıtı ayrıştırılamadı:', parseError);
        // Varsayılan hata mesajını kullan
      }

      throw new ChatApiError(errorMessage, { 
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log('✅ API başarılı yanıt:', {
      id: data.id,
      type: data.type,
      textResponseLength: data.textResponse?.length || 0,
      sourcesCount: data.sources?.length || 0,
      hasError: !!data.error
    });
    
    // API dokümantasyonuna göre error kontrolü
    if (data.error && data.error !== 'null' && data.error !== null) {
      throw new ChatApiError(data.error, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ChatApiError) {
      throw error;
    }
    
    // Ağ hatalarını yakala
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ChatApiError('Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.', error);
    }
    
    console.error('❌ Beklenmeyen hata:', error);
    throw new ChatApiError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', error);
  }
};