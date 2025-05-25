# Astreus WhatsApp Plugin

A WhatsApp integration plugin for the Astreus AI agent framework, allowing agents to interact with WhatsApp messaging using the official WhatsApp Cloud API.

## Features

- **Official WhatsApp Cloud API**: Uses Meta's official WhatsApp Cloud API for reliable messaging
- **Easy Authentication**: Simple token-based authentication with no QR code needed
- **Business Account Integration**: Full integration with WhatsApp Business features
- **Comprehensive WhatsApp Integration**: Send/receive messages, use templates, and more
- **Media Support**: Send images, documents, audio, and other media types
- **Interactive Messages**: Create rich interactions with buttons and list messages
- **Enhanced Logging**: Detailed logging of WhatsApp operations for improved debugging
- **Integration with Astreus Logger**: Consistent logging patterns with the core framework

## Installation

```bash
npm install @astreus-ai/whatsapp-plugin
```

## Configuration

Create a `.env` file with your WhatsApp Cloud API configuration:

```env
# WhatsApp Cloud API configuration
WHATSAPP_API_VERSION=v17.0
WHATSAPP_API_TOKEN=your_api_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# Cache configuration (in seconds)
CACHE_MESSAGE_SECONDS=300
CACHE_CONTACT_SECONDS=3600

# Default response timeout in milliseconds
DEFAULT_REQUEST_TIMEOUT=30000

# Logging options
LOG_LEVEL=info  # Options: error, warn, info, debug
```

To get these values:
1. Create a Meta Developer account at https://developers.facebook.com/
2. Create a WhatsApp Business app
3. Set up the WhatsApp Business API
4. Obtain the necessary credentials from the Meta Developer Dashboard

## Usage

### Basic Usage

```typescript
import { createAgent } from 'astreus';
import WhatsAppPlugin from '@astreus-ai/whatsapp-plugin';

// Create a WhatsApp plugin instance
const whatsAppPlugin = new WhatsAppPlugin();

// Initialize the plugin
await whatsAppPlugin.init();

// Create an agent with the WhatsApp plugin
const agent = await createAgent({
  name: 'WhatsApp Agent',
  description: 'An agent that can interact with WhatsApp',
  plugins: [whatsAppPlugin]
});

// Now the agent can use WhatsApp functionality
const response = await agent.chat(`Send a WhatsApp message to +1234567890 saying "Hello, how are you?"`);
```

### Custom Configuration

```typescript
import { createAgent } from 'astreus';
import WhatsAppPlugin from '@astreus-ai/whatsapp-plugin';

// Create a plugin with custom configuration
const whatsAppPlugin = new WhatsAppPlugin({
  apiVersion: 'v17.0',
  apiToken: 'your_api_token',
  phoneNumberId: 'your_phone_number_id',
  businessAccountId: 'your_business_account_id',
  cacheMessageSeconds: 600,
  logLevel: 'debug'  // Set logging verbosity
});

// Initialize the plugin
await whatsAppPlugin.init();

// Create an agent with the plugin
const agent = await createAgent({
  name: 'WhatsApp Agent',
  description: 'An agent that can interact with WhatsApp',
  plugins: [whatsAppPlugin]
});
```

## Available Tools

The WhatsApp plugin provides the following tools to Astreus agents:

- `whatsapp_send_message`: Send a text message to a contact
- `whatsapp_send_template`: Send a template message to a contact
- `whatsapp_send_media`: Send media (image, document, etc.) to a contact
- `whatsapp_send_interactive`: Send interactive messages with buttons or lists
- `whatsapp_send_location`: Send a location message
- `whatsapp_mark_as_read`: Mark a message as read
- `whatsapp_get_contact_info`: Get contact information
- `whatsapp_get_business_profile`: Get your WhatsApp Business profile information
- `whatsapp_update_business_profile`: Update your WhatsApp Business profile

## Debugging

The plugin includes logging capabilities to help troubleshoot issues. You can adjust the logging level using the `LOG_LEVEL` environment variable or by setting the `logLevel` option when creating the plugin instance.

## WhatsApp Cloud API Documentation

For more details on the WhatsApp Cloud API, refer to Meta's official documentation:
[WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

Astreus Team - [https://astreus.org](https://astreus.org)

Project Link: [https://github.com/astreus-ai/astreus-whatsapp-plugin](https://github.com/astreus-ai/astreus-whatsapp-plugin) 