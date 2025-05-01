/**
 * WhatsApp Cloud API configuration options
 */
export interface WhatsAppConfig {
  /**
   * API Version
   */
  apiVersion?: string;
  
  /**
   * WhatsApp API access token
   */
  apiToken?: string;
  
  /**
   * WhatsApp phone number ID
   */
  phoneNumberId?: string;
  
  /**
   * WhatsApp Business Account ID
   */
  businessAccountId?: string;
  
  /**
   * Time in seconds to cache messages
   */
  cacheMessageSeconds?: number;
  
  /**
   * Time in seconds to cache contacts
   */
  cacheContactSeconds?: number;
  
  /**
   * Timeout for API requests in milliseconds
   */
  requestTimeout?: number;
}

/**
 * WhatsApp contact information
 */
export interface WhatsAppContact {
  /**
   * Contact ID (phone number with country code)
   */
  id: string;
  
  /**
   * Name of the contact if available
   */
  name?: string;
  
  /**
   * Whether the contact is a business account
   */
  isBusiness?: boolean;
  
  /**
   * Contact's profile picture URL (if available)
   */
  profilePictureUrl?: string;
}

/**
 * WhatsApp message representation
 */
export interface WhatsAppMessage {
  /**
   * Message ID
   */
  id: string;
  
  /**
   * Message body/text content
   */
  body: string;
  
  /**
   * Timestamp when the message was sent
   */
  timestamp: number;
  
  /**
   * Type of the message (text, image, document, etc.)
   */
  type: string;
  
  /**
   * ID of the sender
   */
  from: string;
  
  /**
   * Context information if this is a reply
   */
  context?: {
    messageId?: string;
    from?: string;
  };
  
  /**
   * Media information if message contains media
   */
  media?: {
    id?: string;
    url?: string;
    mimeType?: string;
    caption?: string;
    filename?: string;
  };
}

/**
 * WhatsApp template message parameters
 */
export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    code: string;
    amount: number;
  };
  dateTime?: {
    fallbackValue: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  video?: {
    link: string;
  };
}

/**
 * Template component
 */
export interface TemplateComponent {
  type: 'header' | 'body' | 'button' | 'footer';
  parameters?: TemplateParameter[];
  subType?: 'quick_reply' | 'url';
  index?: number;
  text?: string;
}

/**
 * Template message options
 */
export interface TemplateMessageOptions {
  /**
   * Recipient phone number
   */
  to: string;
  
  /**
   * Template name
   */
  templateName: string;
  
  /**
   * Template language
   */
  language: string;
  
  /**
   * Template components
   */
  components?: TemplateComponent[];
}

/**
 * Media message options
 */
export interface MediaMessageOptions {
  /**
   * Recipient phone number
   */
  to: string;
  
  /**
   * Caption for media
   */
  caption?: string;
  
  /**
   * Media URL
   */
  url?: string;
  
  /**
   * Media file path (for local files)
   */
  filePath?: string;
  
  /**
   * Media type
   */
  type: 'image' | 'document' | 'audio' | 'video' | 'sticker';
  
  /**
   * Filename (for documents)
   */
  filename?: string;
}

/**
 * Interactive message button
 */
export interface InteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

/**
 * Interactive message section
 */
export interface InteractiveSection {
  title?: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * Interactive message options
 */
export interface InteractiveMessageOptions {
  /**
   * Recipient phone number
   */
  to: string;
  
  /**
   * Type of interactive message
   */
  type: 'button' | 'list' | 'product' | 'product_list';
  
  /**
   * Header for the message
   */
  header?: {
    type: 'text' | 'image' | 'document' | 'video';
    text?: string;
    image?: {
      link: string;
    };
    document?: {
      link: string;
    };
    video?: {
      link: string;
    };
  };
  
  /**
   * Body text
   */
  body: {
    text: string;
  };
  
  /**
   * Footer text
   */
  footer?: {
    text: string;
  };
  
  /**
   * Action content
   */
  action: {
    buttons?: InteractiveButton[];
    button?: string;
    sections?: InteractiveSection[];
    catalogId?: string;
    productRetailerId?: string;
  };
}

/**
 * Location message options
 */
export interface LocationMessageOptions {
  /**
   * Recipient phone number
   */
  to: string;
  
  /**
   * Latitude
   */
  latitude: number;
  
  /**
   * Longitude
   */
  longitude: number;
  
  /**
   * Name of the location
   */
  name?: string;
  
  /**
   * Address of the location
   */
  address?: string;
}

/**
 * WhatsApp chat representation
 */
export interface WhatsAppChat {
  /**
   * Chat ID
   */
  id: string;
  
  /**
   * Chat name
   */
  name: string;
  
  /**
   * Is this a group chat
   */
  isGroup: boolean;
  
  /**
   * Timestamp of the last message
   */
  timestamp?: number;
  
  /**
   * Number of unread messages
   */
  unreadCount: number;
}

/**
 * Group creation options
 */
export interface GroupOptions {
  /**
   * Name of the group
   */
  name: string;
  
  /**
   * Array of participant IDs
   */
  participants: string[];
  
  /**
   * Optional description for the group
   */
  description?: string;
} 