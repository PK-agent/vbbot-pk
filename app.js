const fetch = require('node-fetch');
const firebase = require("firebase-admin");
const express = require('express');
const ejs = require("ejs");
const body_parser = require('body-parser');
const { uuid } = require('uuidv4');
const {format} = require('util');
const multer  = require('multer');
const { response } = require('express');

const ViberBot  = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const UrlMessage = require('viber-bot').Message.Url;
const TextMessage = require('viber-bot').Message.Text;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;
const PictureMessage = require('viber-bot').Message.Picture;


const APP_URL = process.env.APP_URL;

//firebase initialize
firebase.initializeApp({
    credential: firebase.credential.cert({
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "project_id": process.env.FIREBASE_PROJECT_ID,
    }),
    databaseURL:process.env.FIREBASE_DB_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
let db = firebase.firestore(); 
const app = express(); 


let currentUser = {};
let currentUserProfile;



let adminKeyboard = {
        "Type": "keyboard",
        "Revision": 1,
        "Buttons": [
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "admin-add-price",               
                "Text": "ပေါက်ဈေး ထည့်ရန်",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "merch-entrylist",               
                "Text": "စာရင်းသွင်းထားသည့် ကုန်သည်များ",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "staff-entrylist",               
                "Text": "အလုပ်သမား ဝယ်ပြီးစာရင်း",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },                        
        ]
    };



let staffKeyboard = {
    "Type": "keyboard",
    "Revision": 1,
    "Buttons": [
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "tdy-pur-price",               
            "Text": "ယနေ့ အဝယ်ဈေးနှုန်း",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },         
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "booked-merchants-list",               
            "Text": "ဝယ်ယူရမည့် ကုန်သည်စာရင်း",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },
           
    ]
};

let merchantKeyboard = {
    "Type": "keyboard",
    "Revision": 1,
    "Buttons": [
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "tdy-merchant-price",               
            "Text": "ယနေ့ ပြောင်းပေါက်ဈေး",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "merch-book-inv",               
            "Text": "အရောင်းစာရင်း သွင်းရန်",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },            
    ]
};

// Creating the bot with access token, name and avatar
const bot = new ViberBot({
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: "ပြေင်းကြည့်",  // <--- Your bot name here
    avatar: "https://chat-pk.herokuapp.com/img/pk.png"
});

app.use("/viber/webhook", bot.middleware());

app.use(body_parser.json());
app.use(body_parser.urlencoded());
app.use('/img', express.static('img'));
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');



app.get('/',function(req,res){    
    res.send('your app is up and running');
});

app.get('/test2',function(req,res){   
    
   res.render('merchant-todayprice.ejs');
});


app.get('/merchant/register',function(req,res){   
      let data = {
        user_name: currentUser.name,
      } 
      console.log(currentUser);
     res.render('merchant-register.ejs', {data:data});
});


app.post('/merchant/register',function(req,response){   
    console.log(currentUser);
    currentUser.name = req.body.name;
    currentUser.phone = req.body.phone;
    currentUser.address = req.body.address;

    let data = {
        viberid: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address
    }

   
    db.collection('merchants').add(data)
    .then(()=>{
            let data = {
                   "receiver":currentUser.id,
                   "min_api_version":1,
                   "sender":{
                      "name":"PyaungKyi",
                      "avatar":"http://api.adorable.io/avatar/200/isitup"
                   },
                   "tracking_data":"tracking data",
                   "type":"text",
                   "text": "Thank you..."+req.body.name
                   
                }  
    
                fetch('https://chatapi.viber.com/pa/send_message', {
                    method: 'post',
                    body:    JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': process.env.AUTH_TOKEN },
                })
                .then(res => res.json())
                .then(json => console.log('JSON', json));
                
                const message = new TextMessage(`Please choose more actions...`, merchantKeyboard,null,null,null,3);  
                
                bot.sendMessage(currentUserProfile, message);
          
                

    }).catch((error)=>{
        console.log('ERROR:', error);
    });
           
});

app.get('/merchant/book-inventory', async (req,res) => {  
    const merchantsRef = db.collection('merchants');
    const snapshot = await merchantsRef.where('viberid', '==', currentUser.id).limit(1).get();
    // const snapshot = await usersRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }  
    let merchant = {};
    snapshot.forEach(doc => {        
        merchant.viberid = doc.data().viberid;
        merchant.name = doc.data().name;
        merchant.phone = doc.data().phone;         
        merchant.address = doc.data().address;  
    }); 

   res.render('merchant-book-inventory.ejs', {merchant:merchant});
});

