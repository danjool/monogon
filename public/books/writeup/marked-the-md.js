  const marked = require('marked');
  const fs = require('fs');

  const styles = `<style>
  body {
    background-color: cadetblue;
    margin: 66px;
  }
  img {
    max-width: 80%;
    display: block;
    margin: auto;
  }
  h4 {
    font-style: italic;
    text-align: center;
    color: #555555; 
  }
  pre {
    background-color: bisque;
  }
</style>`;

  const markdown = fs.readFileSync('./books-writeup.md', 'utf8');
  const html = marked.parse(markdown);
  const styledHtml = styles + html;
  fs.writeFileSync('./writeup.html', styledHtml);