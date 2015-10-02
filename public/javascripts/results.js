
var displayNewResults = function(displayElement, errElement, data) {
    // if (!data.results) ...

    if (data.results.length < 1) {
        $(resultsDisplay).html('<p>No results found.</p>');
    } else {
        $.get('templates/results.stache', function(template) {
            var rendered = Mustache.render(template, data);
            displayElement.html(rendered);
        });
    }

    if (data.error) {
        
    }
}