app.post('/merchant/book-inventory', async (req,res) => {  
   
    let today = new Date();
    let merchant_id = req.body.merchant_id;

    let data = {
        created_on:today,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        corn_type: req.body.corn_type,
        corn_qty: req.body.corn_qty,
        wanted_price: req.body.wanted_price,
        comment: req.body.comment,
        received_date: req.body.received_date, 
        already_confirmed: false,    
        already_purchased: false,     
        merchant_id: merchant_id   
    }
   

    db.collection('merchant-books').add(data)
    .then(()=>{
        let data = {
               "receiver":currentUser.id,
               "min_api_version":1,
               "sender":{
                  "name":"PyaungKyi",
                  "avatar":"http://api.adorable.io/avatar/200/isitup"
               },
               "tracking_data":"tracking data",
               "type":"text",
               "text": "အော်ဒါလုပ်ခြင်းအောင်မြင်ပါသည်။ ကျေးဇူးတင်ပါသည်။..."+req.body.name
               
            }   

            fetch('https://chatapi.viber.com/pa/send_message', {
                method: 'post',
                body:    JSON.stringify(data),
                headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': process.env.AUTH_TOKEN },
            })
            .then(res => res.json())
            .then(json => console.log('JSON', json))
            
            
        }).catch((error)=>{
            console.log('ERROR:', error);
        });   
});

//admin/merchant/entrylist
app.get('/admin/merchant/book-list', async (req,res) => {

    const bookRef = db.collection('merchant-books');
    const booksSnapshot = await bookRef.get();
    
    let data = [];
    if (booksSnapshot.empty) {
      console.log('No matching documents.');
    }  
    else{
        booksSnapshot.forEach(doc => {

            let book = {};
            book.docId = doc.id;
            book.viberid = doc.data().viberid;
            book.name = doc.data().name;
            book.phone = doc.data().phone;         
            book.address = doc.data().address;
            book.corn_type = doc.data().corn_type;
            book.corn_qty = doc.data().corn_qty;
            book.wanted_price = doc.data().wanted_price;
            book.comment = doc.data().comment;
            book.received_date = doc.data().received_date;   
            book.already_confirmed = doc.data().already_confirmed;
            book.already_purchased = doc.data().already_purchased;
            data.push(book);       
        }); 
    }  

    res.render('merchant-bookList.ejs', {data});  
});


app.post('/admin/merchant/book-list', async (req,res) => {
    let action = req.body.action;

    if(action == "Confirm"){
        let docId = req.body.docId;
        let viberid = req.body.viberid;
        
        const bookRef = db.collection('merchant-books').doc(docId);
        bookRef.update({
            "already_confirmed": true
        })
        .then((result) => {
            console.log(result);
        })
        .catch((error) => {
            console.log(error);
        });
    }
    else{
        let docId = req.body.docId;

        const bookRef = db.collection('merchant-books').doc(docId);
        bookRef.delete()
        .then((result) => {
            console.log(result);
        })
        .catch((error) => {
            console.log(error);
        });
    }
});

//staff/merchant/entrylist

app.get('/staff/merchant/inventory-list', async (req,res) => {
    const staffsRef = db.collection('merchant-books');
    const booksSnapshot = await staffsRef.where('already_confirmed', '==', true).where('already_purchased', '==', false).get();
    // const snapshot = await usersRef.get();
    let data = [];
    if (booksSnapshot.empty) {
      console.log('No matching documents.');
    }  
    else{
        booksSnapshot.forEach(doc1 => {

            let confirm = {};
            confirm.docId = doc1.id;
            confirm.viberid = doc1.data().viberid;
            confirm.name = doc1.data().name;
            confirm.phone = doc1.data().phone;         
            confirm.address = doc1.data().address;
            confirm.corn_type = doc1.data().corn_type;
            confirm.corn_qty = doc1.data().corn_qty;
            confirm.wanted_price = doc1.data().wanted_price;
            confirm.comment = doc1.data().comment;
            confirm.received_date = doc1.data().received_date;  
            confirm.already_confirmed = doc1.data().already_confirmed;     
            confirm.already_purchased = doc1.data().already_purchased;    
            data.push(confirm);       
        }); 
    }  

    res.render('staff-merchantList.ejs', {data});  
});

app.get('/staff/merchant/add-inventory/:id', async (req,res) => {  
    
    let docId = req.params.id;

    let merchantBooksRef = db.collection('merchant-books').doc(docId);
    let merchantBooksSnapshot = await merchantBooksRef.get();

    let data = {};        
    if (!merchantBooksSnapshot.exists) {
        console.log('No such user!');        
    } else {     
      data.docId = merchantBooksSnapshot.id;
      data.merchantId = merchantBooksSnapshot.data().merchant_id;
      data.name = merchantBooksSnapshot.data().name;
      data.phone = merchantBooksSnapshot.data().phone;
      data.address = merchantBooksSnapshot.data().address;
      data.cornType = merchantBooksSnapshot.data().corn_type;
      
    }
    res.render('staff-Addinventory.ejs', {data:data}); 
    
});

