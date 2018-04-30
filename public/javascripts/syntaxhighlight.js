$("pre code").each(function() {
    $(this).html($.trim($(this).html()));
});

$('textarea.highlight').each(function(i, block) {
    hljs.highlightBlock(block);
});

hljs.initHighlightingOnLoad();
