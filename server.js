const http = require('http');
var path = require('path');
const api = require("./lib/api.js")
const watch = require("watch")

const hostname = '127.0.0.1';
const port = 3000;
const express = require('express')
const app = express()
const { exec } = require('child_process');

watch.watchTree('src', function(){
	console.log('doing it')
	exec('npm run webpack -- --mode production',function(err){
		if(err){
			console.log(err)
		}
		console.log('did it')
	})
})

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/build/html/index.html'));
});

app.get('/api/searchItems', function(req, res){
	if(!req.query.like){
		res.end();
		return
	}
	var str = req.query.like
	var limit = 5
	if(req.query.lim)
		limit = parseInt(req.query.lim)
    res.setHeader('Content-Type', 'application/json');
	api.searchItems(str, limit, function(results){
		res.send(results)
	})
})

app.get('/api/searchMonsterNames', function(req,res){
	if(!req.query.like){
		res.end();
		return
	}
	var str = req.query.like
	var limit = 5
	if(req.query.lim){
		limit = parseInt(req.query.lim)
	}
  res.setHeader('Content-Type', 'application/json');
	api.searchMonsterNames(str, limit, function(results){
		res.send(results)
	})
})

app.get('/api/getMonstersByName', function(req,res){
	if(!req.query.name){
		res.end();
		return;
	}
	var name = req.query.name
  res.setHeader('Content-Type', 'application/json');
	api.getMonstersByName(name, function(results){
		res.send(results)
	})
})

app.use(express.static('build'))
app.use('/assets', express.static('assets'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))