app.post('/staff/merchant/add-inventory', async (req,res, next) => {  

    let today = new Date(); 
    let docId = req.body.doc_id;

    let data = {
        merchantId : req.body.merchant_id,
        created_on:today,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        corn_type: req.body.corn_type,
        corn_qty: req.body.corn_qty,
        purchased_price: req.body.purchased_price,
        comment: req.body.comment,
        received_date: req.body.received_date
    }

    db.collection('staff-purchased-list').add(data)
    .then(()=>{  
        console.log('-----------------------------------------------------------success');
        next();
    })
    .catch((error)=>{
        console.log('ERROR:', error);
    }); 
});


app.get('/admin/add-price',function(req,res){              
    
   res.render('adminAddprice.ejs');
});

app.post('/admin/add-price', async (req,res) => {  
    let today = new Date();
        let data = {
        created_on:today,
        date: req.body.filled_date,
        time: req.body.filled_time,
        corn_type: req.body.corn_type,
        quality_1: req.body.quality1,
        quality_2: req.body.quality2,
        quality_3: req.body.quality3,
        merchant_price: req.body.merchant_price       
        
    }   

    db.collection('market-prices').add(data)
    .then(()=>{
          console.log('success');

    }).catch((error)=>{
        console.log('ERROR:', error);
    }); 
});

app.get('/staff/todayprice',function(req,res){              
    
    res.render('staff-todayprice.ejs');
});

app.post('/staff/todayprice', async (req, res) => {
    let date = req.body.filled_date;
    let corn_quality = req.body.corn_quality;
    
    const marketPricesRef = db.collection('market-prices');
    const marketPricesSnapshot = await marketPricesRef.where('date', '==', date).get();
    
    let data = [];
    if (marketPricesSnapshot.empty) {
      console.log('No matching documents.');
    }  
    else{
        marketPricesSnapshot.forEach(doc => {

            let marketPrice = {};
            marketPrice.docId = doc.id;
            marketPrice.date = doc.data().date;
            marketPrice.corn_type = doc.data().corn_type;
            if(corn_quality === 'Q1'){
                marketPrice.price = doc.data().quality_1; 
            }
            else if(corn_quality === 'Q2'){
                marketPrice.price = doc.data().quality_2;
            }
            else {
                marketPrice.price = doc.data().quality_3;
            }      
            data.push(marketPrice);       
        }); 
    }

    res.render('staff-marketprices.ejs', {data});
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`webhook is listening`);
    bot.setWebhook(`${process.env.APP_URL}/viber/webhook`).catch(error => {
        console.log('Can not set webhook on following server. Is it running?');
        console.error(error);
        process.exit(1);
    });
});
 


bot.onError(err => console.log('ON ERR: ',err));


bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});

let KEYBOARD_JSON = {
        "Type": "keyboard",
        "DefaultHeight": true,
        "Buttons": [{
            "Columns": 6,
            "Rows": 1,
            "ActionType": "reply", // type of action
            "ActionBody": "register", // the value of the keyboard
            "Text": "Register", //this is text in keyboard
            "TextSize": "regular"
        }]
    };

let AdminCusStafKeyboard = {
    "Type": "keyboard",
    "BgColor": "#FFFFFF",
    "DefaultHeight": true,
    "Buttons": [
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "register",               
            "Text": "ပြောင်းကုန်သည်",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "stf-view",               
            "Text": "အလုပ်သမား",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        }, 
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "adm-view",               
            "Text": "Admin",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },

    ],
};

const message = new TextMessage("'ပြောင်းကြည့်' ပြောင်းအဝယ်စင်တာမှကြိုဆိုပါတယ်",AdminCusStafKeyboard,null,null,null,3);

bot.onConversationStarted((userProfile, isSubscribed, context) => {  
    // if(userProfile.id === "sXvG8AwXZmlLW7/LCSvMXw==")  {
    //     bot.sendMessage(userProfile, new TextMessage(`Hello, Admin ${userProfile.name}! Nice to meet you.`));
    // }
    // else{
        bot.sendMessage(userProfile,message);
    // }
});


/*
bot.onTextMessage(/^hi|hello$/i, (message, response) =>
    response.send(new TextMessage(`Hi there ${response.userProfile.name}. I am robot`)));
bot.onTextMessage(/^mingalarbar$/i, (message, response) =>
    response.send(new TextMessage(`Mingalarbar. Welcome to MCC`)));
 */
bot.onTextMessage(/^admin@/i, (message, response) =>{
    const text = message.text;
    let bot_message;
    let pw_enter = text.substring(6);

    if(pw_enter == process.env.ADMIN_PASSWORD){
        bot_message = new TextMessage(`အကောင့်ဝင်မှု့အောင်မြင်ပါသည်`, adminKeyboard);
    }else{
        asKAdminpin(message, response);
    }
    response.send(bot_message);
});

