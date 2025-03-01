# SecureScript AI VS Code Extension

This extension integrates with the SecureScript AI platform to scan your code for security vulnerabilities directly from VS Code.

## Features

- Scan the current file for security vulnerabilities
- Scan selected code snippets
- View detailed vulnerability reports
- Generate and apply fixes for detected vulnerabilities

## Requirements

- An active SecureScript AI account
- API key for SecureScript AI (can be generated in the SecureScript AI web application)

## Extension Settings

This extension contributes the following settings:

* `securescriptAI.apiUrl`: URL of the SecureScript AI API (default: http://localhost:3001)
* `securescriptAI.apiKey`: API key for SecureScript AI (generate this in the SecureScript AI web application)

## Usage

1. Install the extension from the VS Code Marketplace
2. Open VS Code settings and search for "SecureScript AI"
3. Enter your API URL and API key
4. Open a file or select code you want to scan
5. Right-click and select "SecureScript AI: Scan Current File" or "SecureScript AI: Scan Selected Code"
6. View the results in the SecureScript AI panel
7. Generate and apply fixes for detected vulnerabilities

## Commands

- `securescript-ai.scanCurrentFile`: Scan the current file for security vulnerabilities
- `securescript-ai.scanSelection`: Scan the selected code for security vulnerabilities

## Getting an API Key

To use this extension, you need an API key from SecureScript AI:

1. Log in to your SecureScript AI account
2. Go to the API & Integrations page
3. Click "Create New API Key"
4. Enter a name for your key (e.g., "VS Code Extension")
5. Copy the generated API key and paste it into the extension settings

## Release Notes

### 0.1.0

Initial release of SecureScript AI extension with the following features:
- Code scanning for security vulnerabilities
- Vulnerability reporting
- Fix generation and application