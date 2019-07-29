class Search{
  constructor(url, dataObj, fn){
    this.searchFn = fn;
    this.dataObj = dataObj;
    this.url = url
    this.name="test"
    dataObj.resList = []
    dataObj.showList = []
    console.log(this)
    this.keybound = 0
  }

  getList(){
    var localText = this.dataObj.searchText
    // if(localText.length < 3){
    //   this.clear()
    //   return
    // }
    var xhr = new XMLHttpRequest();
    xhr.onload = () => {
      console.log(localText, this.dataObj.searchText)
      if (xhr.status >= 200 && xhr.status < 300 && localText === this.dataObj.searchText) {
        console.log(xhr.response)
        this.searchFn(xhr.response, this)
        this.dataObj.selected=0
        this.keybind()
      } 
    }
    xhr.open('GET', this.url + "?like=" + localText + "&lim=5");
    xhr.send();
  }

  clear(){
    this.dataObj.resList.length = 0
    this.dataObj.showList.length = 0
  }

  highlight(index){
    console.log('asdas')
    this.dataObj.selected = index
  }

  select(index){
    var elem = document.getElementById(this.dataObj.elem)
    this.dataObj.selectFn(index,this)
    elem.querySelector(".auto-complete-input").value = ""
    this.clear()
    // console.log(this.dataObj.elem)
  }

  keybind(){
    if(this.keybound){
      console.log('keys are bound')
      return
    }
    console.log('binding the keys')
    this.keybound = 1
    var elem = document.getElementById(this.dataObj.elem)
    elem.addEventListener('keydown', (e) => {
      let l = this.dataObj.showList.length
      if(e.code === "ArrowDown"){
        e.preventDefault()
        this.dataObj.selected = (this.dataObj.selected + 1) % l
      }
      else if(e.code === "ArrowUp"){
        e.preventDefault()
        this.dataObj.selected = (((this.dataObj.selected - 1) % l) + l) % l
      }
      else if(e.code === "Enter"){
        console.log(elem)
        console.log(elem.querySelector('[data-index=' + this.selected + ']'))
        elem.querySelector('[data-index="' + this.dataObj.selected + '"]').click()
      }
    })
  }
}

module.exports = Search