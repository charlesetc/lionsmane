document.addEventListener('DOMContentLoaded', function() {
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
});
