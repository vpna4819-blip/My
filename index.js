export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // നിങ്ങളുടെ വർക്കറിലേക്ക് വരുന്ന പാത്തുകൾ അതുപോലെ gemini.google.com-ലേക്ക് റീറൂട്ട് ചെയ്യുന്നു
      const targetUrl = new URL(url.pathname + url.search, 'https://gemini.google.com');

      // ഹെഡറുകൾ തയ്യാറാക്കുന്നു
      const newHeaders = new Headers(request.headers);
      
      // പ്രധാന മാറ്റം: Host ഹെഡർ gemini.google.com ആക്കുന്നു (ഇല്ലെങ്കിൽ Error 1101 വരും)
      newHeaders.set('host', 'gemini.google.com');
      newHeaders.set('referer', 'https://gemini.google.com/');

      const requestInit = {
        method: request.method,
        headers: newHeaders,
        redirect: 'manual'
      };

      // GET, HEAD ഒഴികെയുള്ള റിക്വസ്റ്റുകൾക്ക് മാത്രം body നൽകുന്നു
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        requestInit.body = request.body;
      }

      // യഥാർത്ഥ ജെമിനി സൈറ്റിലേക്ക് റിക്വസ്റ്റ് അയക്കുന്നു
      const response = await fetch(targetUrl.toString(), requestInit);

      // സെക്യൂരിറ്റി ഹെഡറുകൾ ഒഴിവാക്കുന്നു
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('content-security-policy');
      responseHeaders.delete('content-security-policy-report-only');
      responseHeaders.delete('x-frame-options');

      // റീഡയറക്റ്റ് ഉണ്ടെങ്കിൽ അതിനെ ഹാൻഡിൽ ചെയ്യുന്നു
      const contentType = responseHeaders.get('content-type') || '';

      // റെസ്പോൺസ് HTML ആണെങ്കിൽ മാത്രം CSS ഇൻജക്റ്റ് ചെയ്യുന്നു (ക്രാഷ് ഒഴിവാക്കാൻ)
      if (contentType.includes('text/html')) {
        const rewriter = new HTMLRewriter().on('head', {
          element(el) {
            el.append(`
              <style>
                /* ബാക്ക്ഗ്രൗണ്ട് ഗ്രേഡിയന്റ് */
                body {
                  background: linear-gradient(135deg, #0f172a, #1e1b4b, #311042) !important;
                  background-attachment: fixed !important;
                  color: #e2e8f0 !important;
                }

                /* പ്രധാന കണ്ടെയ്നറുകൾക്ക് ഗ്ലാസ് എഫക്റ്റ് */
                main, [role="main"], nav, aside {
                  background: rgba(255, 255, 255, 0.05) !important;
                  backdrop-filter: blur(14px) !important;
                  -webkit-backdrop-filter: blur(14px) !important;
                  border: 1px solid rgba(255, 255, 255, 0.12) !important;
                  border-radius: 18px !important;
                }

                /* ഇൻപുട്ട് ഫീൽഡിന്റെ ഡിസൈൻ */
                textarea, [contenteditable="true"] {
                  background: rgba(255, 255, 255, 0.08) !important;
                  backdrop-filter: blur(8px) !important;
                  border: 1px solid rgba(255, 255, 255, 0.2) !important;
                  border-radius: 14px !important;
                  color: #ffffff !important;
                }
              </style>
            `, { html: true });
          }
        });

        return rewriter.transform(new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        }));
      }

      // മറ്റ് ഫയലുകൾ (JS, CSS, Images) സാധാരണ പോലെ റിട്ടേൺ ചെയ്യുന്നു
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (err) {
      // ക്രാഷ് ആയാൽ കാര്യം മനസ്സിലാക്കാൻ എറർ മെസ്സേജ് കാണിക്കുന്നു
      return new Response("Worker Error: " + err.message, { status: 500 });
    }
  }
};
