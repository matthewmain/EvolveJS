

///////////////////////////////////////////////////////////////////////
///////////////////////////////  DNA.JS  //////////////////////////////
///////////////////////////////////////////////////////////////////////

// A lightweight genetics library based on principles of Mendelian genetics.
// © Matthew Main 2019




///// Settings /////

var mutationRate = 5;  // (as average meiosis events per mutation; higher is less frequent)



///// Library Object /////

var DNA = {


  //species collection (a collection of genome objects by species name)
  Species: {},


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
  Genotype: function( genome ) {  // genome as object collection of genes as { traitName: <geneObject>, ... }
    for ( var gene in genome ) {
      this[gene] = genome[gene];
    } 
  },

  //phenotype (the organism, as a collection of gene expressions)
  Phenotype: function( genotype ) {  // genotype as object collection of genes as { traitName: <value>, ... }
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
  CreateGenome: function( speciesName ) {
    new DNA.Genome( speciesName );
  },

  //creates a new gene (with random, identical alleles) and stores it in the Genome object
  CreateGene: function( speciesName, geneName, initialValue, expressionType, mutationRange, mutationMin, mutationMax ) {
    var dominanceIndex = Math.random();  // randum decimal between 0 and 1
    var gene = new DNA.Gene( new DNA.Allele( initialValue, dominanceIndex ),  // allele1
                             new DNA.Allele( initialValue, dominanceIndex ),  // allele2
                             { range: mutationRange, min: mutationMin, max: mutationMax },  // mutationParameter
                             expressionType );  // expressionType
    DNA.Species[speciesName][geneName] = gene;
    return gene;
  },

  //mutates an allele (changes its value according to its expression type and within its mutation range)
  Mutate: function( geneName, alleleValue ) {
    var ra = Genome[geneName].mutationParameter.range;  // range
    var mn = Genome[geneName].mutationParameter.min;  // min
    var mx = Genome[geneName].mutationParameter.max;  // max
    var et = Genome[geneName].expressionType;  // expression type
    var mutatedAlleleVal;
    if (et === "complete") {
      mutatedAlleleVal = rib( alleleValue-ra/2, alleleValue+ra/2 );  // random integer value within mutation range
      if ( mutatedAlleleVal >= mn && ( mx === null || mutatedAlleleVal <= mx ) ) { alleleValue = mutatedAlleleVal; }
    } else if ( et === "partial" || et === "co") {
      mutatedAlleleVal = rfb( alleleValue-ra/2, alleleValue+ra/2);  // random decimal value within mutation range
      if ( mutatedAlleleVal >= mn && ( mx === null || mutatedAlleleVal <= mx ) ) { alleleValue = mutatedAlleleVal; }
    }
    return alleleValue;
  },

  //performs meiosis (creates new child genotype from parent genotypes)
  Meiosis: function( parentGenotype1, parentGenotype2 ) {
    var geneCollection = {};
    for ( var geneName in Genome ) {  // randomly selects one allele per gene from each parent genotype
      var parent1Allele = rib(1,2) === 1 ? parentGenotype1[geneName].allele1 : parentGenotype1[geneName].allele2;
      var parent2Allele = rib(1,2) === 1 ? parentGenotype2[geneName].allele1 : parentGenotype2[geneName].allele2;
      var newAllele1 = new DNA.Allele( parent1Allele.value, parent1Allele.dominanceIndex );
      var newAllele2 = new DNA.Allele( parent2Allele.value, parent2Allele.dominanceIndex );
      if ( rib( 1, mutationRate ) === 1 ) {  // handle mutations
        if ( rib(1,2) === 1 ) {
          newAllele1.value = mutate( geneName, newAllele1.value );
        } else {
          newAllele2.value = mutate( geneName, newAllele2.value );
        }
      }
      var newMutationParameter = parentGenotype1[geneName].mutationParameter;
      var newExpressionType = parentGenotype1[geneName].expressionType;
      geneCollection[geneName] = new DNA.Gene( newAllele1, newAllele2, newMutationParameter, newExpressionType );
    }
    var childGenotype = new DNA.Genotype( geneCollection );
    return childGenotype;
  },

  //generates a random genotype from a species' genome
  RandomGenotype: function( species ) {
    var newGenotype = {};
    for ( var geneName in species ) {
      newGenotype[geneName] = createGene( species[geneName].initialValue(), 
                                          species[geneName].mutationParameter, 
                                          species[geneName].expressionType );
    }
    return newGenotype;
  }


};



///// Helper Functions /////

//random integer between two numbers (min/max inclusive)
function rib( min, max ) {
  return Math.floor( Math.random() * ( Math.floor(max) - Math.ceil(min) + 1 ) ) + Math.ceil(min);
}

//random float between two numbers
function rfb( min, max ) {
  return Math.random() * ( max - min ) + min;
}



///// Notes /////

//*in this model, an entire genotype is contained on a single autosome





