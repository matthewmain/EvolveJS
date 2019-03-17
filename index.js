

//////////////////////////////////////////////////////////////////////
//                                                                  //
//                            - SPOIDS -                            //
//                                                                  //
//          (POC: "Petri Dish" + DNA.js + Kill 'em! + Sex)          //
//                                                                  //
//////////////////////////////////////////////////////////////////////


// DNA.js Library: https://github.com/matthewmain/DNA
// DNA.js CDN Location: https://cdn.jsdelivr.net/gh/matthewmain/DNA@latest/dna.js
// Original "Petri Dish" pen: https://codepen.io/robbobfrh84/pen/ozgvzx 





/****************************** SETUP *******************************/

///canvas
var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
var cef = 2;  // canvas enlargement factor
canvas.width = window.innerWidth*cef;
canvas.height = window.innerHeight*cef;

///spoid (organism) settings
var initialPopulationCount = 10;
var imw = canvas.width*0.04;  // initial mature width
//var maxSpoids = 100;

///colors
var C = {
  bf: "245, 245, 245", // base color for females
  bm: "68, 255, 255",  // base color for males
  yf: "240, 229, 111",  // yellow for females
  ym: "255, 253, 147",  // yellow for males
  r: "255, 176, 176",  // red
};

var sc = [ "yellow", "base", "red" ];  // stripe colors

///Trackers
var spoids = [];
var spoidCount = 0;
var worldTime = 0;

///DNA.js
var spoidGenome = DNA.addGenome( "spoid", "sexual" );
DNA.addGene( spoidGenome, "matureWidth", "partial", "scale", imw, imw, imw*0.5, null );
DNA.addGene( spoidGenome, "stripeColor", "co", "count", 1, 5, 0, 2 );
DNA.addGene( spoidGenome, "litterSize", "complete", "count", 3, 3, 1, null );
DNA.mutationRate = 5;




/************************* SPOID PROTOTYPE **************************/


function Spoid( x, y, generation, genotype ) {  
  spoidCount++;
  this.id = spoidCount;
  this.father = null;
  this.mother = null;
  this.x = x;
  this.y = y;
  this.nx = x;  // new x
  this.ny = y;  // new y
  this.ys = 1;  // y step 
  this.xs = 1;  // x step
  this.speedArc = 0.5; 
  this.saMax = 0.2;  // speed arc max
  this.angle = rib(0,360);
  this.rotationSpeed = rfb(-0.01,0.01);
  this.generation = generation;
  this.birthTime = worldTime;
  this.maturityRatio = 0.1; // starting maturity ratio at birth
  this.isMature = false;
  this.isColliding = false;
  this.isReadyToReproduce = false;
  this.isAlive = true;
  this.isVisible = true;
  this.lifespan = rib(5000,10000);
  this.deathTime = null;
  //genes
  this.genotype = genotype;
  this.phenotype = DNA.generatePhenotype( this.genotype );
  this.sex = this.phenotype.sex;
  this.matureWidth = this.phenotype.matureWidthValue;
  this.stripeColorIndexes = shuffle(this.phenotype.stripeColorValues);  // as array: [<integer>,<integer>]
  this.litterSize = this.phenotype.litterSizeValue;
  //gene handling
  this.colorRgbVal = this.sex === "female" ? C.bf : C.bm;  // base color, determined by sex
  this.radius = (this.matureWidth/2) * this.maturityRatio;
}

Spoid.prototype.move = function() {
  var distX = Math.abs( this.x - this.nx );
  if ( distX > this.xs * this.speedArc ) {
    this.x = this.nx-this.x > 0 ? this.x+this.xs*this.speedArc : this.x-this.xs*this.speedArc;
    this.y = this.ny-this.y > 0 ? this.y+this.ys*this.speedArc : this.y-this.ys*this.speedArc;
    var distY = Math.abs( this.y - this.ny );
    var dist = Math.sqrt( distX*distX + distY*distY );
    if ( dist - this.radius*2 > 0) {
      this.speedArc = this.speedArc >= this.saMax ? this.saMax : this.speedArc * 1.05 ;
    } else {
      this.speedArc = this.speedArc >= 0.5 ? this.speedArc * 0.9 : 0.5;
    }
  } else {
    setSpoidPosition( this,random( 0, canvas.width), random( 0, canvas.height ) ); 
  }
};

