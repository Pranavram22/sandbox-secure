import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log('SecureScript AI extension is now active');

  // Register command to scan current file
  let scanCurrentFileCommand = vscode.commands.registerCommand('securescript-ai.scanCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const document = editor.document;
    const code = document.getText();
    const language = document.languageId;

    await scanCode(code, language);
  });

  // Register command to scan selected code
  let scanSelectionCommand = vscode.commands.registerCommand('securescript-ai.scanSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    const code = editor.document.getText(selection);
    const language = editor.document.languageId;

    if (!code) {
      vscode.window.showErrorMessage('No code selected');
      return;
    }

    await scanCode(code, language);
  });

  context.subscriptions.push(scanCurrentFileCommand, scanSelectionCommand);
}

async function scanCode(code: string, language: string) {
  try {
    // Get configuration
    const config = vscode.workspace.getConfiguration('securescriptAI');
    const apiUrl = config.get<string>('apiUrl');
    const apiKey = config.get<string>('apiKey');

    if (!apiUrl) {
      vscode.window.showErrorMessage('SecureScript AI API URL not configured. Please set it in the extension settings.');
      openSettings();
      return;
    }

    if (!apiKey) {
      vscode.window.showErrorMessage('SecureScript AI API key not configured. Please set it in the extension settings.');
      openSettings();
      return;
    }

    // Show progress
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'SecureScript AI',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: 'Scanning code for security vulnerabilities...' });

      try {
        // Call the SecureScript AI API
        const response = await axios.post(`${apiUrl}/api/scan`, {
          code,
          language
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        });

        const result = response.data;

        if (result.vulnerabilities && result.vulnerabilities.length > 0) {
          progress.report({ message: `Found ${result.vulnerabilities.length} vulnerabilities` });
          
          // Show results in a webview panel
          showResultsPanel(code, result.vulnerabilities, language, result.id, apiUrl, apiKey);
        } else {
          vscode.window.showInformationMessage('No vulnerabilities found in your code. Great job!');
        }
      } catch (error: any) {
        console.error('Error scanning code:', error);
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data?.error || 'Unknown error occurred';
          vscode.window.showErrorMessage(`Error: ${errorMessage}`);
        } else if (error.request) {
          // The request was made but no response was received
          vscode.window.showErrorMessage('Error: No response from server. Please check your API URL and network connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      }
    });
  } catch (error: any) {
    console.error('Error in scanCode:', error);
    vscode.window.showErrorMessage(`An unexpected error occurred: ${error.message}`);
  }
}

function openSettings() {
  vscode.commands.executeCommand('workbench.action.openSettings', 'securescriptAI');
}

function showResultsPanel(code: string, vulnerabilities: any[], language: string, scanId: string, apiUrl: string, apiKey: string) {
  const panel = vscode.window.createWebviewPanel(
    'securescriptResults',
    'SecureScript AI Results',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  // Generate HTML for the webview
  panel.webview.html = getWebviewContent(code, vulnerabilities, language, scanId, apiUrl, apiKey);

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async message => {
      switch (message.command) {
        case 'applyFix':
          try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              const edit = new vscode.WorkspaceEdit();
              const document = editor.document;
              
              // Replace the entire document with the fixed code
              edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                message.fixedCode
              );
              
              await vscode.workspace.applyEdit(edit);
              vscode.window.showInformationMessage('Fix applied successfully!');
            }
          } catch (error: any) {
            console.error('Error applying fix:', error);
            vscode.window.showErrorMessage(`Error applying fix: ${error.message}`);
          }
          break;
          
        case 'openSettings':
          openSettings();
          break;
          
        case 'showError':
          vscode.window.showErrorMessage(message.error);
          break;
      }
    },
    undefined,
    []
  );
}

