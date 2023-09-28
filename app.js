const http = require("https");
const express = require("express");
const ejs = require("ejs");
const bodyParser = require('body-parser');
const { default: mongoose } = require("mongoose");

const app = express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static('public'));

mongoose.connect("mongodb://127.0.0.1:27017/storydb").then(()=>{
  console.log("connected...")
}).catch((err)=>{console.log(err)});

const searchSchema = {
  name : String,
  post : String
}


const storySchema = {
  upvotes : Number,
  name : String,
  postBody : String,
  comments : [searchSchema]
}
const Item = new mongoose.model("Item",storySchema);
const Search = new mongoose.model("Search",searchSchema);

app.get("/",(req,res)=>{
    Item.find().then((founditems)=>{
    function bubbleSort(arr, n)
      {
        var i, j, temp;
        var swapped;
        for (i = 0; i < n - 1; i++)
        {
            swapped = false;
            for (j = 0; j < n - i - 1; j++)
            {
                if (arr[j].upvotes < arr[j + 1].upvotes)
                {
                    // Swap arr[j] and arr[j+1]
                    temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
      
            // IF no two elements were
            // swapped by inner loop, then break
            if (swapped == false)
            break;
        }
      }
      bubbleSort(founditems, founditems.length)
      res.render("main",{arr : founditems})
    }).catch((err)=>{
      console.log(err);
    })

})

app.get("/posts/:story",(req,res)=>{
  const sName = req.params.story;
  // console.log(sName);
  Item.find().then((founditems)=>{
    var temp = false;
    founditems.forEach((element)=>{
      if(element.name == sName){
        temp=true;
        res.render("story",{name:sName , upvotes : element.upvotes , postBody : element.postBody , comments : element.comments});
      }
    })
    if(temp == false){
      console.log("data not found")
      res.redirect("/")
    }
  }).catch((err)=>{console.log(err)})
})

app.get("/compose",(req,res)=>{
  res.render("compose",{postBody : "You haven't got any story!"});
})

app.post("/compose",(req,res)=>{
    const sTitle = req.body.sTitle;

    if(req.body.button == "search"){
      const options = {
        "method": "POST",
        "hostname": "api.textcortex.com",
        "port": null,
        "path": "/v1/texts/blogs",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer gAAAAABlEr6DLZDNtHqnGXayo4VHS1mG_mZvKKW-PUh6zdykxofU2f7YEOCvp9_hCGzFLRwmPcEH26smhRgXDOcPfIdanAk0ur2Gzu82KxzngDpVjCZgQKkOCOtui08YDYPrD9wAJkmM"
        }
      };
      
      const request = http.request(options, function (response) {
        const chunks = [];
      
        response.on("data", function (chunk) {
          chunks.push(chunk);
        });
      
        response.on("end", function () {
          const body = Buffer.concat(chunks);
          const result1 = body.toString();
          const result2=JSON.parse(result1).data;

          const newHistory = new Search({
            name : sTitle,
            post : result2.outputs[0].text
          })
          newHistory.save();

          res.render("compose",{postBody : result2.outputs[0].text})
        });
      });
      
      request.write(JSON.stringify({
        context: sTitle,
        keywords: [],
        max_tokens: 200,
        model: 'chat-sophos-1',
        n: 1,
        source_lang: 'en',
        target_lang: 'en-us',
        temperature: 0.65,
        title: 'story'
      }));
      request.end();
    }
    else{
      Search.find().then((items)=>{
        const Item1 = new Item({
          upvotes : 0,
          name : items[items.length-1].name,
          postBody : items[items.length-1].post,
          comments : []
        })
        Item1.save();
      }).catch((err)=>{console.log(err)})
      res.redirect("/");
    }
      
})

app.post("/upvote",(req,res)=>{
  // console.log(req.body.postName);
  const postName = req.body.postName;
  Item.findOne({name : postName}).then((founditem)=>{
    founditem.upvotes ++;
    // console.log(founditem.upvotes);
    founditem.save();
  }).catch((err)=>{
    console.log(err)
  })

  res.redirect("/posts/"+postName);
})

app.post("/comment",(req,res)=>{
  const Name = req.body.Name;
  const comment = {
    name : req.body.pName,
    post : req.body.pComment
  }
  Item.findOne({name : Name}).then((founditem)=>{
    founditem.comments.push(comment);
    founditem.save();
  }).catch((err)=>{
    console.log(err)
  });
  res.redirect("/posts/"+Name);
})



const port= 3000;
app.listen(port,()=>{
    console.log("server is running on " + port);
})