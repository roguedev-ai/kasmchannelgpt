export default function OembedTestPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">oEmbed Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test oEmbed Endpoints</h2>
          <p className="mb-4">Your oEmbed endpoints are now available at:</p>
          
          <div className="space-y-2">
            <div className="bg-white rounded p-3">
              <p className="font-mono text-sm">
                JSON: <a href="/api/oembed?url=https://starterkit.customgpt.ai&format=json" className="text-blue-600 hover:underline">
                  /api/oembed?url=https://starterkit.customgpt.ai&format=json
                </a>
              </p>
            </div>
            
            <div className="bg-white rounded p-3">
              <p className="font-mono text-sm">
                XML: <a href="/api/oembed?url=https://starterkit.customgpt.ai&format=xml" className="text-blue-600 hover:underline">
                  /api/oembed?url=https://starterkit.customgpt.ai&format=xml
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Embed in WordPress</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>In WordPress editor, switch to HTML/Code view</li>
            <li>Paste your site URL: <code className="bg-gray-200 px-2 py-1 rounded">https://starterkit.customgpt.ai</code></li>
            <li>WordPress will try to auto-embed using oEmbed</li>
            <li>If auto-embed fails, use the iframe code below</li>
          </ol>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Iframe Embed Code</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
{`<iframe 
  src="https://starterkit.customgpt.ai" 
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  title="CustomGPT.ai Starter Kit">
</iframe>`}
          </pre>
        </div>
      </div>
    </div>
  );
}