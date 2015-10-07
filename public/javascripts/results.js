var displayNewResults = function(displayElement, errElement, data) {
    if (data.results.length < 1) {
        $(displayElement).html('<p>No results found.</p>');
    } else {
        $.get('templates/results.stache', function(template) {
            var rendered = Mustache.render(template, data);
            displayElement.html(rendered);
        });
    }

    if (data.errors.length) {
        $.get('templates/errorAlert.stache', function(template) {
            var rendered = Mustache.render(template, data);
            errElement.html(rendered);
        });
    } else {
        $(displayElement).empty();
    }
}
