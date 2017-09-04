class Index{
    constructor(){
        this.onload();
    }

    onload(){
        this.initBd();
        this.searchGo();
    }

    // 设置背景
    initBd(){
        const url = '/images/test.jpg'
        $("#container").css({
            minHeight:$(document).height(),
            // background:`url('${url}')`
        });
    }

    // 搜索
    searchGo(){
        $("#searchGo").click(function(){
            const val = $('#searchVal').val();
            if(val){
                location.href = `/movie/s=${encodeURI(val)}`;
            }else{
                console.log("0");
            };
        });
    }
}

const index = new Index();
