addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    
    // ടാർഗെറ്റ് ലിങ്ക് കൃത്യമായി സെറ്റ് ചെയ്യുന്നു
    const targetUrl = new URL(url.pathname + url.search, 'https://gemini.google.com')

    // ഹെഡറുകൾ ക്ലീൻ ചെയ്യുന്നു
    const newHeaders = new Headers()
    
    // ആവശ്യമുള്ള ഹെഡറുകൾ മാത്രം ഗൂഗിളിലേക്ക് കൈമാറുന്നു
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase()
      // ക്ലൗഡ്‌ഫ്ലെയർ ഡൊമൈൻ ഹെഡറുകൾ ഒഴിവാക്കുന്നു
      if (!lowerKey.startsWith('cf-') && lowerKey !== 'host') {
        newHeaders.set(key, value)
      }
    }

    // ഗൂഗിൾ ബ്ലോക്ക് ചെയ്യാതിരിക്കാൻ ആവശ്യമായ പ്രധാന ഹെഡറുകൾ
    newHeaders.set('Host', 'gemini.google.com')
    newHeaders.set('Referer', 'https://gemini.google.com/')
    newHeaders.set('Origin', 'https://gemini.google.com')
    // കംപ്രഷൻ എറർ വരാതിരിക്കാൻ ഡിഫ്ലേറ്റ് / gzip മാത്രം ചോദിക്കുന്നു
    newHeaders.set('Accept-Encoding', 'gzip, deflate')

    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      redirect: 'manual'
    }

    // GET, HEAD അല്ലാത്തവയ്ക്ക് മാത്രം ബോഡി പാസ് ചെയ്യുന്നു
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body
    }

    // ഗൂഗിളിലേക്ക് റിക്വസ്റ്റ് അയക്കുന്നു
    const response = await fetch(targetUrl.toString(), fetchOptions)

    // സെക്യൂരിറ്റി ഹെഡറുകൾ നീക്കം ചെയ്യുന്നു
    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete('content-security-policy')
    responseHeaders.delete('content-security-policy-report-only')
    responseHeaders.delete('x-frame-options')
    
    // കുക്കികൾ ക്ലൗഡ്‌ഫ്ലെയർ ഡൊമൈനിലേക്ക് മാറ്റുന്നു (ലോഗിൻ പിഴവ് വരാതിരിക്കാൻ)
    const setCookie = responseHeaders.get('set-cookie')
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie.replace(/Domain=[^;]+/gi, 'Domain=' + url.hostname))
    }

    const contentType = responseHeaders.get('content-type') || ''

    // വെബ് പേജ് HTML ആണെങ്കിൽ മാത്രം CSS മാറ്റങ്ങൾ നൽകുന്നു
    if (contentType.includes('text/html')) {
      const rewriter = new HTMLRewriter().on('head', {
        element(el) {
          el.append(`
            <style>
              /* ബാക്ക്ഗ്രൗണ്ട് ലിക്വിഡ് ഗ്ലാസ് തീം */
              body {
                background: linear-gradient(135deg, #0b0f19, #1a103c, #0d233a) !important;
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

              /* ഇൻപുട്ട് ചാറ്റ് ബോക്സ് */
              textarea, [contenteditable="true"] {
                background: rgba(255, 255, 255, 0.08) !important;
                backdrop-filter: blur(8px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 14px !important;
                color: #ffffff !important;
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

    // ഇമേജുകൾ, സ്ക്രിപ്റ്റുകൾ എന്നിവ സാധാരണപോലെ നൽകുന്നു
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })

  } catch (error) {
    // ഏതെങ്കിലും കാരണവശാൽ എറർ വന്നാൽ വർക്കർ ക്രാഷ് ആവാതെ സ്ക്രീനിൽ കാരണം കാണിക്കും
    return new Response("Worker Exception Caught: " + error.message, { 
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  }
}
