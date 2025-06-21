import { WhatsAppClient } from './client';
import { 
  WhatsAppConfig, 
  WhatsAppContact, 
  WhatsAppMessage, 
  MediaMessageOptions,
  TemplateMessageOptions,
  InteractiveMessageOptions,
  LocationMessageOptions
} from './types';
import dotenv from 'dotenv';
import { ToolParameterSchema, Plugin, PluginConfig, PluginInstance, logger } from '@astreus-ai/astreus';

// Load environment variables
dotenv.config();

/**
 * WhatsApp Plugin for Astreus
 * This plugin provides WhatsApp Cloud API functionality for Astreus agents
 */
export class WhatsAppPlugin implements PluginInstance {
  public name = 'whatsapp';
  public description = 'WhatsApp Cloud API integration for Astreus agents';
  private client: WhatsAppClient | null = null;
  private whatsAppConfig: WhatsAppConfig;
  private tools: Map<string, Plugin> = new Map();
  public config: PluginConfig;

  constructor(config?: WhatsAppConfig) {
    this.whatsAppConfig = config || {
      apiVersion: process.env.WHATSAPP_API_VERSION,
      apiToken: process.env.WHATSAPP_API_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    };

    // Initialize plugin config
    this.config = {
      name: 'whatsapp',
      description: 'WhatsApp Cloud API integration for Astreus agents',
      version: '1.0.0',
      tools: []
    };

    // Initialize tools
    this.initializeTools();
  }

  /**
   * Initialize the WhatsApp client
   */
  async init(): Promise<void> {
    try {
      // Initialize client
      this.client = new WhatsAppClient(this.whatsAppConfig);
      
      // Verify client is configured properly
      if (!this.client.isConfigured()) {
        throw new Error('WhatsApp client is not properly configured. Check your API token and phone number ID.');
      }
      
      // Update tools with initialized client
      this.initializeTools();
      
      // Log a summary of tools
      this.logToolsSummary();
      
      logger.success("WhatsApp Plugin", "Initialization", 'WhatsApp Cloud API plugin initialized successfully');
    } catch (error) {
      logger.error("WhatsApp Plugin", "Initialization", 'Failed to initialize WhatsApp plugin');
      throw new Error(`WhatsApp plugin initialization failed: ${error}`);
    }
  }

  /**
   * Log a summary of the tools initialized
   */
  private logToolsSummary(): void {
    const toolNames = Array.from(this.tools.keys());
    logger.info("WhatsApp Plugin", "Tools", `Registered ${toolNames.length} tools: ${toolNames.join(', ')}`);
  }

  /**
   * Initialize tools for Astreus compatibility
   */
  private initializeTools(): void {
    // Convert chat manifests to Astreus Plugin objects
    const manifests = this.getChatManifests();
    
    for (const manifest of manifests) {
      const plugin: Plugin = {
        name: manifest.name,
        description: manifest.description,
        parameters: this.convertParameters(manifest.parameters),
        execute: async (params: Record<string, any>) => {
          // Make sure client is initialized
          if (!this.client) {
            throw new Error('WhatsApp client not initialized. Call init() first.');
          }

          // Execute the appropriate method based on the tool name
          const methodName = manifest.name.replace('whatsapp_', '');
          let result;
          
          try {
            switch (methodName) {
              case 'send_message':
                result = await this.sendMessage(params);
                break;
              case 'send_template':
                result = await this.sendTemplateMessage(params);
                break;
              case 'send_media':
                result = await this.sendMedia(params);
                break;
              case 'send_interactive':
                result = await this.sendInteractiveMessage(params);
                break;
              case 'send_location':
                result = await this.sendLocation(params);
                break;
              case 'mark_as_read':
                result = await this.markAsRead(params);
                break;
              case 'get_contact_info':
                result = await this.getContactInfo(params);
                break;
              case 'get_business_profile':
                result = await this.getBusinessProfile();
                break;
              case 'update_business_profile':
                result = await this.updateBusinessProfile(params);
                break;
              default:
                throw new Error(`Unknown method: ${methodName}`);
            }
            
            // Ensure we return a newly created object, not a reference to the input
            if (result === params) {
              if (typeof params === 'object' && params !== null) {
                result = { ...params };
              }
            }
            
            return result;
          } catch (error) {
            logger.error("WhatsApp Plugin", "Tool", `Error executing tool ${manifest.name}: ${error}`);
            if (error instanceof Error) {
              throw error;
            } else {
              throw new Error(`Error executing ${methodName}: ${error}`);
            }
          }
        }
      };

      // Add tool to the map
      this.tools.set(manifest.name, plugin);
    }

    // Update plugin config tools
    this.config.tools = Array.from(this.tools.values());
  }

