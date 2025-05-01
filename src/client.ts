import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { 
  WhatsAppConfig, 
  WhatsAppContact, 
  WhatsAppMessage, 
  MediaMessageOptions,
  TemplateMessageOptions,
  InteractiveMessageOptions,
  LocationMessageOptions,
  GroupOptions
} from './types';

// Load environment variables
dotenv.config();

/**
 * WhatsApp Cloud API Client
 * Handles all interactions with the WhatsApp Cloud API
 */
export class WhatsAppClient {
  private apiInstance: AxiosInstance;
  private config: WhatsAppConfig;
  private messageCache: Map<string, any> = new Map();
  private contactCache: Map<string, any> = new Map();
  
  /**
   * Create a new WhatsApp Cloud API client
   * @param config Configuration options for WhatsApp Cloud API
   */
  constructor(config?: WhatsAppConfig) {
    // Set default config values from environment or defaults
    this.config = {
      apiVersion: config?.apiVersion || process.env.WHATSAPP_API_VERSION || 'v17.0',
      apiToken: config?.apiToken || process.env.WHATSAPP_API_TOKEN,
      phoneNumberId: config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: config?.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      cacheMessageSeconds: config?.cacheMessageSeconds || Number(process.env.CACHE_MESSAGE_SECONDS || '300'),
      cacheContactSeconds: config?.cacheContactSeconds || Number(process.env.CACHE_CONTACT_SECONDS || '3600'),
      requestTimeout: config?.requestTimeout || Number(process.env.DEFAULT_REQUEST_TIMEOUT || '30000')
    };
    
    // Validate required configuration
    if (!this.config.apiToken) {
      throw new Error('WhatsApp API token is required');
    }
    
    if (!this.config.phoneNumberId) {
      throw new Error('WhatsApp phone number ID is required');
    }
    
    // Initialize the API client
    this.apiInstance = axios.create({
      baseURL: `https://graph.facebook.com/${this.config.apiVersion}`,
      timeout: this.config.requestTimeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Check if the client is configured properly
   * @returns True if API token and phone number ID are set
   */
  isConfigured(): boolean {
    return !!(this.config.apiToken && this.config.phoneNumberId);
  }
  
  /**
   * Send a text message
   * @param to Recipient phone number with country code
   * @param message Text message to send
   * @returns Promise with the message ID if successful
   */
  async sendMessage(to: string, message: string): Promise<string> {
    const formattedNumber = this.formatPhoneNumber(to);
    
    try {
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedNumber,
          type: 'text',
          text: {
            body: message
          }
        }
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0].id;
      }
      
      return '';
    } catch (error) {
      this.handleApiError('Error sending message', error);
      throw error;
    }
  }
  
  /**
   * Send a template message
   * @param options Template message options
   * @returns Promise with the message ID if successful
   */
  async sendTemplateMessage(options: TemplateMessageOptions): Promise<string> {
    const formattedNumber = this.formatPhoneNumber(options.to);
    
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'template',
        template: {
          name: options.templateName,
          language: {
            code: options.language
          }
        }
      };
      
