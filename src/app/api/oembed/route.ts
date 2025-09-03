import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const format = request.nextUrl.searchParams.get('format')
  
  // Basic validation
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  // Extract width and height from query params if provided
  const maxwidth = request.nextUrl.searchParams.get('maxwidth') || '800'
  const maxheight = request.nextUrl.searchParams.get('maxheight') || '600'
  
  // oEmbed response object
  const oembedResponse = {
    version: "1.0",
    type: "rich",
    provider_name: "CustomGPT.ai Starter Kit",
    provider_url: "https://customgpt.ai",
    title: "CustomGPT.ai Starter Kit - Full-Featured RAG Interface",
    author_name: "CustomGPT.ai",
    author_url: "https://customgpt.ai",
    html: `<iframe src="${url}" width="${maxwidth}" height="${maxheight}" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;" allowfullscreen title="CustomGPT.ai Starter Kit"></iframe>`,
    width: parseInt(maxwidth),
    height: parseInt(maxheight),
    thumbnail_url: "https://customgpt.ai/wp-content/uploads/2024/02/customgpt-logo.png",
    thumbnail_width: 200,
    thumbnail_height: 200
  }

  // Return XML format if requested
  if (format === 'xml') {
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<oembed>
  <version>${oembedResponse.version}</version>
  <type>${oembedResponse.type}</type>
  <provider_name>${oembedResponse.provider_name}</provider_name>
  <provider_url>${oembedResponse.provider_url}</provider_url>
  <title>${oembedResponse.title}</title>
  <author_name>${oembedResponse.author_name}</author_name>
  <author_url>${oembedResponse.author_url}</author_url>
  <html><![CDATA[${oembedResponse.html}]]></html>
  <width>${oembedResponse.width}</width>
  <height>${oembedResponse.height}</height>
  <thumbnail_url>${oembedResponse.thumbnail_url}</thumbnail_url>
  <thumbnail_width>${oembedResponse.thumbnail_width}</thumbnail_width>
  <thumbnail_height>${oembedResponse.thumbnail_height}</thumbnail_height>
</oembed>`

    return new NextResponse(xmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }

  // Default to JSON format
  return NextResponse.json(oembedResponse, {
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  })
}