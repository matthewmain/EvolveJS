

///////////////////////////////////////////////////////
/////////////////////  DNA.JS  ////////////////////////
///////////////////////////////////////////////////////

// A lightweight genetics library based on principles of Mendelian inheritance.
// © Matthew Main 2019




/////-- Library Object --/////
 
var DNA = {


  //species collection (a collection of genome objects by species name)
  Species: {},


  //// Settings ////

  mutationRate: 5, // (as average meiosis events per mutation; higher is less frequent)


  //// Object Constructors ////

  //allele (a trait; e.g., brown eyes)
  Allele: function( value, dominanceIndex ) {
    this.value = value;
    this.dominanceIndex = dominanceIndex;
  },

  //gene locus (a feature; e.g. eye color)
  Gene: function( allele1, allele2, mutationParameter, expressionType ) {
    this.allele1 = allele1;
    this.allele2 = allele2;
    this.mutationParameter = mutationParameter;  // (as object: { range: <range>, min: <min>, max: <max> } )
    this.expressionType = expressionType;  // (can be "complete", "co", or "partial")
  },

  //genome (all of a species' genes; i.e., a blueprint for a generic body)
  Genome: function( speciesName ) {
    DNA.Species[speciesName] = {};
  },

  //genotype (all of an organism's allele pairs; i.e., a blueprint for a specific body*) 
  Genotype: function( species ) {  // species genome as object collection of genes: { traitName: <geneObject>, ... }
    for ( var gene in species ) {
      this[gene] = species[gene];
    } 
  },

  //phenotype (all of an organism's expressed traits; i.e., a body)
  Phenotype: function( genotype ) {  // genotype as object collection of genes: { traitName: <value>, ... }
    for ( var gene in genotype ) {
      if ( genotype[gene].expressionType === "complete" ) {  // expresses dominant allele value only (1,2 -> 2)
        var dominanceDifference = genotype[gene].allele1.dominanceIndex - genotype[gene].allele2.dominanceIndex;
        this[gene+"Value"] = dominanceDifference >= 0 ? genotype[gene].allele1.value : genotype[gene].allele2.value;
      } else if ( genotype[gene].expressionType === "partial" ) {  // expresses average of allele values (1,2 -> 1.5)
        this[gene+"Value"] = ( genotype[gene].allele1.value + genotype[gene].allele2.value ) / 2;
      } else if ( genotype[gene].expressionType === "co" ) {  // expresses combination of allele values (1,2 -> 1&2)
        //(handle case by case)
      }
    }
  },


  //// Methods ////

  //adds a new species genome to the collection of species objects
  addGenome: function( speciesName ) {
    return new DNA.Genome( speciesName );
  },

  //adds a new gene (with identical prototype alleles of neutral dominance) and stores it in the Genome object
  addGene: function( species, geneName, initialValue, expressionType, mutationRange, valueMin, valueMax ) {
    var gene = new DNA.Gene( new DNA.Allele( initialValue, 0.5 ),  // allele1 prototype
                             new DNA.Allele( initialValue, 0.5 ),  // allele2 prototype
                             { range: mutationRange, min: valueMin, max: valueMax },  // mutationParameter
                             expressionType );  // expressionType
    DNA.Species[species][geneName] = gene;
    return gene;
  },

  //creates a new first-generation genotype from a species genome
  newGenotype: function( species ) {
    return new this.Genotype( species );
  },

  //generates a phenotype from a genotype
  generatePhenotype: function( genotype) {
    return new this.Phenotype( genotype );
  },

  //mutates an allele (changes its value according to its expression type and within its mutation range)
  mutate: function( species, geneName, allele ) {
    var ra = species[geneName].mutationParameter.range;  // range of a single mutation
    var mn = species[geneName].mutationParameter.min;  // min value (mutation cannot go below)
    var mx = species[geneName].mutationParameter.max;  // max value (mutation cannot go above)
    var et = species[geneName].expressionType;  // expression type
    var originalAlleleVal = allele.value;
    var mutatedAlleleVal;
    if (et === "complete") {
      mutatedAlleleVal = rib( allele.value-ra/2, allele.value+ra/2 );  // random integer value within mutation range
      if ( mutatedAlleleVal >= mn && ( mx === null || mutatedAlleleVal <= mx ) ) { 
        allele.value = mutatedAlleleVal; 
      }
    } else if ( et === "partial" || et === "co") {
      mutatedAlleleVal = rfb( allele.value-ra/2, allele.value+ra/2);  // random decimal value within mutation range
      if ( mutatedAlleleVal >= mn && ( mx === null || mutatedAlleleVal <= mx ) ) { 
        allele.value = mutatedAlleleVal; 
      }
    }
    if ( allele.value != originalAlleleVal ) { allele.dominanceIndex = Math.random(); }
    return allele;
  },

  //performs meiosis (returns a new child genotype from parent genotypes)
  meiosis: function( species, parentGenotype1, parentGenotype2 ) {
    if ( parentGenotype2 === undefined ) parentGenotype2 = parentGenotype1;  // handles asexual reproduction
    var genes = {};
    for ( var gene in species ) {  // randomly selects one allele per gene from each parent genotype
      var parent1Allele = rib(1,2) === 1 ? parentGenotype1[gene].allele1 : parentGenotype1[gene].allele2;
      var parent2Allele = rib(1,2) === 1 ? parentGenotype2[gene].allele1 : parentGenotype2[gene].allele2;
      var newAllele1 = new DNA.Allele( parent1Allele.value, parent1Allele.dominanceIndex );
      var newAllele2 = new DNA.Allele( parent2Allele.value, parent2Allele.dominanceIndex );
      if ( rib( 1, this.mutationRate ) === 1 ) {  // handle mutations
        if ( rib(1,2) === 1 ) {
          newAllele1 = this.mutate( species, gene, newAllele1 );
        } else {
          newAllele2 = this.mutate( species, gene, newAllele2 );
        }
      }
      var newMutationParameter = parentGenotype1[gene].mutationParameter;
      var newExpressionType = parentGenotype1[gene].expressionType;
      genes[gene] = new DNA.Gene( newAllele1, newAllele2, newMutationParameter, newExpressionType );
    }
    var childGenotype = new DNA.Genotype( genes );
    return childGenotype;
  },


};



/////-- Helper Functions --/////

//random integer between two numbers (min/max inclusive)
function rib( min, max ) {
  return Math.floor( Math.random() * ( Math.floor(max) - Math.ceil(min) + 1 ) ) + Math.ceil(min);
}

//random float between two numbers
function rfb( min, max ) {
  return Math.random() * ( max - min ) + min;
}



/////-- Notes --/////

//*in this model, an entire genotype is contained on a single autosome





