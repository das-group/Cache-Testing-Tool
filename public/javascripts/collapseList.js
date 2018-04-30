$("body").on("click",".collapseList", function(e){
    var list = $(this).next("ul.list")
    list.toggle();
})