var HTMLParser = require('node-html-parser');
var mysql = require('mysql');

const https = require('https');
const bonusList = ['stabAttack', 'slashAttack', 'crushAttack', 'magicAttack', 'rangedAttack', 'stabDefence', 'slashDefence', 'crushDefence', 'magicDefence', 'rangedDefence', 'strength', 'rangedStrength', 'magicStrength', 'prayer']
const urls = [
['cape', 'https://oldschool.runescape.wiki/w/Cape_slot_table'],
['head', 'https://oldschool.runescape.wiki/w/Head_slot_table'],
['neck', 'https://oldschool.runescape.wiki/w/Neck_slot_table'],
['ammo', 'https://oldschool.runescape.wiki/w/Ammunition_slot_table'],
['weapon', 'https://oldschool.runescape.wiki/w/Weapon_slot_table'],
['shield', 'https://oldschool.runescape.wiki/w/Shield_slot_table'],
['body', 'https://oldschool.runescape.wiki/w/Body_slot_table' ],
['legs', 'https://oldschool.runescape.wiki/w/Legs_slot_table'],
['hands', 'https://oldschool.runescape.wiki/w/Hand_slot_table' ],
['feet', 'https://oldschool.runescape.wiki/w/Feet_slot_table' ],
['ring', 'https://oldschool.runescape.wiki/w/Ring_slot_table'],
['2h', 'https://oldschool.runescape.wiki/w/Two-handed_slot_table'],
]


var con = mysql.createConnection({
  host: "localhost",
	user: "root",
  password: "root"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  urls.forEach(getData)
});


function parseData(data){
	var dataList = []
	var parsed = HTMLParser.parse(data)
	var table = parsed.querySelector(".wikitable")
	table.querySelectorAll('tr').forEach(function(row){
		var rowList = []
		row.querySelectorAll('td').forEach(function(cell){
			rowList.push(cell.removeWhitespace().text)
		})
		dataList.push(rowList)
	})
	// console.log(JSON.stringify(dataList))
	dataList.shift()
	// dataList.splice(10)
	return dataList
	// console.log(parsed.querySelector(".wikitable").text)
}

function storeRow(row){
	var id = sqlCreateItem(row[0], 'cape')
}

function parseIntNoNull(a){
	var b = parseInt(a)
	if (isNaN(a)) return 0
	return b
}

function sqlCreateItem(itemData, type){
	console.log("creating")
	var sql = "INSERT INTO rsitems.items (itemName, pictureIcon, pictureFull, itemType) VALUES (?, null, null, ?); 	";
	var select = "SELECT itemId FROM rsitems.items WHERE itemName = ?;"
	var bonusSql = "INSERT INTO rsitems.stat (itemId, category, value) VALUES \
	((SELECT itemId FROM rsitems.items WHERE itemName = ?) ,?,?);"

	con.query(sql, [itemData[0], type], function(error, results, fields){
			for (var i = bonusList.length - 1; i >= 0; i--) {
				console.log(itemData[0], bonusList[i], itemData[i+2])
				con.query(bonusSql, [itemData[0], bonusList[i], parseIntNoNull(itemData[i+2])], function(){
					console.log(itemData[0], 'done')
				})
			}
	})

	// mysql.query(select, [name], function(error,results,fields){
	// 	console.log(results)
	// })
}

function sqlCreateState(){


}


function getData(info){
	https.get(info[1], (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    // console.log(data);
    parsed = parseData(data)
    console.log(parsed)
    parsed.forEach(function(item){
    	sqlCreateItem(item, info[0])
    })
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
}
