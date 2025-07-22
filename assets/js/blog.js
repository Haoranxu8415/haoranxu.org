const post1 = 'posts/post1.md';
const post2 = 'posts/post2.md';
const post3 = 'posts/post3.md';

function loadAndRenderMarkdown(file, elementId) {
  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${file}`);
      }
      return response.text();
    })
    .then(markdown => {
      markdown = markdown
        .replace(/^title:.*$\n?/gmi, '')
        .replace(/^date:.*$\n?/gmi, '')
        .replace(/^tags:.*$\n?/gmi, '');
      const html = marked.parse(markdown);
      document.getElementById(elementId).innerHTML = html;
    })
    .catch(error => {
      document.getElementById(elementId).innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    });
}

// 加载三篇文章
loadAndRenderMarkdown(post1, 'markdown-content');
loadAndRenderMarkdown(post2, 'markdown-content-2');
loadAndRenderMarkdown(post3, 'markdown-content-3');