class Page {
    constructor(opt){
        this.data = JSON.parse($("#DataSet").val());
        this.init();
    }

    init(){
        console.log(this.data);
    }
}

var page = new Page();



