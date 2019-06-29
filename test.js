var a = "lala";

var b = new Date(a);
var c = new Date("2019-03-23T12:54:42.309Z");
console.log(b);
if (isNaN(b.getDate())){
    console.log("ok")
}