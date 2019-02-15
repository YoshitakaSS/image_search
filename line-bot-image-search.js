var PROPERTIES = PropertiesService.getScriptProperties();

var LINE_ACCESS_TOKEN = PROPERTIES.getProperty('LINE_ACCESS_TOKEN');
var BING_SEARCH_API_KEY = PROPERTIES.getProperty('BING_SEARCH_API_KEY');
var LINE_END_POINT = 'https://api.line.me/v2/bot/message/reply';

var reply_token;
var query;
var json;


// LINEから受け取ったテキストを元に、通信を受け取る
function doPost(e) {
  if (typeof e === "undefined") {
    reply_token = '';
    query = "橋本環奈";
  } else {
    // JSONデータを取得
    json = JSON.parse(e.postData.contents);
    Logger.log(json);
    // LINEから受け取ったreplytokenを取得
    reply_token = json.events[0].replyToken;
    // LINEから受け取ったテキストを取得
    query = json.events[0].message.text;
  }
  var imageList = getBingSearchImage(query);
  //Logger.log(imageList);
  
  // Logの定義
  for (var i in imageList) {
    Logger.log(imageList + "件目の画像をLINEに送信します");
    postImageToLine(imageList[i]);
    Logger.log(imageList[i] + "を送信しました");
  }
}



// Bing Search API を使用した関数
function getBingSearchImage(query) {
  var encodeQuery = encodeURI(query);
  var requestUrl = "https://api.cognitive.microsoft.com/bing/v7.0/images/search?"
  + "q=" + encodeQuery
  + "&count=" + 50
  + "&mkt=" + "ja-JP"
  + "safeSearch=" + "Moderate";
 
  Logger.log(requestUrl);
  
  var response = getData(requestUrl);
  var txt = response.getContentText();
  var json = JSON.parse(response);
  var values = json.value;
  //Logger.log(values);
  var valueList = [];
  
  // LINEに返す
  for (var i in values) {
    try {
      var name = values[i].name;
      var thumnailUrl = values[i].thumbnailUrl;

      var contentUrl = values[i].contentUrl;
      contentUrl = contentUrl.replace(/^http?\:\/\//i, "https://");     
      Logger.log(name);
      Logger.log(thumnailUrl);
      Logger.log(contentUrl);
      
      var photoData = [name, thumnailUrl, contentUrl];
      valueList.push(photoData);
      
      Logger.log(i + "枚目の画像を取得しました");
      } catch (e) {
      Logger.log("画像が取得できませんでした。　次の画像を取得します。");
    }
  }
  return valueList;
}

// APIに問い合わせる
function getData(requestUrl){
  var headers = {
    "Ocp-Apim-Subscription-Key": BING_SEARCH_API_KEY
  };
  
  var option = {
    "method" : "GET",
    'contentType' : 'application/json; charset=utf-8',
    "headers" : headers,
    "muteHttpExceptions": true
    }
  
  var response = UrlFetchApp.fetch(requestUrl, option);
  return response;
}

// LINEに返信するメソッド
function postImageToLine(image) {
    // LINEのボタンテンプレートAPIに今回対応する画像、動画、タイトルを入れる
    var messages = [{
      "type": "template",
      "altText": "画像の取得",
      "template": {
        "type": "buttons",
        "thumbnailImageUrl": image[1],
        "title": image[0],
        "text": "Please select",
        "actions": [
          {
            "type": "uri",
            "label": "詳しく見る",
            "uri": image[2]
          }
        ]
      }
    }];
   
    UrlFetchApp.fetch(LINE_END_POINT, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages,
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}