// Google Apps Script - YAGO Sites 미러
function doGet() {
  var feedUrl = 'https://YOUR_DOMAIN/feed.json';
  var res = UrlFetchApp.fetch(feedUrl, { muteHttpExceptions: true });
  
  if (res.getResponseCode() !== 200) {
    return HtmlService.createHtmlOutput('<h1>피드를 불러올 수 없습니다</h1>');
  }
  
  var items = JSON.parse(res.getContentText());
  var t = HtmlService.createTemplateFromFile('index');
  t.items = items;
  return t.evaluate()
    .setTitle('YAGO Feed')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