  /**
   * Convert OpenAPI-style parameters to Astreus ToolParameterSchema
   */
  private convertParameters(params: any): ToolParameterSchema[] {
    const result: ToolParameterSchema[] = [];
    
    if (params && params.properties) {
      for (const [name, prop] of Object.entries<any>(params.properties)) {
        const type = prop.type as string;
        // Ensure type is one of the allowed values
        const validType = ["string", "number", "boolean", "object", "array"].includes(type) 
          ? type as "string" | "number" | "boolean" | "object" | "array"
          : "string"; // Default to string if not a valid type
          
        result.push({
          name,
          type: validType,
          description: prop.description || '',
          required: params.required?.includes(name) || false
        });
      }
    }
    
    return result;
  }

  /**
   * Get the manifests for chatbot function calls
   */
  getChatManifests() {
    return [
      {
        name: 'whatsapp_send_message',
        description: 'Send a WhatsApp text message to a contact',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number of the recipient with country code (e.g., "+1234567890")'
            },
            message: {
              type: 'string',
              description: 'Text message to send'
            }
          },
          required: ['to', 'message']
        }
      },
      {
        name: 'whatsapp_send_template',
        description: 'Send a template message to a contact',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number of the recipient with country code (e.g., "+1234567890")'
            },
            templateName: {
              type: 'string',
              description: 'Name of the template to use'
            },
            language: {
              type: 'string',
              description: 'Language code of the template (e.g., "en_US")'
            },
            components: {
              type: 'array',
              description: 'Template components containing parameters'
            }
          },
          required: ['to', 'templateName', 'language']
        }
      },
      {
        name: 'whatsapp_send_media',
        description: 'Send a media message (image, document, etc.) to a contact',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number of the recipient with country code (e.g., "+1234567890")'
            },
            type: {
              type: 'string',
              description: 'Type of media (image, document, audio, video, sticker)'
            },
            url: {
              type: 'string',
              description: 'URL to the media file'
            },
            filePath: {
              type: 'string',
              description: 'Path to the media file (alternative to URL)'
            },
            caption: {
              type: 'string',
              description: 'Optional caption for the media'
            },
            filename: {
              type: 'string',
              description: 'Filename for document type media'
            }
          },
          required: ['to', 'type']
        }
      },
      {
        name: 'whatsapp_send_interactive',
        description: 'Send an interactive message with buttons or lists',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number of the recipient with country code (e.g., "+1234567890")'
            },
            type: {
              type: 'string',
              description: 'Type of interactive message (button, list, product, product_list)'
            },
            body: {
              type: 'object',
              description: 'Body content of the message containing text'
            },
            header: {
              type: 'object',
              description: 'Optional header for the message'
            },
            footer: {
              type: 'object',
              description: 'Optional footer for the message'
            },
            action: {
              type: 'object',
              description: 'Action content for the interactive message (buttons, sections, etc.)'
            }
          },
          required: ['to', 'type', 'body', 'action']
        }
      },
      {
        name: 'whatsapp_send_location',
        description: 'Send a location message',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number of the recipient with country code (e.g., "+1234567890")'
            },
            latitude: {
              type: 'number',
              description: 'Latitude coordinate of the location'
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate of the location'
            },
            name: {
              type: 'string',
              description: 'Optional name of the location'
            },
            address: {
              type: 'string',
              description: 'Optional address of the location'
            }
          },
          required: ['to', 'latitude', 'longitude']
        }
      },
      {
        name: 'whatsapp_mark_as_read',
        description: 'Mark a message as read',
        parameters: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              description: 'ID of the message to mark as read'
            }
          },
          required: ['messageId']
        }
      },
      {
        name: 'whatsapp_get_contact_info',
        description: 'Get basic information about a contact',
        parameters: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number with country code (e.g., "+1234567890")'
            }
          },
          required: ['phoneNumber']
        }
      },
      {
        name: 'whatsapp_get_business_profile',
        description: 'Get information about your WhatsApp Business profile',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'whatsapp_update_business_profile',
        description: 'Update your WhatsApp Business profile information',
        parameters: {
          type: 'object',
          properties: {
            about: {
              type: 'string',
              description: 'About text for the business profile'
            },
            address: {
              type: 'string',
              description: 'Business address'
            },
            description: {
              type: 'string',
              description: 'Business description'
            },
            email: {
              type: 'string',
              description: 'Business email'
            },
            websites: {
              type: 'array',
              description: 'Business websites'
            },
            vertical: {
              type: 'string',
              description: 'Business category/vertical'
            }
          }
        }
      }
    ];
  }

  // ========== Tool methods ==========

  /**
   * Get all available tools
   */
  getTools(): Plugin[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): Plugin | undefined {
    return this.tools.get(name);
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Plugin): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): boolean {
    const result = this.tools.delete(name);
    this.config.tools = Array.from(this.tools.values());
    return result;
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the number of registered tools
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(params);
  }

  /**
   * Initialize all registered tools
   */
  async initializeAll(): Promise<void> {
    // Initialize the plugin itself
    await this.init();
  }

  /**
   * Cleanup all registered tools
   */
  async cleanupAll(): Promise<void> {
    // Cleanup the plugin itself
    this.client = null;
  }

  /**
   * Get tool by full name (including prefix)
   */
  getToolByFullName(fullName: string): Plugin | undefined {
    return this.tools.get(fullName);
  }

  /**
   * Debug the plugin interface
   */
  public debugPluginInterface(): boolean {
    logger.info("WhatsApp Plugin", "Debug", `Plugin name: ${this.name}`);
    logger.info("WhatsApp Plugin", "Debug", `Plugin description: ${this.description}`);
    logger.info("WhatsApp Plugin", "Debug", `Client initialized: ${this.client !== null}`);
    logger.info("WhatsApp Plugin", "Debug", `Tools registered: ${this.tools.size}`);
    return true;
  }

  // ========== Implementation methods ==========

  /**
   * Send a text message
   */
  async sendMessage(params: Record<string, any>): Promise<{ success: boolean; messageId: string }> {
    // Validate required parameters
    if (!params.to || !params.message) {
      throw new Error('Missing required parameters: to, message');
    }

    try {
      const messageId = await this.client!.sendMessage(params.to, params.message);
      return { success: true, messageId };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Message", 'Error sending WhatsApp message');
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(params: Record<string, any>): Promise<{ success: boolean; messageId: string }> {
    // Validate required parameters
    if (!params.to || !params.templateName || !params.language) {
      throw new Error('Missing required parameters: to, templateName, language');
    }

    try {
      const messageId = await this.client!.sendTemplateMessage(params as TemplateMessageOptions);
      return { success: true, messageId };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Template", 'Error sending WhatsApp template message');
      throw error;
    }
  }

  /**
   * Send a media message
   */
  async sendMedia(params: Record<string, any>): Promise<{ success: boolean; messageId: string }> {
    // Validate required parameters
    if (!params.to || !params.type || (!params.url && !params.filePath)) {
      throw new Error('Missing required parameters: to, type, (url or filePath)');
    }

    try {
      const messageId = await this.client!.sendMedia(params as MediaMessageOptions);
      return { success: true, messageId };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Media", 'Error sending WhatsApp media');
      throw error;
    }
  }

  /**
   * Send an interactive message
   */
  async sendInteractiveMessage(params: Record<string, any>): Promise<{ success: boolean; messageId: string }> {
    // Validate required parameters
    if (!params.to || !params.type || !params.body || !params.action) {
      throw new Error('Missing required parameters: to, type, body, action');
    }

    try {
      const messageId = await this.client!.sendInteractiveMessage(params as InteractiveMessageOptions);
      return { success: true, messageId };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Interactive", 'Error sending WhatsApp interactive message');
      throw error;
    }
  }

  /**
   * Send a location message
   */
  async sendLocation(params: Record<string, any>): Promise<{ success: boolean; messageId: string }> {
    // Validate required parameters
    if (!params.to || params.latitude === undefined || params.longitude === undefined) {
      throw new Error('Missing required parameters: to, latitude, longitude');
    }

    try {
      const messageId = await this.client!.sendLocation(params as LocationMessageOptions);
      return { success: true, messageId };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Location", 'Error sending WhatsApp location message');
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(params: Record<string, any>): Promise<{ success: boolean }> {
    // Validate required parameters
    if (!params.messageId) {
      throw new Error('Missing required parameter: messageId');
    }

    try {
      const success = await this.client!.markMessageAsRead(params.messageId);
      return { success };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Read Status", 'Error marking WhatsApp message as read');
      throw error;
    }
  }

  /**
   * Get contact information
   */
  async getContactInfo(params: Record<string, any>): Promise<WhatsAppContact> {
    // Validate required parameters
    if (!params.phoneNumber) {
      throw new Error('Missing required parameter: phoneNumber');
    }

    try {
      return await this.client!.getContactInfo(params.phoneNumber);
    } catch (error) {
      logger.error("WhatsApp Plugin", "Contact", 'Error getting WhatsApp contact info');
      throw error;
    }
  }

  /**
   * Get business profile information
   */
  async getBusinessProfile(): Promise<any> {
    try {
      return await this.client!.getBusinessProfile();
    } catch (error) {
      logger.error("WhatsApp Plugin", "Profile", 'Error getting WhatsApp business profile');
      throw error;
    }
  }

  /**
   * Update business profile information
   */
  async updateBusinessProfile(params: Record<string, any>): Promise<{ success: boolean }> {
    try {
      const success = await this.client!.updateBusinessProfile(params);
      return { success };
    } catch (error) {
      logger.error("WhatsApp Plugin", "Profile", 'Error updating WhatsApp business profile');
      throw error;
    }
  }
} 