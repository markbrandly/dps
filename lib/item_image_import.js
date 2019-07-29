var HTMLParser = require('node-html-parser');
var mysql = require('mysql');

const https = require('https');
const db = require('./database.js')
const urlBase = "https://oldschool.runescape.wiki"
const fs = require('fs');
const request = require('request');
const entities = require('html-entities').AllHtmlEntities


var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function getItemNames(fn){
	var sql = "SELECT itemName FROM rsitems.items where imageFull is Null order by itemName";
	db.con.query(sql, function(error, results){
		fn(results)
	})
}

function loadUrl(url, fn){
	https.get(url, (resp) => {
		let data = '';
		resp.on('data', (chunk) => {
			data += chunk;
		});

		resp.on('end', () => {
			fn(data);
		});
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
}

function getImageFileName(html){
	var splitto = html.split('{{Infobox Item')
	// console.log(splitto)
	if(splitto.length < 2)
		return -1
	splitto.shift()
	splitto = splitto[0]
	var openLen = splitto.indexOf("{{")
	var closeLen = splitto.indexOf("}}")

	while(openLen < closeLen){
		splitto = splitto.split("}}")
		splitto.shift()
		splitto = splitto.join("}}")
		openLen = splitto.indexOf("{{")
		closeLen = splitto.indexOf("}}")
	}
	splitto = splitto.split("}}")[1]
	splitto =splitto.split("[[")
	if(splitto.length < 2)
		return -1
	// console.log(splitto[1])
	splitto = splitto[1].split("|")[0]
	// console.log(splitto)
	return splitto
}

function getImageDownload(html){
	const root = HTMLParser.parse(html)
	const dlLink = root.querySelector(".internal");
	if(!dlLink)
		return -1
	return dlLink.attributes.href.split("?")[0];
}

function insertData(itemName, imageUrl, fn){
	// console.log("url: ", imageUrl)
	const imageName = imageUrl.split('/').pop()
	db.con.query("SELECT imageId FROM rsitems.image WHERE imageName = ?", imageName, function(error, results){
		if(results.length > 0){
			if(error) console.log(error);
			db.con.query("UPDATE rsitems.items SET imageFull = ? WHERE itemName = ?", [results[0].imageId, itemName], function(){
				console.log("Item:", itemName,"image set to", imageName)
				fn()
			});

		}
		else{
			const localPath = "./assets/item_images_detail/" + imageName
			download(imageUrl, localPath, function(){
				if (fs.existsSync(localPath)) {
					console.log(imageName, "downloaded successfully")
					db.con.query("INSERT INTO rsitems.image (imageName, localPath) VALUES (?, ?)", [imageName, localPath], function(error, results){
						if(!error)
							insertData(itemName, imageUrl, fn)
						else console.log(error)
					})
				}
			})
		}
	})
}

function prepUrl(url){
	return encodeURI(entities.decode(url.replace(/&amp;/g,"&")).replace(/ /g,"_")).replace(/&#39;/g,"%27");
}

const syncDownload = function(){
	getItemNames(function(results){
		if(results.length == 0)
			return -1
		results.splice(0,1).forEach(function(item){
			console.log("\nPrepping: ", item.itemName)
			var url = urlBase + '/w/' + item.itemName+ "?action=edit";
			url = prepUrl(url)
			// console.log(url)
			loadUrl(url, function(data){
				const imageUrl =  getImageFileName(data);
				if(imageUrl === -1)
					console.log("Could not find imageurl for", item.itemName)
				else
					loadUrl(prepUrl(urlBase + '/w/' + imageUrl), function(data){
						const dl = getImageDownload(data);
						if(dl == -1){
							console.log("Could not download", prepUrl(urlBase + '/w/' + imageUrl))
							return;
						}
						const imageDl = urlBase + getImageDownload(data)
						insertData(item.itemName, imageDl, syncDownload)
					});
			});
		});
	});
}

syncDownload()

// console.log(prepUrl('File:Ancient_d&amp;#39;hide_detail.png'));

// getItemNames(function(results){
// 	results.splice(0,1).forEach(function(item){
// 		var url = urlBase + '/w/' + item.itemName+ "?action=edit";
// 		url = prepUrl(url)
// 		loadUrl(url, function(data){
// 			const imageUrl =  getImageFileName(data);
// 			if(imageUrl === -1)
// 				console.log("Could not find imageurl for", item.itemName)
// 			else
// 				loadUrl(prepUrl(urlBase + '/w/' + imageUrl), function(data){
// 					const imageDl = prepUrl(urlBase + getImageDownload(data))
// 					insertData(item.itemName, imageDl)
// 				});
// 		});
// 	});
// });