Spoid.prototype.collisionCheck = function() {
  var atLeastOneCollision = false;
  spoids.forEach( (that)=> { 
    var touchDist = this.radius+that.radius;
    var xDist = Math.abs( this.x - that.x );
    var yDist = Math.abs( this.y - that.y );
    var dist = Math.sqrt( xDist*xDist + yDist*yDist );
    //collisions
    if ( this != that && dist <= touchDist ) {
      atLeastOneCollision = true;
      this.isColliding = true;
      //reproduction (mature opposite-sex partners reproduce if both otherwise isolated)
      if ( this.isMature && that.isMature && this.sex != that.sex ) {
        if ( this.isReadyToReproduce && that.isReadyToReproduce) { 
          this.isReadyToReproduce = false; that.isReadyToReproduce = false;  // keeps reproduction to once per contact
          this.reproduce( that ); 
        } 
      }
      // male attack (mature males kill smaller mature males)
      if ( this.isMature && that.isMature && this.sex === "male" && that.sex === "male") {
        if ( this.radius > that.radius ) { that.die(); } else { this.die(); }
      }
      // female attack (mature females kill children not their own)
      if ( this.isMature && this.sex === "female" && !that.isMature && that.mother != this ) {
        that.die();
      }
    }
  });
  if ( !atLeastOneCollision ) {
    this.isColliding = false;
    this.isReadyToReproduce = true;  // (re-)sets as ready for reproduction when isolated
  }
};

Spoid.prototype.reproduce = function( partner ) { 
  var litterSize = this.sex === "female" ? this.litterSize : partner.litterSize;
  for ( var i=0; i<litterSize; i++ ) {
    var childGenotype = DNA.meiosis( spoidGenome, this.genotype, partner.genotype );
    var x = this.x + (partner.x-this.x)/2;
    var y = this.y + (partner.y-this.y)/2;
    var babySpoid = new Spoid( x, y, this.generation+1, childGenotype );
    babySpoid.mother = this.sex === "female" ? this : partner;
    babySpoid.father = this.sex === "female" ? partner : this;
    spoids.push( babySpoid );

    console.log(babySpoid);
  }
};

Spoid.prototype.draw = function(){
  if ( this.isVisible ) {
    //clip mask
    ctx.save();  // saves the context state (for clip mask & rotation)
    ctx.beginPath();
    ctx.fillStyle = this.sex === "female" ? "rgba("+this.colorRgbVal+",0.8)" : "rgba("+this.colorRgbVal+",0.8)";
    ctx.arc( this.x, this.y, this.radius, 0, 2*Math.PI );
    ctx.fill();
    ctx.clip();  
    //position & rotation
    ctx.translate( this.x, this.y);
    ctx.rotate(this.angle);
    this.angle += this.rotationSpeed;
    //base background stripe
    ctx.beginPath();
    ctx.strokeStyle = this.sex === "female" ? "#ACB5B5" : "#2CB1B1";
    ctx.lineWidth = this.radius*0.025;
    ctx.fillStyle = setStripeColor( sc[ this.stripeColorIndexes[0] ], this.sex );
    ctx.moveTo( -this.radius, -this.radius*0.5 );
    ctx.lineTo( this.radius, -this.radius*0.4 );
    ctx.lineTo( this.radius, this.radius*0.5 );
    ctx.lineTo( -this.radius, this.radius*0.5 );
    ctx.stroke();
    ctx.fill();
    //internal stripes
    if ( this.stripeColorIndexes[0] != this.stripeColorIndexes[1] ) {
      ctx.beginPath();
      //ctx.translate( this.x, this.y);
      ctx.fillStyle = setStripeColor( sc[ this.stripeColorIndexes[1] ], this.sex );
      //top internal stripe
      ctx.moveTo( -this.radius, -this.radius*0.2 );
      ctx.lineTo( this.radius, -this.radius*0.23 );
      ctx.lineTo( this.radius, this.radius*0.1 );
      ctx.lineTo( -this.radius, -this.radius*0.05 );
      //bottom internal stripe
      ctx.lineTo( -this.radius, this.radius*0.1 );
      ctx.lineTo( this.radius, this.radius*0.25 );
      ctx.lineTo( this.radius, this.radius*0.33 );
      ctx.lineTo( -this.radius, this.radius*0.37 );
      ctx.fill();
    }
    ctx.restore();  // restores the context state (for clip mask & rotation)
    //inner light outline
    ctx.beginPath();
    ctx.strokeStyle = "rgb("+this.colorRgbVal+")";
    ctx.lineWidth = this.radius*0.05;
    ctx.arc( this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.stroke();
    //outer dark outline
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,32,32,0.2)";
    ctx.lineWidth = canvas.width*0.001;
    ctx.arc( this.x, this.y, this.radius*1.05, 0, 2*Math.PI);
    ctx.stroke();
  }
};

Spoid.prototype.age = function() {
  if ( !this.isMature ) {
    if ( this.maturityRatio < 1 ) {
      this.maturityRatio += 0.001;
      this.radius = (this.matureWidth/2) * this.maturityRatio;
    } else {
      this.isMature = true;
    }
  }
  if ( worldTime - this.birthTime >= this.lifespan || !this.isAlive ) {
    this.die();
  }
};

