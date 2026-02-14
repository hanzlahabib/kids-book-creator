'use client'

import { useEffect } from 'react'

export default function ApiDocsPage() {
    useEffect(() => {
        // Load Swagger UI CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
        document.head.appendChild(link)

        // Load Swagger UI JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'
        script.onload = () => {
            // @ts-expect-error - SwaggerUIBundle is loaded via script tag
            window.SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    // @ts-expect-error - SwaggerUIBundle loaded globally
                    window.SwaggerUIBundle.presets.apis,
                ],
                layout: 'BaseLayout',
            })
        }
        document.body.appendChild(script)

        return () => {
            document.head.removeChild(link)
            document.body.removeChild(script)
        }
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '24px 16px 0',
                }}
            >
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: '#333',
                    }}
                >
                    📚 Kids Book Creator — API Reference
                </h1>
                <p style={{ color: '#666', marginBottom: 24 }}>
                    Interactive documentation for all REST API endpoints. Use the
                    &quot;Try it out&quot; button to test endpoints directly.
                </p>
            </div>
            <div id="swagger-ui" />
        </div>
    )
}
