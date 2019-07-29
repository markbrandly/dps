const db = require('./database.js')
const bonusList = ['stabAttack', 'slashAttack', 'crushAttack', 'magicAttack', 'rangedAttack', 'stabDefence', 'slashDefence', 'crushDefence', 'magicDefence', 'rangedDefence', 'strength', 'rangedStrength', 'magicStrength', 'prayer']

exports.searchItems = function(str, limit, fn){
	str = "%".concat(str).concat("%")
	const sql = "SELECT a.itemId as itemId, a.itemName as itemName, \
		a.itemType as itemType, b.imageName as icon \
		FROM rsitems.items a \
		left join rsitems.image b \
		on a.imageFull = b.imageId \
		WHERE a.itemName  \
		like ?  \
		ORDER BY a.itemName \
		LIMIT ?";
	const statSql = "SELECT * FROM rsitems.stat s WHERE s.itemId = ?";

	db.con.query(sql, [str,limit], function(error, results){
		var items = []
		const resLen = results.length
		results.forEach(function(itemRow){
			var itemObj = {}
			itemObj.name = itemRow.itemName
			itemObj.id = itemRow.itemId
			itemObj.slot = itemRow.itemType
			itemObj.bonuses = Array(bonusList.length).fill(0) // [0, 0, ... ,0]
			itemObj.icon = encodeURI(itemRow.icon)
			db.con.query(statSql, itemObj.id, function(error, res){
				res.forEach(function(stat){
					itemObj.bonuses[bonusList.indexOf(stat.category)] = stat.value;
				})
				items.push(itemObj)
				if(items.length == resLen) fn(items);
			})
		});
	});
}

exports.searchMonsterNames = function(str, limit, fn){
	str = "%".concat(str).concat("%")
	const sql = "select name from rsitems.monster \
		where name is not null and name like ? \
		group by name \
		limit ?";

	db.con.query(sql, [str,limit], (error,results) => {
		var nameList = results.map((result)=>{return result.name})
		fn(nameList)
	})
}

exports.getMonstersByName = function(str, fn){
	const sql="select a.name, a.wikiVersion, a.hitpoints, a.slayer, a.cbLvl, a.examine, b.localPath from rsitems.monster as a\
		left join rsitems.image as b\
    on a.imageId = b.imageId\
		where name = ?"

	db.con.query(sql, [str], (err, res) => {
		var monsList = []
		res.forEach((mon) => {
			var monObj = {}
			monObj.name = mon.name
			monObj.image = mon.localPath
			monObj.version = mon.wikiVersion
			monObj.slayer = mon.slayer
			monObj.hitpoints = mon.hitpoints
			monObj.cb = mon.cbLvl
			monObj.bonuses = Array(bonusList.length).fill(0)
			monsList.push(monObj)
		})
		fn(monsList)
	})
}