Spoid.prototype.die = function() {
  if ( this.isAlive ) kill( this );
  var timeSinceDeath = worldTime - this.deathTime;
  var flashSpeed = 6;
  var flashCount = 6;
  if ( timeSinceDeath % flashSpeed === 0 ) {
    this.isVisible = this.isVisible ? false : true;
  }
  if ( timeSinceDeath >= flashSpeed*flashCount ) {
    spoids = spoids.filter( (spoid)=> spoid.id !== this.id );
  }
};




/**************************** FUNCTIONS *****************************/


function setSpoidPosition( spoid, newX, newY ){ 
  spoid.speedArc = 0.5;
  spoid.nx = newX; 
  spoid.ny = newY;
  var distX = Math.abs( spoid.x - spoid.nx ); 
  var distY = Math.abs( spoid.y - spoid.ny );
  spoid.xs = distX / Math.max( distX, distY ); 
  spoid.ys = distY / Math.max( distX, distY );
} 

function setStripeColor( color, sex ) {
  switch ( color ) {
    case "yellow": return ( sex === "female" ) ? "rgb("+C.yf+")" : "rgb("+C.ym+")";
    case "base": return ( sex === "female" ) ? "rgb("+C.bf+")" : "rgb("+C.bm+")";
    case "red": return "rgb("+C.r+")";
  }
}

function kill( spoid ) {
  spoid.isAlive = false;
  spoid.isVisible = false;
  spoid.deathTime = worldTime;
}

function random( max, min ) {
  return Math.floor( Math.random() * (max-min+1) + min );
}

function shuffle( array ) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while ( 0 !== currentIndex ) {
    randomIndex = Math.floor( Math.random() * currentIndex );
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}





/****************************** EVENTS ******************************/


var noMove = setTimeout( ()=> {
  hover.innerHTML = "hover a spoid for info";
}, 1000 );
 
canvas.onmousemove = function() {
  var mx = event.offsetX;
  var my = event.offsetY;
  spoids.map( ( spoid, i )=> {
    if ( Math.abs(spoid.x/cef-mx) <= spoid.radius && Math.abs(spoid.y/cef-my) <= spoid.radius ) {
      hover.innerHTML = "Spoid #" + spoid.id;
      sex.innerHTML = spoid.sex;
      mother.innerHTML = spoid.mother ? "#"+spoid.mother.id : "(first gen)";
      father.innerHTML = spoid.father ? "#"+spoid.father.id : "(first gen)";
      maturity.innerHTML = spoid.isMature ? "adult" : "child";
      size.innerHTML = Math.round(spoid.radius*2);
      widthType.innerHTML = spoid.genotype.genes.matureWidth.expressionType;
      widthAlleleOne.innerHTML = Math.round(spoid.genotype.genes.matureWidth.allele1.value);
      widthAlleleTwo.innerHTML = Math.round(spoid.genotype.genes.matureWidth.allele2.value);
      widthExpression.innerHTML = Math.round(spoid.phenotype.matureWidthValue);
    }
  });
  clearTimeout( noMove );
  noMove = setTimeout( ()=> {
    hover.innerHTML = "hover a spoid for info";
  }, 2000 );
};

canvas.onclick = function() {
  var mx = event.offsetX;
  var my = event.offsetY;
  spoids.map( (spoid)=> {
    if ( Math.abs(spoid.x/cef-mx) <= spoid.radius/cef && Math.abs(spoid.y/cef-my) <= spoid.radius/cef ) {
      kill( spoid );
    }
  });
};



/********************* INITIATION &  DISPLAY ************************/


//initial population (from standard genotypes, then size randomized)
for ( var i=0; i<initialPopulationCount; i++ ) {
  var newSpoidGenotype = DNA.newStandardFirstGenGenotype( spoidGenome );
  var x = rfb(canvas.width*0.2,canvas.width*0.8);
  var y = rfb(canvas.height*0.2,canvas.height*0.8);
  var widthAllele1x = newSpoidGenotype.genes.matureWidth.allele1;
  var widthAllele2 = newSpoidGenotype.genes.matureWidth.allele2;
  widthAllele1x = DNA.mutate( spoidGenome, newSpoidGenotype.genes.matureWidth, widthAllele1x );  // randomizes size
  widthAllele2 = DNA.mutate( spoidGenome, newSpoidGenotype.genes.matureWidth, widthAllele2 );  // randomizes size
  var newSpoid = new Spoid( x, y, 1, newSpoidGenotype );
  newSpoid.maturityRatio = 1;
  newSpoid.isMature = true; 
  newSpoid.radius = (newSpoid.matureWidth/2);
  spoids[spoidCount-1] = newSpoid;
}

//displays scene
function display(){
  worldTime++;
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  spoids.forEach( (spoid)=> { 
    spoid.age(); 
    spoid.move(); 
    spoid.collisionCheck();
    spoid.draw();
  });
  population.innerHTML = "population: " + spoids.length;
  requestAnimationFrame( display );
}

console.log(spoids[0]);

display();














