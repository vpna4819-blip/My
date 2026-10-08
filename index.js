const TARGET_URL = "https://chatgpt.com/c/6ac764e8-deb8-83ec-800f-615aa2ae697b"; // നിങ്ങളുടെ വെബ്‌സൈറ്റ് ലിങ്ക് ഇവിടെ നൽകുക

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = new URL(TARGET_URL);

    url.hostname = target.hostname;
    url.protocol = target.protocol;

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    // ഒറിജിനൽ സൈറ്റിൽ നിന്ന് ഡാറ്റ എടുക്കുന്നു
    const response = await fetch(modifiedRequest);

    // HTML ഉള്ളടക്കത്തിൽ മാറ്റങ്ങൾ (CSS/UI) ചേർക്കാൻ HTMLRewriter ഉപയോഗിക്കാം
    return new HTMLRewriter()
      .on("head", {
        element(head) {
          // പുതിയ CSS ഇവിടെ ചേർക്കാം
          head.append(
            `<style>
              body { background-color: #f0f0f0 !important; }
            </style>`,
            { html: true }
          );
        },
      })
      .transform(response);
  },
};
