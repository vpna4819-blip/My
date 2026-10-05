addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // ടാർഗെറ്റ് URL (നിങ്ങൾ ആവശ്യപ്പെട്ട Gemini URL)
  const targetUrl = 'https://gemini.google.com/app'

  // യഥാർത്ഥ വെബ്സൈറ്റിലേക്ക് റിക്വസ്റ്റ് അയക്കുന്നു
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
  })

  // HTMLRewriter ഉപയോഗിച്ച് ലിക്വിഡ് ഗ്ലാസ് തീം (CSS) ഉൾപ്പെടുത്തുന്നു
  return new HTMLRewriter().on('head', new GlassThemeInjector()).transform(response)
}

class GlassThemeInjector {
  element(element) {
    // ലിക്വിഡ് ഗ്ലാസ് തീം CSS ഇവിടെ നൽകുന്നു
    element.append(`
      <style>
        /* ബാക്ഗ്രൗണ്ട് മനോഹരമാക്കാൻ ഒരു ഡീഫോൾട്ട് വാൾപേപ്പറും ബ്ലർ എഫക്റ്റും */
        body {
          background: linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d) !important;
          background-size: 400% 400% !important;
          animation: gradientBG 15s ease infinite !important;
          color: #ffffff !important;
          margin: 0;
          height: 100vh;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* മനോഹരമായി ബ്ലർ ചെയ്ത ലിക്വിഡ് ഗ്ലാസ് ഡിസൈൻ */
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          z-index: -1;
        }

        /* വെബ്സൈറ്റിലെ പ്രധാന ഭാഗങ്ങൾക്ക് ഗ്ലാസ് എഫക്റ്റ് നൽകുന്നു */
        div, header, main, nav, section, article {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
        }

        /* ടെക്സ്റ്റുകൾ വ്യക്തമായി കാണാൻ */
        p, h1, h2, h3, h4, h5, h6, span, a {
          color: #ffffff !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }
      </style>
    `, { html: true })
  }
}
