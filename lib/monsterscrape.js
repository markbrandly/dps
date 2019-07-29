var HTMLParser = require('node-html-parser');
var mysql = require('mysql');

const https = require('https');
const db = require('./database.js')
const urlBase = "https://oldschool.runescape.wiki"
const fs = require('fs');
const request = require('request');
const entities = require('html-entities').AllHtmlEntities
const bonusList = ['stabAttack', 'slashAttack', 'crushAttack', 'magicAttack', 'rangedAttack', 'stabDefence', 'slashDefence', 'crushDefence', 'magicDefence', 'rangedDefence', 'strengthBonus', 'rangedStrength', 'magicStrength', 'attBonus']
const statList = ['attack','strength','defence','mage','range']
function loadUrl(url, fn){
	console.log(url)
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

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function insertImage(imageUrl, fn){
	// console.log("url: ", imageUrl)
	const imageName = decodeURI(imageUrl.split('/').pop())
	db.con.query("SELECT imageId FROM rsitems.image WHERE imageName = ?", imageName, function(error, results){
		if(results.length > 0){
			if(error) console.log(error);
			fn(results[0].imageId)
		}
		else{
			const localPath = "./assets/monster_images/" + imageName
			download(imageUrl, localPath, function(){
				if (fs.existsSync(localPath)) {
					console.log(imageName, "downloaded successfully")
					db.con.query("INSERT INTO rsitems.image (imageName, localPath) VALUES (?, ?)", [imageName, localPath], function(error, results){
						console.log("Downloaded image",imageName)
						if(!error)
							insertImage(imageUrl, fn)
						else console.log(error)
					})
				}
			})
		}
	})
}

function getImageDownload(html){
	const root = HTMLParser.parse(html)
	const dlLink = root.querySelector(".internal");
	if(!dlLink)
		return -1
	return dlLink.attributes.href.split("?")[0];
}

function handleUrl(url, fn){
	loadUrl(url, (data) => {
		var monData = parseMonster(data)
		if(monData){
			monData.forEach(storeMonster)
		}

		fn()
	})
}

function genUrl(rawName){
	console.log(rawName)
	splitName = rawName.split('[[')
	if(splitName.length<2){
		console.log(rawName, 'can"t be parsed')
		return -1
	}
	var genName = "https://oldschool.runescape.wiki/w/" + (rawName.split('[[')[1]
		.split(']]')[0]
		.split("|")[0])
	.replace(/ /g,"_")

	genName = encodeURI(genName).replace(/%E2%80%8E/g,"");
	return genName
}

function handleImage(imageName, fn){
	loadUrl(genUrl(imageName),function(html){
		const url = getImageDownload(html)
		if(url !== -1)
			insertImage(urlBase + url, fn)
	})
}

function storeMonster(monData){
	db.con.query("select count(*) as isEntry from rsitems.monster where name = ? and wikiVersion = ?", [monData.name, monData.version], function(error, rows){
		if(!rows[0].isEntry){
			handleImage(monData.image, function(id){
				db.con.query("insert into rsitems.monster (name, wikiVersion, imageId, hitpoints, slayer, cbLvl, examine) \
					VALUES(?,?,?,?,?,?,?)", [monData.name, monData.version, id, monData.hitpoints || 0, monData.slaylvl, monData.combat, monData.examine], 
					function(err, res){

						if(err){
							console.log(err)
							return
						}
						db.con.query("Select idmonster from rsitems.monster where name = ? and wikiVersion = ?", [monData.name, monData.version], function(err, res){
							// console.log(res)
							if(!res.length) return
							const monId = res[0].idmonster
							if('weakness' in monData){
								var weaknesses = monData.weakness.split(", ");
								weaknesses = weaknesses.map(function(a){return a.split('[[').pop().split(']]')[0]});
								weaknesses.forEach(w => {
									db.con.query("insert into rsitems.monster_wkns (monsterId, weakness) values (?,?)",[monId,w])
								})
							}

							bonusList.forEach(b =>{
								db.con.query("insert into rsitems.monster_stat(monsterId,category,value) values (?,?,?)",
									[monId,b,monData.bonuses[bonusList.indexOf(b)] || 0])
							})


							statList.forEach(s =>{
								db.con.query("insert into rsitems.monster_stat(monsterId,category,value) values (?,?,?)",
									[monId,s,monData.bonuses[statList.indexOf(s)] || 0])
							})
							console.log("Monster",monData.name,monData.version,"complete")
						});
					});
						
			})
		}
	})
}

function parseMonster(data){
	var parsed = data.split('{{Infobox Monster');
	if (parsed.length < 2)
		return false
	parsed = parsed[1]
	var openIndex = parsed.indexOf('{{')
	var closedIndex = parsed.indexOf('}}')
	console.log(openIndex,closedIndex)
	while(openIndex < closedIndex && openIndex > -1){
		openIndex = parsed.indexOf('{{', closedIndex)
		closedIndex = parsed.indexOf('}}', closedIndex)
		// console.log('parsing..')
	}
	// return closedIndex
	parsed = parsed.slice(0,closedIndex)
	parsed = parsed.split('\n')
	var monsObj = {}
	parsed.forEach(function(attrStr){
		var spl = attrStr.split(" = ");
		if(spl.length<2)
			return
		spl[0] = spl[0].slice(1)
		monsObj[spl[0]] = spl[1]
	})
	var vnum = 1
	while("version" + (vnum+1) in monsObj){
		vnum += 1
	}
	var monsList = []
	var defaultObj = {}
	var attrs = ['name', 'version', 'image',
	'hitpoints', 'slaylvl', 'combat', 'weakness', 'examine']
	defaultObj['version'] = 'none'
	attrs.forEach((attr) => {
		if(attr in monsObj){
			defaultObj[attr] = monsObj[attr]
		}
	})

	const monBonuses = ['astab','slash','acrush','amagic','arange',
		'dstab', 'dslash', 'dcrush', 'dmagic', 'drange',
		'strbns', 'rngbns', 'mbns', 'attbns'
	]

	const monStats = ['att','str','def','mage','range']

	defaultObj.bonuses = Array(14).fill(0)
	defaultObj.stats = Array(5).fill(0)

	monBonuses.forEach((bonus) => {
		if(bonus in monsObj){
			defaultObj.bonuses[monBonuses.indexOf(bonus)] = monsObj[bonus]
		}
	});

	monStats.forEach((bonus) => {
		if(bonus in monsObj){
			defaultObj.stats[monStats.indexOf(bonus)] = monsObj[bonus]
		}
	});

	for (var i = 1; i <= vnum; i++) {
		var mon = Object.assign({}, defaultObj)
		mon.bonuses = [...defaultObj.bonuses]
		mon.stats = [...defaultObj.stats]
		attrs.forEach((attr) => {
			if(attr + i in monsObj){
				mon[attr] = monsObj[attr+i]
			}
		})

		monBonuses.forEach((bonus) => {
			if(bonus+i in monsObj){
				mon.bonuses[monBonuses.indexOf(bonus)] = monsObj[bonus+i]
			}
		});

		monStats.forEach((bonus) => {
			if(bonus+i in monsObj){
				mon.stats[monStats.indexOf(bonus)] = monsObj[bonus+i]
			}
		});
		monsList.push(mon)
	}
	return monsList
}


function handleAllUrls(urlList){
	handleNextUrl(urlList, 0)
}

function handleNextUrl(urlList, i){
	console.log(urlList[i])
	handleUrl(urlList[i], function(){

		if (urlList.length > i + 1) {
			handleNextUrl(urlList, i+1)
		}
		else{
			console.log('complete-o')
		}
	})
}

// var monData = handleUrl('https://oldschool.runescape.wiki/w/Black_demon?action=edit')
var urlList = ["/w/Doomion", "/w/Holthion", "/w/Kraka", "/w/Nazastarool", "/w/Possessed_Priest", "/w/Othanian", "/w/Pee_Hat", "/w/Troll_(Construction)", "/w/Animated_Mithril_Armour", "/w/Aviansie", "/w/Dagannoth_(Lighthouse)", "/w/Greater_demon", "/w/Ranalph_Devere", "/w/Scarab", "/w/Slagilith", "/w/Tortoise", "/w/Dust_devil", "/w/Scarab_mage", "/w/Werewolf", "/w/Bardur", "/w/Lesser_demon", "/w/Ankou", "/w/Mouse", "/w/Stranger", "/w/Treus_Dayth", "/w/Aberrant_spectre", "/w/Cave_bug", "/w/Ice_wolf", "/w/Summoned_soul", "/w/Armadylian_guard", "/w/Flaming_pyrelord", "/w/Skeleton_Hellhound", "/w/Ahrim_the_Blighted", "/w/Karil_the_Tainted", "/w/Locust_rider", "/w/Monkey_zombie", "/w/Nail_beast", "/w/Revenant_demon", "/w/Scarab_swarm", "/w/Wallasalki", "/w/Giant_frog", "/w/Soldier_(tier_5)", "/w/Wyrm", "/w/Agrith_Naar", "/w/Asyn_Shade", "/w/Dagannoth_mother", "/w/Giant_skeleton_(Lair_of_Tarn_Razorlor)", "/w/Ice_troll_grunt", "/w/Irvig_Senay", "/w/Terror_dog", "/w/Spawn_(Dragon_Slayer_2)"]
urlList = urlList.map((url)=>{return urlBase+url+'?action=edit'})
// console.log(urlList)
handleAllUrls(urlList)
// console.log(genUrl("[[File:Pirate (Asgarnian Ice Dungeon).png|120px]]"))
// loadUrl(encodeURI('https://oldschool.runescape.wiki/w/File:Undead_chicken.png‎'), ()=>{})
// console.log(encodeURI(genUrl('[[File:Undead chicken.png‎]]')), encodeURI('[[File:Undead chicken.png‎]]'))