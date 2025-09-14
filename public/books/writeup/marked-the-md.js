  const marked = require('marked');
  const fs = require('fs');

  const styles = `<style>
body {
  background-color: cadetblue;
  margin: 4vw; 
  max-width: 100%;
  box-sizing: border-box;
  font-size: 1vw;
}
@media (max-width: 1400px) {
  body {
    font-size: 4vw;
    background-color: burlywood;
  }
}

img {
  max-width: 80%; /* Changed from 80% */
  height: auto; /* Maintain aspect ratio */
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
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 10px; 
  margin: auto;
}

p, li, td {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>`;

  const markdown = fs.readFileSync('./books-writeup.md', 'utf8');
  const html = marked.parse(markdown);
  const styledHtml = styles + html;
  fs.writeFileSync('./index.html', styledHtml);