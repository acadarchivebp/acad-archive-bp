export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path'); 

    if (!filePath) return new Response("Missing path", { status: 400 });

    // 1. Construct the Hidden HF URL
    const hfUrl = `https://huggingface.co/datasets/acad-archive-bp-data/course-archive/resolve/main/${filePath}`;

    // 2. Fetch from HF using the Token
    const response = await fetch(hfUrl, {
      method: request.method,
      headers: {
        "Authorization": `Bearer ${env.HF_TOKEN}`,
        "User-Agent": "Course-Archiver-Bot"
      }
    });

    // 3. Check if file exists
    if (!response.ok) return new Response("File not found in Archive", { status: 404 });

    // 4. Stream back to user (Hide the origin)
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Disposition", `attachment; filename="${filePath.split('/').pop()}"`);
    
    // Clean up headers to hide Hugging Face traces
    newHeaders.delete("x-linked-etag"); 
    newHeaders.delete("x-amz-storage-class");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};