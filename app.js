//This is still work in progress
/*
Please report any bugs to nicomwaks@gmail.com
i have added console.log on line 48
 */








const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var fs = require('fs');
var cookieParser = require('cookie-parser');
const app = express();
app.use(express.static('public'));
var gis = require('g-i-s');
const fb = require('./fb');



app.set('port', (process.env.PORT || 5000));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser());
var IDS = {}

// index
app.get('/', function (req, res) {
   res.end('');
});



// for facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'samer') {
        res.send(req.query['hub.challenge']);
        console.log(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong token');
    }
})

// to post data
app.post('/webhook/', function (req, res) {

   // console.log(cmds);
    var messaging_events = req.body.entry[0].messaging;
    console.log(messaging_events);
    res.sendStatus(200);
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;



        if (event.message && event.message.text) {

            var re;

            var text = event.message.text;
            console.log(text);
            text = text.trim().toLowerCase();
            
            if (sender in IDS) {
                  if (text == '-stop') {
                if (IDS[sender].s == 'p') IDS[sender].plist = [];
                else if (IDS[sender].s == 'v') IDS[sender].vlist = [];
            }
            
            else if (text == '-new') {
                delete IDS[sender];
            }
                else {
                    
                        var cmd = IDS[sender].s;
                if (cmd == 'p') photos(text,sender);
                else if (cmd == 'v') video(text,sender);
                else if (cmd == 'f') sendfile(text,sender);
                else {
                    delete IDS[sender];
                    fb.sendTextMessage(sender,'حديث خطأ الرجاء البدء من جديد');
                }
                    
                }
            
                return;
            }
           
            
            if (   text.indexOf('صور') + text.indexOf('photo') > -2 )
                {
                    
                    IDS[sender] = {s:'p'};
                    fb.sendTextMessage(sender,'اكتب عبارة البحث عن الصور');
                }
            else if ( (-4) < text.indexOf('video') + text.indexOf('youtube') + text.indexOf('فيديو') + text.indexOf('يوتيوب')) {
                IDS[sender] ={s:'v'};
                sendTextMessage(sender,'ماذا تريد من مفاطع الفيديو؟');
            }
            
            else if ( (-2) < text.indexOf('file') + text.indexOf('ملف')) {
                IDS[sender] = {s:'f'};
                fb.sendPhotoMessage(sender,'اكتب لي رابط الملف');
            }
            
           
            
            
            
            else {
                fb.sendTextMessage(sender,getHelp());
            }







        }
        if (event.postback) {
            var text = JSON.stringify(event.postback);
            fb.sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);
            continue;
        }
    }
    
});

// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.FB_PAGE_ACCESS_TOKEN

function photos(text,sender) {
    
    if (!text) return fb.sendTextMessage(sender,'لم اتعرف على النص,الرجاء كتابة عبارة صالحة')
    
    var re = 'انا الآن ابحث لك';



              fb.sendTextMessage(sender,re);
            
            search(text,function(resu) {
                re = 'وجدت لك'+resu.length+' صورة';
                fb.sendTextMessage(sender,re);
                IDS[sender].plist=resu;
                startSendPotos(sender);
            });

}


function video(text,sender) {
    if (!text) return fb.sendTextMessage(sender,'use:\nv:[video]');
    fb.sendTextMessage(sender,'working for '+text);
    srh_video(sender,text);
}

function sendfile(text,sender) {
    if (!text) return fb.sendTextMessage(sender,'use:\nu:[url]');
    fb.sendTextMessage(sender,'working for '+text);
}




function search(text,fn) {
    
    
    var list = [];
    gis(text, logResults);

function logResults(error, results) {
  if (error) {
    console.log(error);
  }
  else {
    for (var i in results)
        {
            list.push(results[i].url);
        }
      
      fn(list);
  }
}
    
    
    
}


function srh_video(sender,text) {
     var search_v = require('youtube-search');

var opts = {
  maxResults: 2,
  key: 'AIzaSyAPyZWOyC70TvVqJWAQVzsa6t1-b8T8gkY'
};

search_v('اختراق حسابات فيس ', opts, function(err, results) {
  if(err) return console.log(err);
    fb.sendVideo(sender,results[0]);
});
}


function startSendPotos(sender) {
    var f = function () {
        
        if (IDS[sender].list.length >= 1)
            {
                IDS[sender].list.push();
                fb.sendFileMessage(sender,{type:'image',url:IDS[sender][0]},f);
            }
            
        else {
            fb.sendTextMessage(sender,'ok');
        }
    }
    
    fb.sendFileMessage(sender,{type:'image',url:IDS[sender][0]},f);
}


function getHelp() {
    var txt = `مرحبا بك,
يمكنيي مساعدتك عبر الاوامر التالية:
اكتب صور للبحث عن صور
اكتب فيديو او يوتيوب للبحث عن فيديو في يوتيوب
اكتب ملف عندما تريدني ان ارفق لك ملف من رابط خاص
اكتب توقف للتوقف عن ارسال الفيديو او الصور
اكتب جديد للبدء من جديد`;
    return txt;
}


// spin spin sugar
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
});
