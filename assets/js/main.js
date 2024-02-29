
function scrollIfNecessary() {
  if (window.location.hash.indexOf('scroll') === -1) {
    // get URLSearchParams of current location
    var searchParams = new URLSearchParams(window.location.search);
    const scroll = searchParams.get('scroll');
    if (scroll) {
      window.scrollTo(0, document.body.scrollHeight);
      searchParams.delete('scroll');
      const newUrl = window.location.pathname + '?' + searchParams.toString();
      window.history.replaceState({}, '', newUrl);
    }
  }
}

function fancyTextArea(textarea) {
  textarea.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && e.metaKey) {
      const button = textarea.nextElementSibling;
      button.click()
    }
  })
}

function fancyAllTextArea() {
  const textareas = document.querySelectorAll('textarea[fancy="true"]');
  for (const textarea of textareas) {
    fancyTextArea(textarea)
  }
}

function main() {
  scrollIfNecessary()
  fancyAllTextArea()
}

document.addEventListener('DOMContentLoaded', main);