function getWebviewContent(code: string, vulnerabilities: any[], language: string, scanId: string, apiUrl: string, apiKey: string) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#f87171';
      case 'medium':
        return '#fbbf24';
      case 'low':
        return '#34d399';
      default:
        return '#9ca3af';
    }
  };

  const vulnerabilitiesHtml = vulnerabilities.map((vuln, index) => `
    <div class="vulnerability" style="margin-bottom: 20px; padding: 15px; background-color: #1e293b; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="background-color: rgba(${vuln.severity === 'high' ? '239, 68, 68' : vuln.severity === 'medium' ? '245, 158, 11' : '16, 185, 129'}, 0.2); 
               color: ${getSeverityColor(vuln.severity)}; 
               padding: 2px 8px; 
               border-radius: 9999px; 
               font-size: 12px; 
               font-weight: 500;">
          ${vuln.severity.toUpperCase()}
        </span>
        <span style="color: #9ca3af; font-size: 12px;">Line ${vuln.line}</span>
      </div>
      
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
        ${vuln.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </h3>
      
      <p style="color: #d1d5db; margin-bottom: 12px;">${vuln.description}</p>
      
      <div style="background-color: #0f172a; padding: 10px; border-radius: 6px; margin-bottom: 12px;">
        <h4 style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Recommendation:</h4>
        <p style="font-size: 14px; color: #d1d5db;">${vuln.recommendation}</p>
      </div>
      
      ${vuln.cwe ? `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12px; color: #9ca3af; margin-right: 8px;">Reference:</span>
          <span style="background-color: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #d1d5db;">${vuln.cwe}</span>
        </div>
      ` : ''}
      
      ${vuln.resources && vuln.resources.length > 0 ? `
        <div style="margin-bottom: 12px;">
          <h4 style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Learn more:</h4>
          <div>
            ${vuln.resources.map((resource: any) => `
              <a href="${resource.url}" 
                 style="display: flex; align-items: center; font-size: 12px; color: #34d399; text-decoration: none; margin-bottom: 4px;"
                 target="_blank">
                <span style="margin-right: 4px;">↗</span>
                ${resource.title}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <button class="generate-fix-btn" 
              data-index="${index}" 
              style="background-color: #334155; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; margin-left: auto;">
        Generate Fix
        <span style="margin-left: 4px;">⚙️</span>
      </button>
      
      <div class="fix-container" data-index="${index}" style="display: none; margin-top: 12px;">
        <h4 style="font-size: 14px; color: #d1d5db; margin-bottom: 8px;">Suggested Fix:</h4>
        <pre class="fix-code" style="background-color: #0f172a; padding: 12px; border-radius: 6px; overflow-x: auto; margin-bottom: 12px; white-space: pre-wrap;"></pre>
        <button class="apply-fix-btn" 
                data-index="${index}" 
                style="background-color: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; margin-left: auto;">
          Apply Fix
          <span style="margin-left: 4px;">✓</span>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SecureScript AI Results</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          padding: 20px;
          color: #e2e8f0;
          background-color: #0f172a;
          line-height: 1.5;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
        }
        .summary {
          display: flex;
          margin-bottom: 24px;
          background-color: #1e293b;
          padding: 16px;
          border-radius: 8px;
        }
        .summary-item {
          flex: 1;
          text-align: center;
        }
        .summary-item h2 {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 8px;
        }
        .summary-item p {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        button {
          transition: background-color 0.2s;
        }
        button:hover {
          opacity: 0.9;
        }
        .loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <h1>SecureScript AI Scan Results</h1>
      
      <div class="summary">
        <div class="summary-item">
          <h2>Vulnerabilities</h2>
          <p>${vulnerabilities.length}</p>
        </div>
        <div class="summary-item">
          <h2>High Severity</h2>
          <p style="color: #f87171;">${vulnerabilities.filter(v => v.severity === 'high').length}</p>
        </div>
        <div class="summary-item">
          <h2>Medium Severity</h2>
          <p style="color: #fbbf24;">${vulnerabilities.filter(v => v.severity === 'medium').length}</p>
        </div>
        <div class="summary-item">
          <h2>Low Severity</h2>
          <p style="color: #34d399;">${vulnerabilities.filter(v => v.severity === 'low').length}</p>
        </div>
      </div>
      
      <div id="vulnerabilities">
        ${vulnerabilitiesHtml}
      </div>
      
      <script>
        const vscode = acquireVsCodeApi();
        const code = ${JSON.stringify(code)};
        const vulnerabilities = ${JSON.stringify(vulnerabilities)};
        const scanId = "${scanId}";
        const apiUrl = "${apiUrl}";
        const apiKey = "${apiKey}";
        
        // Add event listeners to generate fix buttons
        document.querySelectorAll('.generate-fix-btn').forEach(button => {
          button.addEventListener('click', async (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const vulnerability = vulnerabilities[index];
            
            // Show loading state
            e.currentTarget.innerHTML = '<span class="loading"></span> Generating...';
            e.currentTarget.disabled = true;
            
            try {
              // Call the API to generate a fix
              const response = await fetch(\`\${apiUrl}/api/fix\`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${apiKey}\`
                },
                body: JSON.stringify({
                  scan_id: scanId,
                  vulnerability_index: index
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate fix');
              }
              
              const data = await response.json();
              const fixedCode = data.fixed_code;
              
              // Show fix container
              const fixContainer = document.querySelector(\`.fix-container[data-index="\${index}"]\`);
              fixContainer.style.display = 'block';
              
              // Update fix code
              const fixCodeElement = fixContainer.querySelector('.fix-code');
              fixCodeElement.textContent = fixedCode;
              
              // Add event listener to apply fix button
              const applyFixBtn = fixContainer.querySelector('.apply-fix-btn');
              applyFixBtn.addEventListener('click', () => {
                vscode.postMessage({
                  command: 'applyFix',
                  fixedCode
                });
              });
            } catch (error) {
              console.error('Error generating fix:', error);
              vscode.postMessage({
                command: 'showError',
                error: \`Error generating fix: \${error.message}\`
              });
            } finally {
              // Reset button
              e.currentTarget.innerHTML = 'Generate Fix <span style="margin-left: 4px;">⚙️</span>';
              e.currentTarget.disabled = false;
            }
          });
        });
      </script>
    </body>
    </html>
  `;
}

export function deactivate() {}