bot.onTextMessage(/^staff@/i, (message, response) =>{
    const text = message.text;
    let bot_message;
    let pw_enter = text.substring(6);

    if(pw_enter == process.env.STAFF_PASSWORD){
        bot_message = new TextMessage(`အကောင့်ဝင်မှု့အောင်မြင်ပါသည်`, staffKeyboard);
    }else{
        asKStaffpin(message, response);
    }
    response.send(bot_message);
});

bot.onTextMessage(/./, (message, response) => {

    currentUserProfile = response.userProfile;

    const text = message.text.toLowerCase();

    console.log(response.userProfile.id);

    currentUser.id = response.userProfile.id;
    currentUser.name = response.userProfile.name;

    console.log('CURRENT USER', currentUser);

    
    switch(text){
        case "register":
            registerMerchant(message, response);
            break;
        case "adm-view":
            asKAdminpin(message, response);
            break;
        case "stf-view":
            asKStaffpin(message, response);
            break;        
        case "merch-book-inv":
            merchantBookInventory(message, response);
            break;
        case "merch-entrylist":
            MerchantEntryList(message, response);
            break;
        case "reg-inv":
            customerTdyStock(message, response);
            break;
        case "booked-merchants-list":
            BookedMerchantList(message, response);
            break;
        case "admin-add-price":
            addMarketPrice(message, response);
            break;         
        case "staff-market-price":
            adminAddStaffPurchasePrice(message, response);
            break;
        case "tdy-merchant-price":
            test2(message, response);
            break;    
        case "tdy-pur-price":
            staffTodayPrice(message, response);
            break;
              
        default:
            defaultReply(message, response);
            
                
            
    }
});


/*
bot.onTextMessage(/view/, (message, response) => {
   viewTasks(message, response);  
});*/

const asKAdminpin= (message, response) => {
    response.send(new TextMessage(`admin စကား၀ှက်ရိုက်ထည့်ပါ`));
}

const asKStaffpin = (message, response) => {
    response.send(new TextMessage(`အလုပ်သမား စကား၀ှက်ရိုက်ထည့်ပါ`));
}



const addMarketPrice = (message, response) => {
    let bot_message = new UrlMessage(process.env.APP_URL + '/admin/add-price');   
    response.send(bot_message);
}

const adminAddStaffPurchasePrice = (message, response) => {    
    
    let bot_message = new UrlMessage(process.env.APP_URL + '/admin/staff-todayprice');   
    response.send(bot_message);
}

const test2 = (message, response) => {    

    let bot_message = new UrlMessage(process.env.APP_URL + '/test2');   
    response.send(bot_message);
}

const staffTodayPrice = (message, response) => {    

    let bot_message = new UrlMessage(process.env.APP_URL + '/staff/todayprice');   
    response.send(bot_message);
}

const merchantBookInventory = (message, response) => {    
    let bot_message1 = new TextMessage(`link ကိုနှိပ်ပြီးစာရင်းသွင်းရန်`);
    let bot_message2 = new UrlMessage(APP_URL + '/merchant/book-inventory');   
    response.send(bot_message1).then(() =>{
     return response.send(bot_message2)
    });
}

const MerchantEntryList = (message, response) => {    

    let bot_message = new UrlMessage(APP_URL + '/admin/merchant/book-list');   
    response.send(bot_message);
}

const BookedMerchantList = (message, response) => {    

    let bot_message = new UrlMessage(APP_URL + '/staff/merchant/inventory-list');   
    response.send(bot_message);
}





//https://developers.viber.com/docs/tools/keyboard-examples/



const registerMerchant = async (message, response) => {   

    const userRef = db.collection('merchants');    
    const snapshot = await userRef.where('viberid', '==', currentUser.id).limit(1).get();

    if (snapshot.empty) {
        let bot_message1 = new TextMessage(`အကောင့်ဝင်ရန် link ကိုနှိပ်ပါ`, ); 
        let bot_message2 = new UrlMessage(APP_URL + '/merchant/register');   
        response.send(bot_message1).then(()=>{
            return response.send(bot_message2);
        });
    }else{
        
          let bot_message3 = new TextMessage(`အကောင့်ဝင်ပြီးသားဖြစ်ပါသည်။ ကီးဘုတ်ကိုတွင်ရွေးချယ်ပါ`, merchantKeyboard);    
          response.send(bot_message3);
    }  
  
}


function defaultReply(message, response){
    let bot_message = new TextMessage(`Please select your activity in keyboard menu`, actionKeyboard); 

    response.send(new TextMessage(`I don't quite understand your command`)).then(()=>{
                   return response.send(bot_message);
            });
            
    }       

