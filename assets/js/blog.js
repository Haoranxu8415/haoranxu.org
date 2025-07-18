// blog.js - Load and render Markdown post

// Path to the Markdown file to be rendered (can be updated dynamically)
const markdownFile = 'posts/test post.md';

// Fetch the Markdown file and convert it to HTML using the marked library
fetch(markdownFile)
  .then(response => {
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Failed to load ${markdownFile}`);
    }
    return response.text();
  })
  .then(markdown => {
    // Parse the fetched Markdown content into HTML
    const html = marked.parse(markdown);
    document.getElementById('blog-content').innerHTML = html;
  })
  .catch(error => {
    // Display an error message if fetching or parsing fails
    document.getElementById('blog-content').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  });