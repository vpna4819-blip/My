addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    const targetUrl = new URL(url.pathname + url.search, 'https://gemini.google.com')

    const newHeaders = new Headers()
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase()
      if (!lowerKey.startsWith('cf-') && lowerKey !== 'host') {
        newHeaders.set(key, value)
      }
    }

    newHeaders.set('Host', 'gemini.google.com')
    newHeaders.set('Referer', 'https://gemini.google.com/')
    newHeaders.set('Origin', 'https://gemini.google.com')
    newHeaders.set('Accept-Encoding', 'gzip, deflate')

    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      redirect: 'manual'
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body
    }

    const response = await fetch(targetUrl.toString(), fetchOptions)

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete('content-security-policy')
    responseHeaders.delete('content-security-policy-report-only')
    responseHeaders.delete('x-frame-options')
    
    const setCookie = responseHeaders.get('set-cookie')
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie.replace(/Domain=[^;]+/gi, 'Domain=' + url.hostname))
    }

    const contentType = responseHeaders.get('content-type') || ''

    if (contentType.includes('text/html')) {
      const rewriter = new HTMLRewriter().on('head', {
        element(el) {
          el.append(`
            <style>
              /* 1. ജെമിനിയുടെ ഡാർക്ക് തീം വേരിയബിളുകളെ ലിക്വിഡ് ഗ്ലാസിലേക്ക് മാറ്റുന്നു */
              :root, html, body {
                --bard-color-surface: rgba(18, 22, 36, 0.45) !important;
                --bard-color-surface-container: rgba(255, 255, 255, 0.05) !important;
                --bard-color-surface-container-high: rgba(255, 255, 255, 0.08) !important;
                --color-background: transparent !important;
              }

              /* 2. ബാക്ക്ഗ്രൗണ്ട് ലിക്വിഡ് ഗ്രേഡിയന്റ് */
              body {
                background: radial-gradient(circle at 20% 20%, #1e1b4b 0%, #0b0f19 50%, #0d1e3a 100%) !important;
                background-attachment: fixed !important;
              }

              /* 3. സൈഡ് ബാർ (Side Navigation) ഗ്ലാസ് ലുക്ക് */
              side-navigation-v2, mat-sidenav, .side-nav-container {
                background: rgba(15, 23, 42, 0.5) !important;
                backdrop-filter: blur(16px) !important;
                -webkit-backdrop-filter: blur(16px) !important;
                border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
              }

              /* 4. ഇൻപുട്ട് ചാറ്റ് ഏരിയയും പ്ലസ് ഐക്കൺ ഉള്ള കണ്ടെയ്നറും */
              .input-area-container, rich-textarea, .text-input-field {
                background: rgba(255, 255, 255, 0.06) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-radius: 24px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
              }

              /* 5. പുതിയ ചാറ്റ് (+) ബട്ടൺ & മറ്റ് ഐക്കൺ ബട്ടണുകൾ */
              button, .mat-mdc-button-base, [role="button"] {
                backdrop-filter: blur(6px) !important;
                -webkit-backdrop-filter: blur(6px) !important;
                transition: all 0.2s ease !important;
              }

              /* 6. ജനറേറ്റ് ചെയ്യുന്ന ഉത്തരങ്ങളുടെ കണ്ടെയ്നർ കാർഡുകൾ */
              message-content, .response-container {
                background: rgba(255, 255, 255, 0.03) !important;
                backdrop-filter: blur(8px) !important;
                border-radius: 16px !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                padding: 12px !important;
              }
            </style>
          `, { html: true })
        }
      })

      return rewriter.transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      }))
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })

  } catch (error) {
    return new Response("Worker Exception Caught: " + error.message, { 
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  }
}