      // Add components if provided
      if (options.components && options.components.length > 0) {
        payload.template.components = options.components;
      }
      
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0].id;
      }
      
      return '';
    } catch (error) {
      this.handleApiError('Error sending template message', error);
      throw error;
    }
  }
  
  /**
   * Send a media message
   * @param options Media message options
   * @returns Promise with the message ID if successful
   */
  async sendMedia(options: MediaMessageOptions): Promise<string> {
    const formattedNumber = this.formatPhoneNumber(options.to);
    const mediaType = options.type.toLowerCase();
    
    try {
      let mediaId: string | undefined = undefined;
      
      // Upload media if a file path is provided
      if (options.filePath) {
        mediaId = await this.uploadMedia(options.filePath);
      }
      
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: mediaType
      };
      
      // Set media object based on provided options
      if (mediaId) {
        payload[mediaType] = { id: mediaId };
      } else if (options.url) {
        payload[mediaType] = { link: options.url };
      } else {
        throw new Error('Either filePath or url must be provided');
      }
      
      // Add caption if provided
      if (options.caption) {
        payload[mediaType].caption = options.caption;
      }
      
      // Add filename for documents
      if (mediaType === 'document' && options.filename) {
        payload[mediaType].filename = options.filename;
      }
      
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0].id;
      }
      
      return '';
    } catch (error) {
      this.handleApiError('Error sending media message', error);
      throw error;
    }
  }
  
  /**
   * Send an interactive message (buttons, lists)
   * @param options Interactive message options
   * @returns Promise with the message ID if successful
   */
  async sendInteractiveMessage(options: InteractiveMessageOptions): Promise<string> {
    const formattedNumber = this.formatPhoneNumber(options.to);
    
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'interactive',
        interactive: {
          type: options.type,
          body: options.body
        }
      };
      
      // Add header if provided
      if (options.header) {
        payload.interactive.header = options.header;
      }
      
      // Add footer if provided
      if (options.footer) {
        payload.interactive.footer = options.footer;
      }
      
      // Add action content
      payload.interactive.action = options.action;
      
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0].id;
      }
      
      return '';
    } catch (error) {
      this.handleApiError('Error sending interactive message', error);
      throw error;
    }
  }
  
  /**
   * Send a location message
   * @param options Location message options
   * @returns Promise with the message ID if successful
   */
  async sendLocation(options: LocationMessageOptions): Promise<string> {
    const formattedNumber = this.formatPhoneNumber(options.to);
    
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'location',
        location: {
          latitude: options.latitude,
          longitude: options.longitude
        }
      };
      
      // Add name if provided
      if (options.name) {
        payload.location.name = options.name;
      }
      
      // Add address if provided
      if (options.address) {
        payload.location.address = options.address;
      }
      
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0].id;
      }
      
      return '';
    } catch (error) {
      this.handleApiError('Error sending location message', error);
      throw error;
    }
  }
  
  /**
   * Mark a message as read
   * @param messageId ID of the message to mark as read
   * @returns Promise with success status
   */
  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      await this.apiInstance.post(
        `/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        }
      );
      
      return true;
    } catch (error) {
      this.handleApiError('Error marking message as read', error);
      throw error;
    }
  }
  
  /**
   * Get business profile information
   * @returns Promise with business profile information
   */
  async getBusinessProfile(): Promise<any> {
    try {
      const response = await this.apiInstance.get(
        `/${this.config.phoneNumberId}/whatsapp_business_profile`
      );
      
      return response.data.data[0] || {};
    } catch (error) {
      this.handleApiError('Error getting business profile', error);
      throw error;
    }
  }
  
  /**
   * Update business profile information
   * @param profileData Profile data to update
   * @returns Promise with success status
   */
  async updateBusinessProfile(profileData: any): Promise<boolean> {
    try {
      await this.apiInstance.patch(
        `/${this.config.phoneNumberId}/whatsapp_business_profile`,
        {
          messaging_product: 'whatsapp',
          ...profileData
        }
      );
      
      return true;
    } catch (error) {
      this.handleApiError('Error updating business profile', error);
      throw error;
    }
  }
  
  /**
   * Upload media to WhatsApp servers
   * @param filePath Path to the media file
   * @returns Promise with media ID
   */
  async uploadMedia(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    try {
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('file', fs.createReadStream(filePath));
      
      const response = await this.apiInstance.post(
        `/${this.config.phoneNumberId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders()
          }
        }
      );
      
      if (response.data && response.data.id) {
        return response.data.id;
      }
      
      throw new Error('Failed to upload media: No media ID received');
    } catch (error) {
      this.handleApiError('Error uploading media', error);
      throw error;
    }
  }
  
  /**
   * Get media URL from media ID
   * @param mediaId Media ID
   * @returns Promise with media URL
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await this.apiInstance.get(`/${mediaId}`);
      
      if (response.data && response.data.url) {
        return response.data.url;
      }
      
      throw new Error('Failed to get media URL');
    } catch (error) {
      this.handleApiError('Error getting media URL', error);
      throw error;
    }
  }
  
  /**
   * Get contact information
   * @param phoneNumber Phone number with country code
   * @returns Promise with contact information
   */
  async getContactInfo(phoneNumber: string): Promise<WhatsAppContact> {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    // Check cache first
    const cacheKey = `contact_${formattedNumber}`;
    const cachedContact = this.contactCache.get(cacheKey);
    if (cachedContact && Date.now() - cachedContact.timestamp < this.config.cacheContactSeconds! * 1000) {
      return cachedContact.data;
    }
    
    // The Cloud API doesn't have a direct endpoint to get contact info,
    // so we'll create a basic contact object with the phone number
    const contact: WhatsAppContact = {
      id: formattedNumber,
      name: undefined,
      isBusiness: undefined,
      profilePictureUrl: undefined
    };
    
    // Cache the contact
    this.contactCache.set(cacheKey, {
      data: contact,
      timestamp: Date.now()
    });
    
    return contact;
  }
  
  /**
   * Format a phone number to standard E.164 format
   * @param phoneNumber Phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // If it already has a plus sign, assume it's in the correct format
    if (phoneNumber.startsWith('+')) {
      return phoneNumber.substring(1); // Remove the plus sign
    }
    
    // Strip any non-numeric characters
    return phoneNumber.replace(/\D/g, '');
  }
  
  /**
   * Handle API errors
   * @param message Error message prefix
   * @param error Error object
   */
  private handleApiError(message: string, error: any): void {
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      console.error(`${message} - Status code: ${statusCode}`, responseData);
      
      // Construct a more detailed error message
      let errorMsg = `${message}: HTTP ${statusCode}`;
      
      if (responseData && responseData.error) {
        const { code, message: apiMessage, error_subcode, error_user_title, error_user_msg } = responseData.error;
        
        errorMsg += ` - ${code || ''}: ${apiMessage || ''}`;
        
        if (error_subcode) {
          errorMsg += ` (subcode: ${error_subcode})`;
        }
        
        if (error_user_title || error_user_msg) {
          errorMsg += ` - ${error_user_title || ''}: ${error_user_msg || ''}`;
        }
      }
      
      throw new Error(errorMsg);
    } else {
      console.error(`${message} - Unknown error:`, error);
      throw error;
    }
  }
} 