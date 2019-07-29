const balls = ['a','b','c','d','e','f','g']

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

function getBall(){
	var ballint = getRandomInt(2) + 1;
	if(ballint >= 12)
		return balls[6]
	if(ballint >= 10)
		return balls[5]
	if(ballint >= 8)
		return balls[4]
	if(ballint >= 6)
		return balls[3]
	if(ballint >= 4)
		return balls[2]
	if(ballint >= 2)
		return balls[1]
	return balls[0]
}

function getAllBalls(){
	var fullSet = new Set(['a','b'])
	var exSet = new Set()
	var numRuns = 0
	while(!eqSet(fullSet,exSet)){
		var ball = getBall()
		if(fullSet.has(ball)) exSet.add(ball)
		numRuns += 1
	}
	return numRuns
}
var sumRuns = 0;
const numRuns = 1000000;
for (var i = 0; i < 1000000; i++) {
	sumRuns += getAllBalls()
}
console.log(sumRuns/numRuns)