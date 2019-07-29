const slots = [
  "cape","head","neck","ammo",
  "weapon","shield","body","legs",
  "hands","feet","ring","2h"
];
const bonusList = [
  "stabAttack", "slashAttack",
  "crushAttack", "magicAttack", "rangedAttack", "stabDefence",
  "slashDefence", "crushDefence","magicDefence", "rangedDefence",
  "strength", "rangedStrength", "magicStrength", "prayer"
];

const nullItem = {
  id: 0,
  name: null,
  slot: null,
  bonuses: Array(14).fill(0)
};

class Player{
  constructor(){
  	this.equipment = {};
    this.slots.forEach((slot) => {
      this.equipment[slot] = nullItem;
    });

    this.bonuses = Array(14).fill(0);
	}

    equip(item){
      if(slots.indexOf(item.slot) === -1){
        return false;
      }
      if(item.slot === "2h"){
        this.equipment.weapon = item;
        this.unequip("shield");
      }
      else if(item.slot ==="shield" && this.equipment.weapon.slot === "2h"){
        this.equipment[item.slot] = item;
        this.unequip("weapon");
      }
      else{
        this.equipment[item.slot] = item;
        this.update();
      }
    };

    unequip(slot){
      this.equipment[slot] = nullItem;
      this.update(); 
    };

    update(){
      var player = this;
      for (var i = 0; i < bonusList.length; i++) {
        var bonus = 0;
        slots.forEach(function(slot){
          bonus += player.equipment[slot].bonuses[i];
        });
        player.bonuses[i] = bonus;
      }
    }

    get slots(){
    	return slots
    }
    get bonusList(){
    	return bonusList
    }
}

module.exports = Player